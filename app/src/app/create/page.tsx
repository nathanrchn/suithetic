"use client";

import * as z from "zod";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import DatasetInput from "@/components/dataset-input";
import { zodResolver } from "@hookform/resolvers/zod";
import { Transaction } from "@mysten/sui/transactions";
import DatasetViewer from "@/components/dataset-viewer";
import { fromHex, MIST_PER_SUI, toHex } from "@mysten/sui/utils";
import { getAllowlistedKeyServers, SealClient } from "@mysten/seal";
import { AtomaModel, GenerationConfig, HFDataset, SyntheticDataResultItem } from "@/lib/types";
import { TESTNET_PACKAGE_ID, TESTNET_SUITHETIC_OBJECT, UNITS_PER_USDC } from "@/lib/constants";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from "@mysten/dapp-kit";
import { getModels, generatePreview, generateSyntheticData, getPrice, storeBlob } from "@/lib/actions";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";


const formSchema = z.object({
  datasetName: z.string().min(3, "Dataset name must be at least 3 characters."),
  modelId: z.string().min(1, "Model is required."),
  maxTokens: z.coerce.number().min(1, "Max tokens must be at least 1."),
  inputFeature: z.string().min(1, "Input feature is required."),
  isStructured: z.boolean(),
  jsonSchema: z.string().optional(),
  prompt: z.string().includes("{input}"),
}).refine(data => {
  if (data.isStructured) {
    if (!data.jsonSchema || data.jsonSchema.trim() === "") {
      return false;
    }
    try {
      JSON.parse(data.jsonSchema);
    } catch (e) {
      return false;
    }
  }
  return true;
}, {
  message: "Valid JSON schema is required for structured output.",
  path: ["jsonSchema"],
});

export default function CreatePage() {
  const [data, setData] = useState<any[]>([]);
  const [numEpochs, setNumEpochs] = useState<number>(1);
  const [features, setFeatures] = useState<string[]>([]);
  const [models, setModels] = useState<AtomaModel[]>([]);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [isLocking, setIsLocking] = useState<boolean>(false);
  const [dataset, setDataset] = useState<HFDataset | null>(null);
  const [previewAttempts, setPreviewAttempts] = useState<number>(0);
  const [uploadCompleted, setUploadCompleted] = useState<boolean>(false);
  const [datasetBlobId, setDatasetBlobId] = useState<string | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState<boolean>(false);
  const [isStoringDataset, setIsStoringDataset] = useState<boolean>(false);
  const [datasetObjectId, setDatasetObjectId] = useState<string | null>(null);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState<boolean>(false);
  const [isDatasetGenerationLoading, setIsDatasetGenerationLoading] = useState<boolean>(false);
  const [syntheticDatasetOutput, setSyntheticDatasetOutput] = useState<SyntheticDataResultItem[]>([]);

  const MAX_PREVIEW_ATTEMPTS = 5;

  const suiClient = useSuiClient();
  const currentAccount = useCurrentAccount();
  const sealClient = new SealClient({
    suiClient,
    serverObjectIds: getAllowlistedKeyServers("testnet"),
    verifyKeyServers: false,
  });

  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction({
    execute: async ({ bytes, signature }) =>
      await suiClient.executeTransactionBlock({
        transactionBlock: bytes,
        signature,
        options: {
          showRawEffects: true,
          showEffects: true,
        },
      }),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      datasetName: "",
      modelId: "",
      maxTokens: 100,
      inputFeature: "",
      isStructured: false,
      jsonSchema: "",
      prompt: "",
    },
    mode: "onChange",
  });

  const selectedModelId = form.watch("modelId");
  const selectedModel = models.find(m => m.id === selectedModelId) || null;

  useEffect(() => {
    const currentMaxTokens = form.getValues("maxTokens");
    if (selectedModel && typeof currentMaxTokens === 'number' && currentMaxTokens > selectedModel.max_num_compute_units) {
      form.setValue("maxTokens", selectedModel.max_num_compute_units, { shouldValidate: true });
    }
  }, [selectedModel, form]);

  const handleTestGeneration = async () => {
    if (!dataset) return;
    if (previewAttempts >= MAX_PREVIEW_ATTEMPTS) {
      console.log("Max preview attempts reached.");
      return;
    }
    
    setIsPreviewLoading(true);
    setPreviewAttempts(prev => prev + 1);
    
    const { modelId, inputFeature, jsonSchema, maxTokens, prompt, isStructured } = form.getValues();
    const currentModel = models.find(m => m.id === modelId);

    if (!currentModel) {
      console.error("Model not selected for test generation.");
      setIsPreviewLoading(false);
      return;
    }

    try {
      const generationConfig: GenerationConfig = {
        model: currentModel.id,
        inputFeature,
        jsonSchema: isStructured && jsonSchema ? jsonSchema : null,
        maxTokens,
        prompt
      };
      
      const testSamples = data.slice(0, 3).map((row) => row.row[inputFeature]);
      const outputs = await generatePreview(generationConfig, testSamples);
      
      const preview = testSamples.map((input, index) => ({
        row_idx: index,
        row: {
          [inputFeature]: input,
          "generated_output": outputs[index] || "No output generated"
        }
      }));
      
      setPreviewData(preview);
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!dataset || !currentAccount?.address) {
      console.error("Dataset or current account not available for generation.");
      return;
    }
    const currentModel = models.find(m => m.id === values.modelId);
    if (!currentModel) {
      console.error("Model not found for generation.");
      return;
    }

    const suiPrice = await getPrice();
    const megaTokens = values.maxTokens / 1_000_000;
    const roundedGenerationSuiAmount = Math.ceil(suiPrice * (currentModel.price_per_one_million_compute_units / UNITS_PER_USDC) * megaTokens * Number(MIST_PER_SUI));

    const tx = new Transaction();
    const [generationCoin] = tx.splitCoins(tx.gas, [roundedGenerationSuiAmount]);

    tx.moveCall({
      target: `${TESTNET_PACKAGE_ID}::suithetic::add_to_balance`,
      arguments: [
        tx.object(TESTNET_SUITHETIC_OBJECT),
        generationCoin
      ],
    });
    
    const hfRevision = (dataset as any).revision || "main"; 
    const modelTaskSmallId = 0; 
    const modelNodeSmallId = 0;

    const datasetObject = tx.moveCall({
      target: `${TESTNET_PACKAGE_ID}::dataset::mint_dataset`,
      arguments: [
        tx.pure.string(dataset.path),
        tx.pure.string(dataset.config),
        tx.pure.string(dataset.split),
        tx.pure.string(hfRevision),
        tx.pure.u16(0),
        tx.pure.string(values.datasetName),
        tx.pure.string(""),
        tx.pure.u64(0),
        tx.pure.string(currentModel.id),
        tx.pure.u64(modelTaskSmallId),
        tx.pure.u64(modelNodeSmallId),
        tx.pure.u64(currentModel.price_per_one_million_compute_units),
        tx.pure.u64(currentModel.max_num_compute_units),
      ]
    });

    tx.transferObjects([datasetObject], tx.pure.address(currentAccount.address));

    signAndExecuteTransaction({ transaction: tx }, { onSuccess: async (result: any) => {
      if (result.effects?.created?.[0]?.reference?.objectId) {
        setDatasetObjectId(result.effects.created[0].reference.objectId);
      } else {
        console.error("Failed to get dataset object ID from transaction result:", result);
        return;
      }

      setIsDatasetGenerationLoading(true);
    
      try {
        const generationConfig: GenerationConfig = {
          model: currentModel.id,
          inputFeature: values.inputFeature,
          jsonSchema: values.isStructured && values.jsonSchema ? values.jsonSchema : null,
          maxTokens: values.maxTokens,
          prompt: values.prompt
        };
  
        if (!dataset) {
          console.error("Client: Dataset is null or undefined, cannot start generation.");
          setSyntheticDatasetOutput([
            { success: false, error: "Dataset not selected or invalid." }
          ]);
          setIsDatasetGenerationLoading(false);
          return;
        }
  
        setSyntheticDatasetOutput([]); 
  
        console.log("Client: Calling generateSyntheticData with dataset:", dataset, "and config:", generationConfig);
        const results = await generateSyntheticData(dataset, generationConfig, {});
        console.log("Client: Received all results:", results);
        setSyntheticDatasetOutput(results);
  
      } catch (error: any) {
        console.error("Client: An unexpected error occurred during dataset generation:", error);
        const errorMessage = error.message || "An unknown error occurred on the server.";
        setSyntheticDatasetOutput([
          { success: false, error: `Client-side error: ${errorMessage}` }
        ]);
      } finally {
        setIsDatasetGenerationLoading(false);
      }
    },
    onError: (error: any) => {
      console.error("Transaction failed:", error);
    }
  });
  };

  const sanitizeDataset = (dataset: SyntheticDataResultItem[]): Uint8Array => {
    const { inputFeature } = form.getValues();
    const rows = dataset.map((item, index) => ({
      row_idx: index,
      row: {
        [`${inputFeature || 'input'}`]: item.input,
        "generated_output": item.data
      },
      truncated_cells: []
    }));

    const jsonData = {
      features: [
        { feature_idx: 0, name: inputFeature || 'input', type: { dtype: "string", _type: "Value" } },
        { feature_idx: 1, name: "generated_output", type: { dtype: "string", _type: "Value" } }
      ],
      rows: rows,
      num_rows_total: rows.length,
      num_rows_per_page: 100,
      partial: false
    };

    const jsonString = JSON.stringify(jsonData);
    return new TextEncoder().encode(jsonString);
  }

  const encryptBlob = async (data: Uint8Array): Promise<Uint8Array> => {
    const nonce = crypto.getRandomValues(new Uint8Array(5));
    const datasetObjectBytes = fromHex(datasetObjectId!);
    const id = toHex(new Uint8Array([...datasetObjectBytes, ...nonce]));
    const { encryptedObject: encryptedBytes } = await sealClient.encrypt({
      threshold: 1,
      packageId: TESTNET_PACKAGE_ID,
      id,
      data
    })
    return encryptedBytes;
  }

  const encryptAndStoreDataset = async (dataset: SyntheticDataResultItem[], numEpochs: number, encrypt: boolean) => {
    const data = sanitizeDataset(dataset);
    if (encrypt) {
      const encryptedData = await encryptBlob(data);
      return await storeBlob(encryptedData, numEpochs);
    } else {
      return await storeBlob(data, numEpochs);
    }
  }

  const handleEpochsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value > 0) {
      setNumEpochs(value);
    } else if (e.target.value === "") {
      setNumEpochs(1);
    }
  };

  const handleConfirmUpload = async () => {
    if (syntheticDatasetOutput.length === 0) return;
    setIsStoringDataset(true);
    try {
      console.log(`Encrypting and storing dataset for ${numEpochs} epochs.`);
      const blobId = await encryptAndStoreDataset(syntheticDatasetOutput, numEpochs, true);
      setDatasetBlobId(blobId);
      console.log("Dataset stored successfully:", blobId);
      setUploadCompleted(true);
    } catch (error) {
      console.error("Failed to encrypt and store dataset:", error);
    } finally {
      setIsStoringDataset(false);
    }
  };

  const handleCancelDialog = () => {
    setIsUploadDialogOpen(false);
    setUploadCompleted(false);
    setSyntheticDatasetOutput([]);
    setNumEpochs(1);
    setDatasetBlobId(null);
  };

  const handleLockDataset = async () => {
    const currentDatasetName = form.getValues("datasetName");
    if (!datasetBlobId || !currentDatasetName.trim()) {
      console.error("Dataset Blob ID or Dataset Name is missing for locking.");
      return;
    }
    console.log(`Attempting to lock dataset: ${currentDatasetName} with blob ID: ${datasetBlobId}`);
    try {
      setIsLocking(true);

      const numRows = syntheticDatasetOutput.length;
      const numTokens = syntheticDatasetOutput.reduce((acc, item) => acc + (item.usage?.totalTokens || 0), 0);
      
      const tx = new Transaction();

      tx.moveCall({
        target: `${TESTNET_PACKAGE_ID}::dataset::lock_dataset`,
        arguments: [
          tx.object(datasetObjectId!),
          tx.pure.string(datasetBlobId!),
          tx.pure.string(currentDatasetName),
          tx.pure.u64(numRows),
          tx.pure.u64(numTokens),
          tx.pure.vector("string", syntheticDatasetOutput.map((item) => item.signature!))
        ]
      })

      signAndExecuteTransaction({ transaction: tx }, {
        onSuccess: () => {
          handleCancelDialog();
          form.reset();
        },
        onError: (error: any) => {
          console.error("Failed to lock dataset (on-chain transaction):", error);
        }
      });
    } catch (error) {
      console.error("Failed to lock dataset (simulated):", error);
    } finally {
      setIsLocking(false);
    }
  };

  useEffect(() => {
    getModels().then((models) => {
      setModels(models);
    });
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!dataset) return;
      const response = await fetch(`https://datasets-server.huggingface.co/first-rows?dataset=${dataset.path}&config=${dataset.config}&split=${dataset.split}`);
      const data = await response.json();
      setData(data.rows.map((row: any) => row));
      setFeatures(data.features.map((feature: any) => feature.name));
    }
    fetchData();
  }, [dataset]);

  useEffect(() => {
    if (syntheticDatasetOutput.length > 0 && !isDatasetGenerationLoading && !isUploadDialogOpen) {
      setUploadCompleted(false);
      setIsUploadDialogOpen(true);
    }
  }, [syntheticDatasetOutput, isDatasetGenerationLoading, isUploadDialogOpen]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="flex flex-col items-center justify-center py-8 gap-6">
          <div className="text-3xl font-bold">Create a Synthetic Dataset</div>
          <div className="w-full max-w-4xl space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>1. Select Your Dataset</CardTitle>
                <CardDescription>Choose a Hugging Face dataset to use as a base.</CardDescription>
              </CardHeader>
              <CardContent>
                <DatasetInput 
                  dataset={dataset} 
                  setDataset={setDataset}
                />
                {dataset && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-2">Dataset Preview</h3>
                    <div className="border rounded-md p-4 max-h-[400px] overflow-y-auto">
                      <DatasetViewer features={features} data={data} />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {dataset && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>2. Configure Generation Parameters</CardTitle>
                    <CardDescription>Set up the model and how data should be generated. The dataset name will be used when minting your dataset on-chain.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <FormField
                      control={form.control}
                      name="datasetName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Dataset Name</FormLabel>
                          <FormControl>
                            <Input placeholder="My Awesome AI Dataset" {...field} />
                          </FormControl>
                          <FormDescription>
                            This name will be used to identify your dataset on-chain.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="modelId"
                        render={({ field }) => (
                          <FormItem className="space-y-2">
                            <FormLabel>Model</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value} disabled={models.length === 0}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a model" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {models.map((m) => (
                                  <SelectItem key={m.id} value={m.id}>
                                    {m.id}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="maxTokens"
                        render={({ field }) => (
                          <FormItem className="space-y-2">
                            <FormLabel>Max Tokens</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min="1"
                                max={selectedModel ? selectedModel.max_num_compute_units : undefined}
                                {...field}
                              />
                            </FormControl>
                            {selectedModel && <FormDescription>Max for selected model: {selectedModel.max_num_compute_units}</FormDescription>}
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="inputFeature"
                        render={({ field }) => (
                          <FormItem className="space-y-2">
                            <FormLabel>Input Feature</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!dataset?.features?.length}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select input feature" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {dataset?.features.map((feature) => (
                                  <SelectItem key={feature} value={feature}>
                                    {feature}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="isStructured"
                        render={({ field }) => (
                          <FormItem className="space-y-2">
                            <FormLabel className="flex items-center">Structured Output
                              <FormControl>
                                <Switch 
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  className="ml-2"
                                />
                              </FormControl>
                            </FormLabel>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    {form.watch("isStructured") && (
                      <div>
                        <h3 className="text-lg font-semibold mb-2 mt-4">JSON Schema</h3>
                         <FormField
                            control={form.control}
                            name="jsonSchema"
                            render={({ field }) => (
                              <FormItem className="space-y-2">
                                <FormLabel htmlFor="jsonSchema">Schema Definition</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    id="jsonSchema"
                                    placeholder='Enter JSON schema (e.g., {"type": "object", "properties": {...}})'
                                    className="min-h-[100px] font-mono text-sm"
                                    {...field}
                                    value={field.value || ""}
                                  />
                                </FormControl>
                                <FormDescription>
                                  Define the structure of your output data using JSON Schema format.
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>3. Define and Test Your Prompt</CardTitle>
                    <FormDescription>
                      Write a prompt to guide the AI. Test it on a few samples before full generation. 
                      You have {MAX_PREVIEW_ATTEMPTS - previewAttempts} attempts remaining.
                    </FormDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <FormField
                      control={form.control}
                      name="prompt"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-lg font-semibold">Generation Prompt</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Enter the prompt that will guide the generation task..."
                              className="min-h-[100px] mt-2"
                              {...field}
                            />
                          </FormControl>
                           <FormDescription>
                            Use {"{input}"} to reference the input feature in your prompt.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button 
                      type="button"
                      className="w-full" 
                      size="lg"
                      disabled={
                        !form.getValues("modelId") || 
                        !form.getValues("inputFeature") || 
                        !form.getValues("prompt") || 
                        (form.getValues("isStructured") && !form.getValues("jsonSchema")) || 
                        isPreviewLoading || 
                        previewAttempts >= MAX_PREVIEW_ATTEMPTS ||
                        !form.formState.isValid ||
                        !currentAccount
                      }
                      onClick={handleTestGeneration}
                    >
                      {isPreviewLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating Preview...
                        </>
                      ) : previewAttempts >= MAX_PREVIEW_ATTEMPTS ? (
                        "Preview Limit Reached"
                      ) : (
                        `Test Generation With 3 Rows (${MAX_PREVIEW_ATTEMPTS - previewAttempts} left)`
                      )}
                    </Button>

                    {previewData.length > 0 && form.getValues("inputFeature") && (
                      <div className="mt-6">
                        <h3 className="text-lg font-semibold mb-2">Preview Results</h3>
                        <div className="border rounded-md p-4 max-h-[400px] overflow-y-auto">
                          <DatasetViewer 
                            features={[form.getValues("inputFeature"), "generated_output"]}
                            data={previewData}
                          />
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>4. Generate Full Dataset</CardTitle>
                    <CardDescription>
                      Once you're satisfied with the test, generate the complete synthetic dataset.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <Button 
                      type="submit"
                      className="w-full" 
                      size="lg"
                      variant="default"
                      disabled={
                        isDatasetGenerationLoading || 
                        !form.formState.isValid ||
                        !dataset ||
                        !currentAccount
                      }
                    >
                      {isDatasetGenerationLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating Full Dataset...
                        </>
                      ) : (
                        "Generate Full Dataset"
                      )}
                    </Button>

                    {syntheticDatasetOutput.length > 0 && (
                      <div className="mt-6">
                        <h3 className="text-lg font-semibold mb-2">Full Synthetic Dataset Output</h3>
                        <div className="border rounded-md p-4 max-h-[600px] overflow-y-auto">
                          <pre className="text-sm">
                            {(() => {
                              try {
                                return JSON.stringify(syntheticDatasetOutput.map(item => ({ 
                                  input: item.input,
                                  output: item.data,
                                  success: item.success,
                                  error: item.error,
                                  tokens: item.usage?.totalTokens,
                                  signature: item.signature,
                                })), null, 2);
                              } catch (e) {
                                console.error("Error during JSON.stringify in render:", e, "Data was:", syntheticDatasetOutput);
                                return "Error displaying data. Check console.";
                              }
                            })()}
                          </pre>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Dialog open={isUploadDialogOpen} onOpenChange={(isOpen) => {
                  if (!isOpen) {
                    handleCancelDialog();
                  } else {
                    setIsUploadDialogOpen(true);
                  }
                }}>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>{uploadCompleted ? "Lock Dataset" : "Upload Synthetic Dataset"}</DialogTitle>
                      <DialogDescription>
                        {uploadCompleted 
                          ? `Dataset "${form.getValues("datasetName")}" is ready to be locked on-chain.`
                          : "The generated dataset is ready. Enter the number of epochs for which this dataset will be available."
                        }
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      {!uploadCompleted ? (
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="epochs" className="text-right">
                            Epochs
                          </Label>
                          <Input
                            id="epochs"
                            type="number"
                            min="1"
                            value={numEpochs}
                            onChange={handleEpochsChange}
                            className="col-span-3"
                            disabled={isStoringDataset}
                          />
                        </div>
                      ) : (
                        <p className="text-sm text-center col-span-4">
                          Dataset Name: <strong>{form.getValues("datasetName")}</strong>
                        </p>
                      )}
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={handleCancelDialog} disabled={isStoringDataset}>
                        Cancel
                      </Button>
                      {!uploadCompleted ? (
                        <Button type="submit" onClick={handleConfirmUpload} disabled={isStoringDataset || numEpochs <= 0}>
                          {isStoringDataset ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Uploading...
                            </>
                          ) : (
                            "Confirm & Upload"
                          )}
                        </Button>
                      ) : (
                        <Button type="submit" onClick={handleLockDataset} disabled={!form.getValues("datasetName").trim() || isLocking}>
                          {isLocking ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Locking...
                            </>
                          ) : (
                            "Lock Dataset"
                          )}
                        </Button>
                      )}
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </>
            )}
          </div>
        </div>
      </form>
    </Form>
  );
}

"use client";

import { Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { fromHex, toHex } from "@mysten/sui/utils";
import { Textarea } from "@/components/ui/textarea";
import { getWalrusPublisherUrl } from "@/lib/utils";
import { TESTNET_PACKAGE_ID } from "@/lib/constants";
import DatasetInput from "@/components/dataset-input";
import DatasetViewer from "@/components/dataset-viewer";
import { getAllowlistedKeyServers, SealClient } from "@mysten/seal";
import { useSignAndExecuteTransaction, useSuiClient } from "@mysten/dapp-kit";
import { getModels, generatePreview, generateSyntheticData } from "@/lib/actions";
import { GenerationConfig, HFDataset, SyntheticDataResultItem } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function CreatePage() {
  const [data, setData] = useState<any[]>([]);
  const [model, setModel] = useState<string >("");
  const [models, setModels] = useState<any[]>([]);
  const [prompt, setPrompt] = useState<string>("");
  const [numEpochs, setNumEpochs] = useState<number>(1);
  const [features, setFeatures] = useState<string[]>([]);
  const [maxTokens, setMaxTokens] = useState<number>(100);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [inputFeature, setInputFeature] = useState<string>("");
  const [dataset, setDataset] = useState<HFDataset | null>(null);
  const [isStructured, setIsStructured] = useState<boolean>(false);
  const [jsonSchema, setJsonSchema] = useState<string | null>(null);
  const [previewAttempts, setPreviewAttempts] = useState<number>(0);
  const [isPreviewLoading, setIsPreviewLoading] = useState<boolean>(false);
  const [isStoringDataset, setIsStoringDataset] = useState<boolean>(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState<boolean>(false);
  const [isDatasetGenerationLoading, setIsDatasetGenerationLoading] = useState<boolean>(false);
  const [syntheticDatasetOutput, setSyntheticDatasetOutput] = useState<SyntheticDataResultItem[]>([]);

  const MAX_PREVIEW_ATTEMPTS = 5;

  const suiClient = useSuiClient();
  const sealClient = new SealClient({
    suiClient,
    serverObjectIds: getAllowlistedKeyServers("testnet"),
    verifyKeyServers: false,
  });

  const { mutate: signAndExecute } = useSignAndExecuteTransaction({
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

  const handleTestGeneration = async () => {
    if (!dataset) return;
    if (previewAttempts >= MAX_PREVIEW_ATTEMPTS) {
      console.log("Max preview attempts reached.");
      return;
    }
    
    setIsPreviewLoading(true);
    setPreviewAttempts(prev => prev + 1);
    
    try {
      const generationConfig: GenerationConfig = {
        model,
        inputFeature,
        jsonSchema,
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

  const handleGenerateDataset = async () => {
    if (!dataset) return;
    
    setIsDatasetGenerationLoading(true);
    
    try {
      const generationConfig: GenerationConfig = {
        model,
        inputFeature,
        jsonSchema,
        maxTokens,
        prompt
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
  };

  const sanitizeDataset = (dataset: SyntheticDataResultItem[]): Uint8Array => {
    const rows = dataset.map((item, index) => ({
      row_idx: index,
      row: {
        [`${inputFeature}`]: item.input,
        "generated_output": item.data
      },
      truncated_cells: []
    }));

    const jsonData = {
      features: [
        { feature_idx: 0, name: inputFeature, type: { dtype: "string", _type: "Value" } },
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

  const encryptBlob = async (data: Uint8Array, numEpochs: number): Promise<Uint8Array> => {
    // const nonce = crypto.getRandomValues(new Uint8Array(5));
    // const policyObjectBytes = fromHex(policyObject);
    // const id = toHex(new Uint8Array([...policyObjectBytes, ...nonce]));
    // const { encryptedObject: encryptedBytes } = await sealClient.encrypt({
    //   threshold: 2,
    //   packageId: TESTNET_PACKAGE_ID,
    //   id,
    //   data
    // })
    // return encryptedBytes;
    return data;
  }

  const storeBlob = async (encryptedData: Uint8Array, numEpochs: number) => {
    return fetch(`${getWalrusPublisherUrl(`/v1/blobs?epochs=${numEpochs}`, "walrus")}`, {
      method: "PUT",
      body: encryptedData,
    }).then((response) => {
      if (response.status === 200) {
        return response.json().then((info) => {
          return { info };
        });
      } else {
        throw new Error("Something went wrong when storing the blob!");
      }
    });
  }

  const encryptAndStoreDataset = async (dataset: any[], numEpochs: number, encrypt: boolean = true) => {
    const data = sanitizeDataset(dataset);
    if (encrypt) {
      const encryptedData = await encryptBlob(data, numEpochs);
      return await storeBlob(encryptedData, numEpochs);
    } else {
      return await storeBlob(data, numEpochs);
    }
  }

  const handleMaxTokensChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value > 0) {
      setMaxTokens(value);
    } else if (e.target.value === "") {
      setMaxTokens(100);
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
      const result = await encryptAndStoreDataset(syntheticDatasetOutput, numEpochs);
      console.log("Dataset stored successfully:", result);
      setIsUploadDialogOpen(false);
      setSyntheticDatasetOutput([]);
    } catch (error) {
      console.error("Failed to encrypt and store dataset:", error);
    } finally {
      setIsStoringDataset(false);
    }
  };

  const mintDataset = async () => {

  }

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
    if (syntheticDatasetOutput.length > 0 && !isDatasetGenerationLoading) {
      setIsUploadDialogOpen(true);
    }
  }, [syntheticDatasetOutput, isDatasetGenerationLoading]);

  return (
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
                <CardDescription>Set up the model and how data should be generated.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="model">Model</Label>
                    <Select value={model} onValueChange={setModel} disabled={models.length === 0}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a model" />
                      </SelectTrigger>
                      <SelectContent>
                        {models.map((model) => (
                          <SelectItem key={model.id} value={model.id}>
                            {model.id}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxTokens">Max Tokens</Label>
                    <Input 
                      id="maxTokens" 
                      type="number" 
                      min="1"
                      value={maxTokens} 
                      onChange={handleMaxTokensChange} 
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="inputFeature">Input Feature</Label>
                    <Select value={inputFeature} onValueChange={setInputFeature}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select input feature" />
                      </SelectTrigger>
                      <SelectContent>
                        {dataset.features.map((feature) => (
                          <SelectItem key={feature} value={feature}>
                            {feature}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="isStructured" className="flex items-center">Structured Output 
                      <Switch id="isStructured" checked={isStructured} onCheckedChange={setIsStructured} className="ml-2"/>
                    </Label>
                  </div>
                </div>
                {isStructured && (
                  <div>
                    <h3 className="text-lg font-semibold mb-2 mt-4">JSON Schema</h3>
                    <div className="space-y-2">
                      <Label htmlFor="jsonSchema">Schema Definition</Label>
                      <Textarea 
                        id="jsonSchema"
                        placeholder='Enter JSON schema (e.g., {"type": "object", "properties": {...}})'
                        className="min-h-[100px] font-mono text-sm"
                        value={jsonSchema || ""}
                        onChange={(e) => setJsonSchema(e.target.value)}
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        Define the structure of your output data using JSON Schema format.
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>3. Define and Test Your Prompt</CardTitle>
                <CardDescription>
                  Write a prompt to guide the AI. Test it on a few samples before full generation. 
                  You have {MAX_PREVIEW_ATTEMPTS - previewAttempts} attempts remaining.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="prompt" className="text-lg font-semibold">Generation Prompt</Label>
                  <Textarea 
                    id="prompt"
                    placeholder="Enter the prompt that will guide the generation task..."
                    className="min-h-[100px] mt-2"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    Use {"{input}"} to reference the input feature in your prompt.
                  </p>
                </div>

                <Button 
                  className="w-full" 
                  size="lg"
                  disabled={
                    !model || 
                    !inputFeature || 
                    !prompt || 
                    (isStructured && !jsonSchema) || 
                    isPreviewLoading || 
                    previewAttempts >= MAX_PREVIEW_ATTEMPTS
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

                {previewData.length > 0 && inputFeature && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-2">Preview Results</h3>
                    <div className="border rounded-md p-4 max-h-[400px] overflow-y-auto">
                      <DatasetViewer 
                        features={[inputFeature, "generated_output"]}
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
                  className="w-full" 
                  size="lg"
                  variant="default"
                  disabled={
                    !model || 
                    !inputFeature || 
                    !prompt || 
                    (isStructured && !jsonSchema) || 
                    isDatasetGenerationLoading
                  }
                  onClick={handleGenerateDataset}
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

            <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Upload Synthetic Dataset</DialogTitle>
                  <DialogDescription>
                    The generated dataset is ready. Enter the number of epochs for which this dataset will be available for.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
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
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)} disabled={isStoringDataset}>
                    Cancel
                  </Button>
                  <Button type="submit" onClick={handleConfirmUpload} disabled={isStoringDataset || numEpochs <= 0}>
                    {isStoringDataset ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Storing...
                      </>
                    ) : (
                      "Confirm & Upload"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        )}
      </div>
    </div>
  );
}

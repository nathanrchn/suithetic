"use client";

import { Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useSuiClient } from "@mysten/dapp-kit";
import { Textarea } from "@/components/ui/textarea";
import { getWalrusPublisherUrl } from "@/lib/utils";
import DatasetInput from "@/components/dataset-input";
import DatasetViewer from "@/components/dataset-viewer";
import { GenerationConfig, HFDataset } from "@/lib/types";
import { getAllowlistedKeyServers, SealClient } from "@mysten/seal";
import { getModels, generatePreview, generateSyntheticData } from "@/lib/actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function CreatePage() {
  const [data, setData] = useState<any[]>([]);
  const [model, setModel] = useState<string >("");
  const [models, setModels] = useState<any[]>([]);
  const [prompt, setPrompt] = useState<string>("");
  const [features, setFeatures] = useState<string[]>([]);
  const [maxTokens, setMaxTokens] = useState<number>(100);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [inputFeature, setInputFeature] = useState<string>("");
  const [dataset, setDataset] = useState<HFDataset | null>(null);
  const [isStructured, setIsStructured] = useState<boolean>(false);
  const [jsonSchema, setJsonSchema] = useState<string | null>(null);
  const [previewAttempts, setPreviewAttempts] = useState<number>(0);
  const [isPreviewLoading, setIsPreviewLoading] = useState<boolean>(false);
  const [syntheticDatasetOutput, setSyntheticDatasetOutput] = useState<any[]>([]);
  const [isDatasetGenerationLoading, setIsDatasetGenerationLoading] = useState<boolean>(false);

  const MAX_PREVIEW_ATTEMPTS = 5;

  const suiClient = useSuiClient();
  const sealClient = new SealClient({
    suiClient,
    serverObjectIds: getAllowlistedKeyServers("testnet"),
    verifyKeyServers: false,
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

  const storeBlob = (encryptedData: Uint8Array) => {
    return fetch(`${getWalrusPublisherUrl("/v1/blobs?epochs=1", "walrus")}`, {
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
                    <Select value={model} onValueChange={setModel}>
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
                      onChange={(e) => setMaxTokens(parseInt(e.target.value))} 
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
          </>
        )}
      </div>
    </div>
  );
}

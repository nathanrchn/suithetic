"use client";

import { Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { getModels, generate } from "@/lib/actions";
import { Textarea } from "@/components/ui/textarea";
import DatasetInput from "@/components/dataset-input";
import DatasetViewer from "@/components/dataset-viewer";
import { GenerationConfig, HFDataset } from "@/lib/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function CreatePage() {
  const [data, setData] = useState<any[]>([]);
  const [model, setModel] = useState<string >("");
  const [models, setModels] = useState<any[]>([]);
  const [prompt, setPrompt] = useState<string>("");
  const [numRows, setNumRows] = useState<number>(100);
  const [features, setFeatures] = useState<string[]>([]);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [inputFeature, setInputFeature] = useState<string>("");
  const [dataset, setDataset] = useState<HFDataset | null>(null);
  const [isStructured, setIsStructured] = useState<boolean>(false);
  const [jsonSchema, setJsonSchema] = useState<string | null>(null);

  const handleTestGeneration = async () => {
    if (!dataset) return;
    
    setIsLoading(true);
    
    try {
      const generationConfig: GenerationConfig = {
        model,
        inputFeature,
        jsonSchema,
        numRows,
        prompt
      };
      
      const testSamples = data.slice(0, 3).map((row) => row.row[inputFeature]);
      const outputs = await generate(generationConfig, testSamples);
      
      const preview = testSamples.map((input, index) => ({
        row_idx: index,
        row: {
          [inputFeature]: input,
          "generated_output": outputs[index] || "No output generated"
        }
      }));
      
      setPreviewData(preview);
    } catch (error) {
      console.error("Generation failed:", error);
    } finally {
      setIsLoading(false);
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

  return (
    <div className="flex flex-col items-center justify-center py-8 gap-6">
      <div className="text-3xl font-bold">Create a Synthetic Dataset</div>
      <div className="w-full max-w-4xl">
        <div className="p-6">
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">Select a Dataset</h2>
              <DatasetInput 
                dataset={dataset} 
                setDataset={setDataset}
              />
            </div>

            {dataset && (
              <>
                <div>
                  <h2 className="text-xl font-semibold mb-4">Dataset Preview</h2>
                  <div className="border rounded-md p-4 max-h-[400px] overflow-y-auto">
                    <DatasetViewer features={features} data={data} />
                  </div>
                </div>

                <div>
                  <h2 className="text-xl font-semibold mb-4">Generation Configuration</h2>
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
                      <Label htmlFor="numRows">Number of Rows</Label>
                      <Input 
                        id="numRows" 
                        type="number" 
                        min="1"
                        value={numRows} 
                        onChange={(e) => setNumRows(parseInt(e.target.value))} 
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
                      <Label htmlFor="isStructured">Structured Output</Label>
                      <Switch id="isStructured" checked={isStructured} onCheckedChange={setIsStructured} />
                    </div>
                  </div>
                </div>

                {isStructured && (
                  <div>
                    <h2 className="text-xl font-semibold mb-4">JSON Schema</h2>
                    <div className="space-y-2">
                      <Label htmlFor="jsonSchema">Schema Definition</Label>
                      <Textarea 
                        id="jsonSchema"
                        placeholder='Enter JSON schema (e.g., {"type": "object", "properties": {...}})'
                        className="min-h-[150px] font-mono text-sm"
                        value={jsonSchema || ""}
                        onChange={(e) => setJsonSchema(e.target.value)}
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        Define the structure of your output data using JSON Schema format.
                      </p>
                    </div>
                  </div>
                )}

                <div>
                  <h2 className="text-xl font-semibold mb-4">Generation Prompt</h2>
                  <Textarea 
                    placeholder="Enter the prompt that will guide the generation task..."
                    className="min-h-[150px]"
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
                  disabled={!model || !inputFeature || !prompt || (isStructured && !jsonSchema) || isLoading}
                  onClick={handleTestGeneration}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    "Test Generation With 3 Rows"
                  )}
                </Button>

                {previewData.length > 0 && (
                  <div className="mt-8">
                    <h2 className="text-xl font-semibold mb-4">Generation Results</h2>
                    <div className="border rounded-md p-4 max-h-[400px] overflow-y-auto">
                      <DatasetViewer 
                        features={[inputFeature, "generated_output"]} 
                        data={previewData}
                        maxLength={250}
                      />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

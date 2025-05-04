"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { GenerationConfig, HFDataset } from "@/lib/types";
import DatasetInput from "@/components/dataset-input";
import DatasetViewer from "@/components/dataset-viewer";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getModels } from "@/lib/actions";

export default function CreatePage() {
  const [dataset, setDataset] = useState<HFDataset | null>(null);
  const [config, setConfig] = useState<GenerationConfig | null>(null);
  const [model, setModel] = useState<string >("");
  const [models, setModels] = useState<any[]>([]);
  const [inputFeature, setInputFeature] = useState<string>("");
  const [outputFeature, setOutputFeature] = useState<string>("");
  const [numRows, setNumRows] = useState<number>(100);
  const [prompt, setPrompt] = useState<string>("");

  const handleSubmit = () => {
    if (!dataset) return;
    
    const generationConfig: GenerationConfig = {
      model,
      inputFeature,
      outputFeature,
      numRows
    };
    
    setConfig(generationConfig);
  };

  useEffect(() => {
    getModels().then((models) => {
      setModels(models);
    });
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-8 gap-6">
      <div className="text-3xl font-bold">Create a Synthetic Dataset</div>
      <Card className="w-full max-w-4xl">
        <CardContent className="p-6">
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">1. Select a Dataset</h2>
              <DatasetInput 
                dataset={dataset} 
                setDataset={setDataset}
              />
            </div>

            {dataset && (
              <>
                <div>
                  <h2 className="text-xl font-semibold mb-4">2. Dataset Preview</h2>
                  <div className="border rounded-md p-4 max-h-[400px] overflow-y-auto">
                    <DatasetViewer dataset={dataset} />
                  </div>
                </div>

                <div>
                  <h2 className="text-xl font-semibold mb-4">3. Generation Configuration</h2>
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
                      <Label htmlFor="outputFeature">Output Feature</Label>
                      <Input 
                        id="outputFeature" 
                        placeholder="Name of the feature to generate" 
                        value={outputFeature} 
                        onChange={(e) => setOutputFeature(e.target.value)} 
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h2 className="text-xl font-semibold mb-4">4. Generation Prompt</h2>
                  <Textarea 
                    placeholder="Enter the prompt that will guide the generation task..."
                    className="min-h-[150px]"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    You can use {"{input}"} to reference the input feature in your prompt.
                  </p>
                </div>

                <Button 
                  className="w-full" 
                  size="lg"
                  disabled={!model || !inputFeature || !outputFeature || !prompt}
                  onClick={handleSubmit}
                >
                  Generate Synthetic Data
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

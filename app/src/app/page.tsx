"use client";

import { z } from "zod";
import { X } from "lucide-react";
import { DatasetObject } from "@/lib/types";
import { getLockedDatasets } from "@/lib/actions";
import { Template } from "@/components/template-card";
import { DatasetList } from "@/components/dataset-list";
import { useCallback, useEffect, useState } from "react";
import { TemplateList } from "@/components/template-list";
import { useSuiClient, useCurrentAccount } from "@mysten/dapp-kit";

const templates: Template[] = [
  // {
  //   name: "UltraChat",
  //   description: "A dataset for ultra-chat",
  //   dataset: {
  //     path: "HuggingFaceH4/ultrachat_200k",
  //     config: "default",
  //     split: "train_sft",
  //   },
  //   prompt: "{input}",
  //   inputFeature: "prompt",
  //   isStructured: false,
  //   maxTokens: 100,
  //   modelId: "Infermatic/Llama-3.3-70B-Instruct-FP8-Dynamic",
  //   price: 1,
  //   visibility: 0,
  //   color: "purple",
  //   jsonSchema: z.object({
  //     name: z.string().describe("The name of the person"),
  //     age: z.number().describe("The age of the person"),
  //   }),
  // },
  // {
  //   name: "UltraChat",
  //   description: "A dataset for ultra-chat",
  //   dataset: {
  //     path: "HuggingFaceH4/ultrachat_200k",
  //     config: "default",
  //     split: "train_sft",
  //   },
  //   prompt: "{input}",
  //   inputFeature: "prompt",
  //   isStructured: false,
  //   maxTokens: 100,
  //   modelId: "Infermatic/Llama-3.3-70B-Instruct-FP8-Dynamic",
  //   price: 1,
  //   visibility: 0,
  //   color: "blue",
  // },
  // {
  //   name: "UltraChat",
  //   description: "A dataset for ultra-chat",
  //   dataset: {
  //     path: "HuggingFaceH4/ultrachat_200k",
  //     config: "default",
  //     split: "train_sft",
  //   },
  //   prompt: "{input}",
  //   inputFeature: "prompt",
  //   isStructured: false,
  //   maxTokens: 100,
  //   modelId: "Infermatic/Llama-3.3-70B-Instruct-FP8-Dynamic",
  //   price: 1,
  //   visibility: 0,
  //   color: "green",
  // },
];

export default function Home() {
  const suiClient = useSuiClient();
  const currentAccount = useCurrentAccount();
  const [showTemplates, setShowTemplates] = useState(true);
  const [lockedDatasets, setLockedDatasets] = useState<DatasetObject[]>([]);

  useEffect(() => {
    getLockedDatasets().then(datasets => {
      setLockedDatasets(datasets);
    });
  }, []);

  const resolveNameServiceNames = useCallback(async (address: string) => {
    const response = await suiClient.resolveNameServiceNames({
      address,
      format: "at",
    });
    return response.data[0];
  }, [suiClient])

  return (
    <div className="container mx-auto p-3">
      {showTemplates && templates.length > 0 && (
        <div className="flex justify-center my-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-4 max-w-xl w-full">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Create from a template</h2>
              <button
                onClick={() => setShowTemplates(false)}
                className="p-1 bg-gray-100 dark:bg-gray-700 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                aria-label="Close templates"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <TemplateList templates={templates} />
          </div>
        </div>
      )}
      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100">Trending Datasets</h2>
        {lockedDatasets.length > 0 && (
          <DatasetList datasets={lockedDatasets} currentAddress={currentAccount?.address} resolveNameServiceNames={resolveNameServiceNames} />
        )}
      </div>
    </div>
  );
}

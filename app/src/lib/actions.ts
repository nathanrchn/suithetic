"use server";

import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { GenerationConfig, HFDataset } from "@/lib/types";

const atoma = createOpenAI({
  apiKey: process.env.ATOMA_API_KEY,
  baseURL: "https://api.atoma.network/v1",
});

export async function getRows(dataset: HFDataset, offset: number, length: number) {
  const response = await fetch(`https://datasets-server.huggingface.co/rows?dataset=${dataset.path}&config=${dataset.config}&split=${dataset.split}&offset=${offset}&length=${length}`);
  const data = await response.json();
  return data.rows;
}

export async function getModels() {
  const response = await fetch("https://api.atoma.network/v1/models", {
    headers: {
      "Authorization": `Bearer ${process.env.ATOMA_API_KEY}`
    }
  });
  const data = await response.json();
  return data.data;
}

export async function generate(config: GenerationConfig, data: string[]) {
  const outputs = [];
  if (config.jsonSchema) {
    throw new Error("Not implemented");
  } else {
    for (const row of data) {
      console.log(row);
      const { text } = await generateText({
        model: atoma(config.model),
        prompt: config.prompt.replace("{input}", row),
        maxTokens: 32,
      });
      console.log(text);
      outputs.push(text);
    }
  }

  return outputs;
}

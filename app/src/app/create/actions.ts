"use server";

import { z } from "zod";
import { google } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import { generateObject, generateText } from "ai";
import { GenerationConfig, HFDataset } from "@/lib/types";

const atoma = createOpenAI({
  apiKey: process.env.ATOMA_API_KEY,
  baseURL: "https://api.atoma.network/v1",
});

export async function getRows(dataset: HFDataset, offset: number, length: number, model: string) {
  const response = await fetch(`https://datasets-server.huggingface.co/rows?dataset=${dataset.path}&config=${dataset.config}&split=${dataset.split}&offset=${offset}&length=${length}`);
  const data = await response.json();

  return data.rows;
}

type ResponseBody = {
  signature: string;
  response_hash: string;
}

export async function generateRow(row: string, config: GenerationConfig, maxTokens: number) {
  const prompt = config.prompt.replace("{input}", row);

  if (config.jsonSchema) {
    const { object, usage, response: { body } } = await generateObject({
      model: atoma(config.model),
      prompt,
      schema: config.jsonSchema,
      maxTokens,
    });

    const { signature, response_hash } = body as ResponseBody;

    return {
      result: object,
      usage,
      signature,
      response_hash,
    };
  } else {
    const { text, usage, response: { body } } = await generateText({
      model: atoma(config.model),
      prompt,
      maxTokens,
    });

    const { signature, response_hash } = body as ResponseBody;

    return {
      result: text,
      usage,
      signature,
      response_hash,
    };
  }
}

export async function generatePromptWithWizard(prompt: string) {
  const { object: promptObject } = await generateObject({
    model: google("gemini-2.5-flash-preview-04-17"),
    prompt: "Give me an image prompt.",
    schema: z.object({
      prompt: z.string().describe("The prompt to generate an image from"),
    }),
    temperature: 0.3,
  })

  return promptObject.prompt;
}

import { Tokenizer } from "tokenizers";
import { createOpenAI } from "@ai-sdk/openai";
import { generateObject, generateText } from "ai";
import { GenerationConfig, HFDataset } from "@/lib/types";

const atoma = createOpenAI({
  apiKey: process.env.ATOMA_API_KEY,
  baseURL: "https://api.atoma.network/v1",
});

export async function getTokenizedRows(dataset: HFDataset, offset: number, length: number, model: string) {
  const response = await fetch(`https://datasets-server.huggingface.co/rows?dataset=${dataset.path}&config=${dataset.config}&split=${dataset.split}&offset=${offset}&length=${length}`);
  const data = await response.json();
  
  let rows = data.rows;
  const tokenizer = Tokenizer.fromPretrained(model);

  for (const row of rows) {
    const tokens = await tokenizer.encode(row);
    row._private_num_tokens = tokens.getLength();
  }

  return rows;
}

export async function generateRow(row: string, config: GenerationConfig, maxTokens: number) {
  const prompt = config.prompt.replace("{input}", row);

  if (config.jsonSchema) {
    return await generateObject({
      model: atoma(config.model),
      prompt,
      schema: config.jsonSchema,
      maxTokens,
    });
  } else {
    return await generateText({
      model: atoma(config.model),
      prompt,
      maxTokens,
    });
  }
}

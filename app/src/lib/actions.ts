"use server";

import { generateText, streamText } from "ai";
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

export async function generatePreview(config: GenerationConfig, data: string[]) {
  let tokens = 0;
  const outputs = [];
  if (config.jsonSchema) {
    throw new Error("Not implemented");
  } else {
    for (const row of data) {
      const { text, usage } = await generateText({
        model: atoma(config.model),
        prompt: config.prompt.replace("{input}", row),
        maxTokens: 32,
      });
      outputs.push(text);

      tokens += usage.totalTokens;

      if (tokens > config.maxTokens) {
        break;
      }
    }
  }

  return outputs;
}

type SyntheticDataResultItem = {
  success: boolean;
  data?: string;
  usage?: { totalTokens: number; [key: string]: any };
  input?: string;
  error?: string;
};

export async function generateSyntheticData(
  dataset: HFDataset,
  config: GenerationConfig,
  options?: {
    batchSize?: number;
    maxRetries?: number;
    chunkTimeoutMs?: number;
    perCallMaxTokens?: number;
  }
): Promise<SyntheticDataResultItem[]> {
  console.log("[generateSyntheticData ACTION] Entered with dataset:", JSON.stringify(dataset), "config:", JSON.stringify(config), "options:", JSON.stringify(options));
  
  const allResults: SyntheticDataResultItem[] = []; // Array to store all results

  try {
    const BATCH_SIZE = options?.batchSize ?? 10;
    const MAX_RETRIES = options?.maxRetries ?? 3;
    const CHUNK_TIMEOUT_MS = options?.chunkTimeoutMs ?? 15000; 
    const PER_CALL_MAX_TOKENS_CONFIG = options?.perCallMaxTokens ?? 512;

    let totalTokensUsed = 0;
    let offset = 0;
    let continueFetching = true;

    if (config.jsonSchema) {
      console.error("[generateSyntheticData ACTION] JSON schema mode is not currently implemented.");
      allResults.push({ success: false, error: "JSON schema mode is not implemented." });
      return allResults;
    }

    while (continueFetching && totalTokensUsed < config.maxTokens) {
      if (!dataset || !dataset.path || !dataset.config || !dataset.split) {
        console.error("[generateSyntheticData ACTION] Invalid dataset provided:", JSON.stringify(dataset));
        allResults.push({ success: false, error: "Invalid dataset configuration provided." });
        return allResults;
      }
      const fetchedRows = await getRows(dataset, offset, BATCH_SIZE);
      if (fetchedRows.length === 0) {
        continueFetching = false;
        break;
      }

      for (const rowWrapper of fetchedRows) {
        const rowData = rowWrapper.row;
        if (totalTokensUsed >= config.maxTokens) {
          console.log("[generateSyntheticData ACTION] Max token limit reached globally. Stopping further row processing.");
          continueFetching = false;
          break;
        }

        const inputText = rowData[config.inputFeature];
        if (typeof inputText !== 'string') {
          console.warn(`[generateSyntheticData ACTION] Input feature '${config.inputFeature}' not found or not a string in row. Skipping. Value:`, inputText);
          allResults.push({ success: false, error: `Input feature '${config.inputFeature}' not found or not a string.`, input: String(inputText) });
          continue;
        }

        let attempt = 0;
        let successForRow = false;
        while (attempt < MAX_RETRIES && !successForRow) {
          try {
            const remainingTokensBudget = config.maxTokens - totalTokensUsed;
            if (remainingTokensBudget <= 0 && totalTokensUsed > 0) {
               console.log("[generateSyntheticData ACTION] Max token limit reached before processing new row, stopping generation.");
               continueFetching = false; 
               break; 
            }
            
            const currentCallMaxTokens = Math.min(PER_CALL_MAX_TOKENS_CONFIG, Math.max(1, remainingTokensBudget));
             if (currentCallMaxTokens < 1 && totalTokensUsed > 0) {
              console.log("[generateSyntheticData ACTION] Not enough token budget for another call, stopping.");
              continueFetching = false;
              break;
            }

            if (!config.model) {
              console.error("[generateSyntheticData ACTION] Model ID is not configured.");
              allResults.push({ success: false, error: "Model ID not configured.", input: inputText });
              successForRow = true; 
              continueFetching = false; 
              break;
            }

            const { textStream, usage: usagePromise } = await streamText({
              model: atoma(config.model),
              prompt: config.prompt.replace("{input}", inputText),
              maxTokens: currentCallMaxTokens,
            });

            const iterator = textStream[Symbol.asyncIterator]();
            let accumulatedText = "";
            let loop = true;

            while(loop) {
              const timeoutPromise = new Promise<never>((_, reject) =>
                  setTimeout(() => reject(new Error(`Timeout: No chunk received in ${CHUNK_TIMEOUT_MS}ms for input: ${String(inputText).substring(0,30)}...`)), CHUNK_TIMEOUT_MS)
              );
              
              let iteratorResultPromise = iterator.next();
              let winnerResult;

              try {
                  winnerResult = await Promise.race([
                      iteratorResultPromise,
                      timeoutPromise
                  ]);
              } catch (e: any) { 
                  if (typeof iterator.return === 'function') {
                      await iterator.return(); 
                  }
                  throw e; 
              }
              
              const currentIteratorResult = winnerResult as IteratorResult<string, any>;

              if (currentIteratorResult.done) {
                  loop = false;
              } else {
                  accumulatedText += currentIteratorResult.value;
              }
            }

            const finalUsage = await usagePromise;

            if (totalTokensUsed + finalUsage.totalTokens > config.maxTokens && totalTokensUsed > 0) {
               if (accumulatedText) { 
                   allResults.push({ success: true, data: accumulatedText, usage: finalUsage, input: inputText });
               }
               totalTokensUsed += finalUsage.totalTokens;
               console.log("[generateSyntheticData ACTION] Max token limit reached after processing a row. Stopping further generation.");
               continueFetching = false;
               successForRow = true; 
               break; 
            }

            totalTokensUsed += finalUsage.totalTokens;
            allResults.push({ success: true, data: accumulatedText, usage: finalUsage, input: inputText });
            successForRow = true;

          } catch (error: any) {
            console.error(`[generateSyntheticData ACTION] Attempt ${attempt + 1}/${MAX_RETRIES} failed for input "${String(inputText).substring(0,50)}...": ${error.message}`, error.stack);
            attempt++;
            if (attempt >= MAX_RETRIES) {
              allResults.push({ success: false, error: `Failed after ${MAX_RETRIES} attempts: ${error.message}`, input: inputText });
            }
            // No explicit backoff here as we are not retrying the whole batch, but individual items
          }
        } 
        if (!continueFetching) break; 
      }

      offset += BATCH_SIZE;
      if (fetchedRows.length < BATCH_SIZE) {
          continueFetching = false; 
      }
    }

    if (totalTokensUsed >= config.maxTokens && continueFetching) {
        console.log(`[generateSyntheticData ACTION] Generation stopped: Total tokens used (${totalTokensUsed}) reached or exceeded the limit (${config.maxTokens}).`);
    }
    console.log("[generateSyntheticData ACTION] Exiting normally, returning all collected results.");
    return allResults;

  } catch (e: any) {
    console.error("[generateSyntheticData ACTION] CRITICAL ERROR in generateSyntheticData:", e.message, e.stack);
    allResults.push({ success: false, error: `Critical server-side error: ${e.message}`, input: "unknown" });
    return allResults; 
  }
}

export type HFDataset = {
  path: string;
  config: string;
  split: string;
  features: string[];
}

export type WalrusService = {
  id: string;
  name: string;
  publisherUrl: string;
  aggregatorUrl: string;
};

export type GenerationConfig = {
  model: string;
  inputFeature: string;
  jsonSchema: string | null;
  maxTokens: number;
  prompt: string;
}

export type SyntheticDataResultItem = {
  success: boolean;
  data?: string;
  usage?: { totalTokens: number; [key: string]: any };
  input?: string;
  error?: string;
  signature?: string;
};


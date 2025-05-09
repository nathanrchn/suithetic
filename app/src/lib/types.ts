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

export type AtomaModel = {
  id: string;
  object: string;
  created: number;
  owned_by: string;
  task_small_id: number;
  price_per_one_million_compute_units: number;
  max_num_compute_units: number;
}

export type DatasetObject = {
  id: string;
  owner: string;
  creator: string;
  version: number;
  blobId: string;
  metadata: {
    name: string;
    numRows: number;
    numTokens: number;
  };
  signatures: string[];
}

export type DatasetListedEventObject = {
  dataset: string;
  kiosk: string;
  version: number;
}

"use server";

import { WalrusClient } from "@mysten/walrus";
import { SuiClient } from "@mysten/sui/client";
import { getFullnodeUrl } from "@mysten/sui/client";
import { HFDataset, DatasetObject } from "@/lib/types";
import { MIST_PER_SUI, parseStructTag } from "@mysten/sui/utils";
import { coinWithBalance, Transaction } from "@mysten/sui/transactions";
import { getFaucetHost, requestSuiFromFaucetV2 } from "@mysten/sui/faucet";
import { TESTNET_KEYPAIR, TESTNET_PACKAGE_ID, TESTNET_WALRUS_PACKAGE_CONFIG } from "@/lib/constants";

const suiClient = new SuiClient({
  url: getFullnodeUrl("testnet"),
});

const walrusClient = new WalrusClient({
  network: "testnet",
  suiClient,
});

export async function getRows(dataset: HFDataset, offset: number, length: number) {
  const response = await fetch(`https://datasets-server.huggingface.co/rows?dataset=${dataset.path}&config=${dataset.config}&split=${dataset.split}&offset=${offset}&length=${length}`);
  const data = await response.json();
  return data.rows;
}

export async function getModels() {
  const responseModels = await fetch("https://api.atoma.network/v1/models", {
    headers: {
      "Authorization": `Bearer ${process.env.ATOMA_API_KEY}`
    }
  });

  if (!responseModels.ok) {
    return [];
  }

  const data = (await responseModels.json()).data;

  const responseTasks = await fetch("https://credentials.atoma.network/tasks");
  const tasks = await responseTasks.json();

  const responseSubscriptions = await fetch("https://credentials.atoma.network/subscriptions");
  const subscriptions = await responseSubscriptions.json();

  return data.map((model: any) => {
    const task = tasks.find((task: any) => task[0].model_name === model.id);
    const subscription = subscriptions.find((subscription: any) => subscription.task_small_id === task[0].task_small_id);
    return {
      ...model,
      task_small_id: task[0].task_small_id,
      price_per_one_million_compute_units: subscription.price_per_one_million_compute_units,
      max_num_compute_units: subscription.max_num_compute_units
    }
  });
}

async function getFundedKeypairSecretKey() {
	const keypair = TESTNET_KEYPAIR;

	// const balance = await suiClient.getBalance({
	// 	owner: keypair.toSuiAddress(),
	// });

	// if (BigInt(balance.totalBalance) < MIST_PER_SUI) {
	// 	await requestSuiFromFaucetV2({
	// 		host: getFaucetHost("testnet"),
	// 		recipient: keypair.toSuiAddress(),
	// 	});
	// }

	const walBalance = await suiClient.getBalance({
		owner: keypair.toSuiAddress(),
		coinType: "0x8270feb7375eee355e64fdb69c50abb6b5f9393a722883c1cf45f8e26048810a::wal::WAL",
	});

	if (Number(walBalance.totalBalance) < Number(MIST_PER_SUI) / 2) {
		const tx = new Transaction();

		const exchange = await suiClient.getObject({
			id: TESTNET_WALRUS_PACKAGE_CONFIG.exchangeIds[0],
			options: {
				showType: true,
			},
		});

		const exchangePackageId = parseStructTag(exchange.data!.type!).address;

		const wal = tx.moveCall({
			package: exchangePackageId,
			module: "wal_exchange",
			function: "exchange_all_for_wal",
			arguments: [
				tx.object(TESTNET_WALRUS_PACKAGE_CONFIG.exchangeIds[0]),
				coinWithBalance({
					balance: BigInt(MIST_PER_SUI) / BigInt(2),
				}),
			],
		});

		tx.transferObjects([wal], keypair.toSuiAddress());

		const { digest } = await suiClient.signAndExecuteTransaction({
			transaction: tx,
			signer: keypair,
		});

		await suiClient.waitForTransaction({
			digest,
			options: {
				showEffects: true,
			},
		});
	}

	return keypair;
}

export async function storeBlob(encryptedData: Uint8Array, numEpochs: number) {
  const { blobId } = await walrusClient.writeBlob({
    blob: encryptedData,
    deletable: false,
    epochs: numEpochs,
    signer: await getFundedKeypairSecretKey()
  })

  return blobId;
}

export async function getBlob(blobId: string) {
  return await walrusClient.readBlob({ blobId });
}

const _mapRawObjectToDatasetObject = (rawObject: any): DatasetObject => {
  const content = rawObject.data!.content! as any;
  const fields = content.fields;

  return {
    id: rawObject.data!.objectId,
    version: Number(fields.version),
    owner: fields.owner,
    name: fields.name,
    description: fields.description,
    price: Number(fields.price),
    visibility: {
      inner: Number(fields.visibility.fields.inner),
    },
    blobId: fields.blob_id,
    metadata: {
      numRows: fields.metadata.fields.num_rows,
      numTokens: fields.metadata.fields.num_tokens,
    },
    hfMetadata: {
      path: fields.hf_metadata.fields.path,
      config: fields.hf_metadata.fields.config,
      split: fields.hf_metadata.fields.split,
      revision: fields.hf_metadata.fields.revision,
    },
    stats: {
      numDownloads: fields.stats.fields.num_downloads,
    },
    modelMetadata: {
      name: fields.model_metadata.fields.name,
      taskSmallId: fields.model_metadata.fields.task_small_id,
      nodeSmallId: fields.model_metadata.fields.node_small_id,
      pricePerOneMillionComputeUnits: fields.model_metadata.fields.price_per_one_million_compute_units,
      maxNumComputeUnits: fields.model_metadata.fields.max_num_compute_units,
    },
    allowlist: fields.allowlist,
  };
};

export async function getDataset(id: string): Promise<DatasetObject> {
  const result = await suiClient.getObject({
    id: id,
    options: {
      showContent: true,
    }
  });

  if (!result.data || !result.data.content || result.data.content.dataType !== 'moveObject') {
    throw new Error(`Dataset object ${id} not found or is not a Move object.`);
  }

  return _mapRawObjectToDatasetObject(result);
}

export async function getLockedDatasets(): Promise<DatasetObject[]> {
  const { data } = await suiClient.queryEvents({
    query: {
      MoveEventType: `${TESTNET_PACKAGE_ID}::dataset::DatasetLockedEvent`
    }
  });

  const objects = await suiClient.multiGetObjects({
    ids: data.map((event) => (event.parsedJson as any).dataset),
    options: {
      showContent: true,
    }
  });

  return objects.map(_mapRawObjectToDatasetObject);
}

export async function getPersonalDatasets(address: string): Promise<DatasetObject[]> {
  if (!address) return [];

  const res = await suiClient.getOwnedObjects({
    owner: address,
    filter: {
      MoveModule: {
        module: "dataset",
        package: TESTNET_PACKAGE_ID
      }
    }
  });

  const objects = await suiClient.multiGetObjects({
    ids: res.data.map((obj) => obj.data!.objectId),
    options: {
      showContent: true,
    }
  });

  return objects.filter((obj) => {
    const content = obj.data!.content! as any;
    return content.fields.version > 0;
  }).map(_mapRawObjectToDatasetObject);
}

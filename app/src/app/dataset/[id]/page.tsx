"use client";

import Link from "next/link";
import { Download } from "lucide-react";
import Avatar from "@/components/avatar";
import { DatasetObject } from "@/lib/types";
import { fromHex } from "@mysten/sui/utils";
import { getExplorerUrl } from "@/lib/utils";
import { getBlob, getDataset } from "@/lib/actions";
import { TESTNET_PACKAGE_ID } from "@/lib/constants";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import DatasetViewer from "@/components/dataset-viewer";
import { EncryptedObject, SealClient } from "@mysten/seal";
import { getAllowlistedKeyServers, SessionKey } from "@mysten/seal";
import { use, useState, useEffect, useCallback, useMemo } from "react";
import { useSignPersonalMessage, useSuiClient } from "@mysten/dapp-kit";

export default function DatasetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [dataset, setDataset] = useState<DatasetObject | null>(null);
  const [decryptedBytes, setDecryptedBytes] = useState<Uint8Array | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [parsedData, setParsedData] = useState<any[] | null>(null);
  const [features, setFeatures] = useState<string[]>([]);

  const suiClient = useSuiClient();
  const currentAccount = useCurrentAccount();
  const sealClient = useMemo(() => {
    if (!suiClient || !currentAccount) {
      return null;
    }
    return new SealClient({
      suiClient,
      serverObjectIds: [getAllowlistedKeyServers("testnet")[0]],
      verifyKeyServers: false,
    });
  }, [suiClient, currentAccount]);

  const { mutate: signPersonalMessage } = useSignPersonalMessage();
  const shortAddress = (address: string) => address.slice(0, 6) + "..." + address.slice(-4);

  const decryptBlob = useCallback(async (data: Uint8Array, datasetObj: DatasetObject) => {
    if (!currentAccount || !suiClient || !sealClient || !datasetObj) {
      setIsLoading(false);
      return;
    }

    const tx = new Transaction();
    const encryptedObjectId = EncryptedObject.parse(data).id;

    const sessionKey = new SessionKey({
      address: currentAccount.address,
      packageId: TESTNET_PACKAGE_ID,
      ttlMin: 10,
    });

    signPersonalMessage(
      { message: sessionKey.getPersonalMessage() },
      {
        onSuccess: async (result) => {
          await sessionKey.setPersonalMessageSignature(result.signature);

          tx.moveCall({
            target: `${TESTNET_PACKAGE_ID}::dataset::seal_approve`,
            arguments: [tx.pure.vector("u8", fromHex(encryptedObjectId)), tx.object(datasetObj.id)],
          });

          const txBytes = await tx.build({ client: suiClient, onlyTransactionKind: true });

          try {
            await sealClient.fetchKeys({
              ids: [encryptedObjectId],
              txBytes,
              sessionKey,
              threshold: 1,
            });

            const decrypted = await sealClient.decrypt({
              data,
              sessionKey,
              txBytes,
            });
            setDecryptedBytes(decrypted);
          } catch (error) {
            console.error("Error during decryption process:", error);
            setDecryptedBytes(null);
            setIsLoading(false);
          }
        },
        onError: (error) => {
          console.error("Error signing personal message for decryption:", error);
          setDecryptedBytes(null);
          setIsLoading(false);
        },
      }
    );
  }, [currentAccount, suiClient, sealClient, signPersonalMessage]);

  useEffect(() => {
    if (id) {
      getDataset(id).then((ds) => {
        setDataset(ds);
      }).catch(error => {
        console.error("Failed to fetch dataset metadata:", error);
        setDataset(null);
      });
    }
  }, [id]);

  useEffect(() => {
    if (!dataset) {
      return;
    }

    if (!currentAccount) {
      setDecryptedBytes(null);
      setParsedData(null);
      setFeatures([]);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setDecryptedBytes(null);
    setParsedData(null);
    setFeatures([]);

    getBlob(dataset.blobId)
      .then((blob) => {
        if (blob) {
          decryptBlob(blob, dataset);
        } else {
          throw new Error("Blob data is null or undefined");
        }
      })
      .catch((error) => {
        console.error("Failed to get blob:", error);
        setIsLoading(false);
      });
  }, [dataset, currentAccount, decryptBlob]);

  useEffect(() => {
    if (decryptedBytes) {
      try {
        const stringData = new TextDecoder().decode(decryptedBytes);
        const rawParsedData = JSON.parse(stringData);

        if (rawParsedData && Array.isArray(rawParsedData.features) && Array.isArray(rawParsedData.rows)) {
          const extractedFeatures = rawParsedData.features.map((feature: { name: string }) => feature.name);
          setFeatures(extractedFeatures);

          const formattedForViewer = rawParsedData.rows.map((dataRow: { row_idx: number, row: any }) => ({
            row_idx: dataRow.row_idx,
            row: dataRow.row,
          }));
          setParsedData(formattedForViewer);

          if (formattedForViewer.length === 0) {
            console.log("Parsed data resulted in an empty array of rows.");
          }
          if (extractedFeatures.length === 0) {
            console.log("No features extracted from the data.");
          }

        } else {
          console.error("Parsed data is not in the expected format (missing features or rows array):", rawParsedData);
          setParsedData(null);
          setFeatures([]);
        }
      } catch (e) {
        console.error("Failed to parse decrypted data:", e);
        setParsedData(null);
        setFeatures([]);
      } finally {
        setIsLoading(false);
      }
    } else if (currentAccount && dataset) { 
    }
  }, [decryptedBytes, currentAccount, dataset]);

  const handleDownload = () => {
    if (!parsedData || !dataset) return;
    const dataToDownload = parsedData.map(item => item.row);

    const jsonString = JSON.stringify(dataToDownload, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    
    let filename = "dataset.json";
    if (dataset.metadata.name) {
      filename = `${dataset.metadata.name.replace(/\s+/g, '_').replace(/[^a-z0-9_.-]/gi, '')}.json`;
    } else if (dataset.id) {
      filename = `${dataset.id.replace(/[^a-z0-9_.-]/gi, '')}.json`;
    }

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Dataset Details</h1>
        {dataset && currentAccount && !isLoading && parsedData && (
          <button 
            onClick={handleDownload}
            title="Download Dataset as JSON"
            className="p-2 bg-white text-gray-700 border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50"
          >
            <Download size={20} />
          </button>
        )}
      </div>

      {dataset ? (
        <div className="p-6 border rounded-lg shadow-lg bg-white space-y-4 mb-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            <div>
              <p className="text-sm text-gray-500 font-medium">Name</p>
              <p className="text-lg text-gray-800">{dataset.metadata.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Dataset ID</p>
              <div className="flex items-center">
                <Link href={getExplorerUrl(dataset.id, "object")} className="text-blue-600 hover:underline text-lg break-all" target="_blank" rel="noopener noreferrer">
                  {shortAddress(dataset.id)}
                </Link>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Owner</p>
              <div className="flex items-center">
                <Avatar address={dataset.owner} />
                <Link href={getExplorerUrl(dataset.owner, "address")} className="text-blue-600 hover:underline text-lg break-all" target="_blank" rel="noopener noreferrer">
                  {shortAddress(dataset.owner)}
                </Link>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Creator</p>
              <div className="flex items-center">
                <Avatar address={dataset.creator} />
                <Link href={getExplorerUrl(dataset.creator, "address")} className="text-blue-600 hover:underline text-lg break-all" target="_blank" rel="noopener noreferrer">
                  {shortAddress(dataset.creator)}
                </Link>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Number of Rows</p>
              <p className="text-lg text-gray-800">{dataset.metadata.numRows}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Number of Tokens</p>
              <p className="text-lg text-gray-800">{dataset.metadata.numTokens}</p>
            </div>
          </div>

        </div>
      ) : (
        !id ? <p>No dataset ID provided.</p> : <p>Loading dataset metadata...</p>
      )}

      {dataset && !currentAccount && (
        <div className="p-4 border rounded-lg shadow bg-yellow-50 text-yellow-700">
          <p>Please connect your wallet to view the full dataset contents.</p>
        </div>
      )}

      {dataset && currentAccount && isLoading && (
        <div className="p-4 border rounded-lg shadow bg-blue-50 text-blue-700">
          <p>Loading and decrypting dataset contents...</p>
        </div>
      )}

      {dataset && currentAccount && !isLoading && decryptedBytes && !parsedData && (
        <div className="p-4 border rounded-lg shadow bg-red-50 text-red-700">
          <p>Could not parse or display the dataset contents. The data might be corrupted, in an unexpected format, or the decryption process encountered an issue.</p>
        </div>
      )}
      
      {dataset && currentAccount && !isLoading && parsedData && (
        features.length > 0 ? (
          <DatasetViewer features={features} data={parsedData} />
        ) : (
          <div className="p-4 border rounded-lg shadow bg-gray-50 text-gray-700">
            <p>The dataset is empty or does not contain any displayable features after processing.</p>
          </div>
        )
      )}
    </div>
  );
}

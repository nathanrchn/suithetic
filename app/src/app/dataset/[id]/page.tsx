"use client";

import Link from "next/link";
import { DatasetObject } from "@/lib/types";
import { fromHex } from "@mysten/sui/utils";
import { getExplorerUrl } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { getBlob, getDataset } from "@/lib/actions";
import { TESTNET_PACKAGE_ID } from "@/lib/constants";
import { Transaction } from "@mysten/sui/transactions";
import DatasetViewer from "@/components/dataset-viewer";
import { EncryptedObject, SealClient } from "@mysten/seal";
import { getAllowlistedKeyServers, SessionKey } from "@mysten/seal";
import { use, useState, useEffect, useCallback, useMemo } from "react";
import { Download, Edit3, AlertCircle, CheckCircle, Eye, EyeOff } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient, useSignPersonalMessage } from "@mysten/dapp-kit";

export default function DatasetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [dataset, setDataset] = useState<DatasetObject | null>(null);
  const [decryptedBytes, setDecryptedBytes] = useState<Uint8Array | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isProcessingTx, setIsProcessingTx] = useState<boolean>(false);
  const [parsedData, setParsedData] = useState<any[] | null>(null);
  const [features, setFeatures] = useState<string[]>([]);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editablePrice, setEditablePrice] = useState<number>(0);
  const [editableVisibility, setEditableVisibility] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const suiClient = useSuiClient();
  const currentAccount = useCurrentAccount();
  
  const sealClient = useMemo(() => {
    if (!suiClient || !currentAccount) {
      return null;
    }
    return new SealClient({
      suiClient,
      serverObjectIds: getAllowlistedKeyServers("testnet"),
      verifyKeyServers: false,
    });
  }, [suiClient, currentAccount]);

  const { mutate: signPersonalMessage } = useSignPersonalMessage();
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction({
    execute: async ({ bytes, signature }) =>
      suiClient.executeTransactionBlock({
        transactionBlock: bytes,
        signature,
        options: { showEffects: true },
      }),
  });

  const shortAddress = (address: string) => address ? address.slice(0, 6) + "..." + address.slice(-4) : "N/A";

  const fetchDatasetData = useCallback(async () => {
    if (id) {
      try {
        setIsLoading(true);
        const ds = await getDataset(id);
        setDataset(ds);
        setEditablePrice(ds.price);
        setEditableVisibility(ds.visibility.inner);
        setError(null);
      } catch (err: any) {
        console.error("Failed to fetch dataset metadata:", err);
        setError(`Failed to load dataset: ${err.message}`);
        setDataset(null);
      } finally {
        setIsLoading(false);
      }
    }
  }, [id]);

  useEffect(() => {
    fetchDatasetData();
  }, [fetchDatasetData]);

  const decryptBlob = useCallback(async (data: Uint8Array, datasetObj: DatasetObject) => {
    if (!currentAccount || !suiClient || !sealClient || !datasetObj || !datasetObj.blobId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);

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
        onSuccess: async (resultSignal: { signature: string }) => {
          try {
            await sessionKey.setPersonalMessageSignature(resultSignal.signature);

            tx.moveCall({
              target: `${TESTNET_PACKAGE_ID}::dataset::seal_approve`,
              arguments: [tx.pure.vector("u8", fromHex(encryptedObjectId)), tx.object(datasetObj.id)],
            });

            const txBytes = await tx.build({ client: suiClient, onlyTransactionKind: true });

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
          } catch (err: any) {
            console.error("Error during decryption process:", err);
            setError(`Decryption failed: ${err.message}`);
            setDecryptedBytes(null);
          } finally {
            setIsLoading(false);
          }
        },
        onError: (err: any) => {
          console.error("Error signing personal message for decryption:", err);
          setError(`Signing failed: ${err.message}`);
          setDecryptedBytes(null);
          setIsLoading(false);
        },
      }
    );
  }, [currentAccount, suiClient, sealClient, signPersonalMessage]);

  useEffect(() => {
    if (!dataset || !dataset.blobId) {
      setDecryptedBytes(null);
      setParsedData(null);
      setFeatures([]);
      return;
    }

    if (!currentAccount) {
      setDecryptedBytes(null);
      setParsedData(null);
      setFeatures([]);
      setIsLoading(false);
      return;
    }
    
    setDecryptedBytes(null);
    setParsedData(null);
    setFeatures([]);
    setError(null);
    setIsLoading(true);

    getBlob(dataset.blobId)
      .then((blob) => {
        if (blob) {
          decryptBlob(blob, dataset);
        } else {
          throw new Error("Blob data is null or undefined after fetching.");
        }
      })
      .catch((err) => {
        console.error("Failed to get blob:", err);
        setError(`Failed to load blob: ${err.message}`);
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

        } else {
          console.error("Parsed data is not in the expected format:", rawParsedData);
          setError("Dataset content is not in the expected format.");
          setParsedData(null);
          setFeatures([]);
        }
      } catch (e: any) {
        console.error("Failed to parse decrypted data:", e);
        setError(`Failed to parse dataset contents: ${e.message}`);
        setParsedData(null);
        setFeatures([]);
      } finally {
        setIsLoading(false);
      }
    } else if (currentAccount && dataset && !isLoading && !error) {
    }
  }, [decryptedBytes, currentAccount, dataset, isLoading, error]);

  const handleSaveChanges = async () => {
    if (!dataset || !currentAccount || currentAccount.address !== dataset.owner) return;

    setIsProcessingTx(true);
    setError(null);
    setSuccessMessage(null);

    const tx = new Transaction();
    let changesMade = false;

    if (dataset.visibility.inner !== editableVisibility) {
      tx.moveCall({
        target: `${TESTNET_PACKAGE_ID}::dataset::change_visibility`,
        arguments: [tx.object(dataset.id), tx.pure.u16(editableVisibility)],
      });
      changesMade = true;
    }

    if (dataset.price !== editablePrice) {
      tx.moveCall({
        target: `${TESTNET_PACKAGE_ID}::dataset::change_price`,
        arguments: [tx.object(dataset.id), tx.pure.u64(editablePrice)],
      });
      changesMade = true;
    }

    if (!changesMade) {
      setSuccessMessage("No changes detected.");
      setIsProcessingTx(false);
      setIsEditing(false);
      return;
    }

    signAndExecuteTransaction(
      { transaction: tx },
      {
        onSuccess: (result: any) => {
          console.log("Transaction successful:", result);
          setSuccessMessage("Dataset details updated successfully!");
          fetchDatasetData();
          setIsEditing(false);
        },
        onError: (err: any) => {
          console.error("Transaction failed:", err);
          setError(`Failed to update dataset: ${err.message}`);
        },
        onSettled: () => {
          setIsProcessingTx(false);
        },
      }
    );
  };

  const handleDownload = () => {
    if (!parsedData || !dataset) return;
    const dataToDownload = parsedData.map(item => item.row);
    const jsonString = JSON.stringify(dataToDownload, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    let filename = dataset.name ? `${dataset.name.replace(/\s+/g, '_').replace(/[^a-z0-9_.-]/gi, '')}.json` : `${dataset.id}.json`;
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const isOwner = currentAccount && dataset && currentAccount.address === dataset.owner;

  const renderDetailItem = (label: string, value: string | number | undefined | null, isLink: boolean = false, linkPrefix?: string, linkType?: "object" | "address") => {
    const displayValue = value === undefined || value === null ? "N/A" : String(value);
    return (
      <div>
        <p className="text-sm text-gray-500 font-medium">{label}</p>
        {isLink && value ? (
          <Link href={getExplorerUrl(String(value), linkType || "object")} className="text-blue-600 hover:underline text-lg break-all" target="_blank" rel="noopener noreferrer">
            {linkPrefix}{shortAddress(String(value))}
          </Link>
        ) : (
          <p className="text-lg text-gray-800 break-all">{displayValue}</p>
        )}
      </div>
    );
  };
  
  if (isLoading && !dataset) {
    return <div className="container mx-auto p-4 text-center">Loading dataset metadata...</div>;
  }

  if (error && !dataset) {
    return <div className="container mx-auto p-4 text-center text-red-600"><AlertCircle className="inline mr-2" />{error}</div>;
  }

  if (!dataset) {
    return <div className="container mx-auto p-4 text-center">Dataset not found or ID is invalid.</div>;
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">{dataset.name || "Dataset Details"}</h1>
        <div className="flex items-center gap-2">
          {isOwner && (
            <Button variant="outline" onClick={() => setIsEditing(!isEditing)} disabled={isProcessingTx}>
              <Edit3 size={18} className="mr-2" />
              {isEditing ? "Cancel Edit" : "Edit Details"}
            </Button>
          )}
          {parsedData && (
             <Button onClick={handleDownload} variant="default" title="Download Decrypted Dataset as JSON" disabled={isLoading || isProcessingTx}>
                <Download size={18} className="mr-2" /> Download
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 border rounded-lg shadow bg-red-100 text-red-700 flex items-center">
          <AlertCircle className="mr-2 h-5 w-5" /> {error}
        </div>
      )}
      {successMessage && (
        <div className="p-4 border rounded-lg shadow bg-green-100 text-green-700 flex items-center">
          <CheckCircle className="mr-2 h-5 w-5" /> {successMessage}
        </div>
      )}

      {isEditing && isOwner && (
        <Card>
          <CardHeader>
            <CardTitle>Edit Dataset Details</CardTitle>
            <CardDescription>Modify the dataset's price and visibility. Description is not editable post-creation with the current contract.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="editableVisibility">Visibility</Label>
              <Select 
                value={String(editableVisibility)} 
                onValueChange={(value) => setEditableVisibility(Number(value))}
              >
                <SelectTrigger id="editableVisibility">
                  <SelectValue placeholder="Select visibility" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Public (Sellable)</SelectItem>
                  <SelectItem value="1">Private (Not Sellable)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {editableVisibility === 0 && (
              <div>
                <Label htmlFor="editablePrice">Price (in MIST)</Label>
                <Input 
                  id="editablePrice" 
                  type="number" 
                  value={editablePrice} 
                  onChange={(e) => setEditablePrice(Number(e.target.value))} 
                  min="0"
                />
                <p className="text-sm text-muted-foreground mt-1">1 SUI = 1,000,000,000 MIST.</p>
              </div>
            )}
            <Button onClick={handleSaveChanges} disabled={isProcessingTx}>
              {isProcessingTx ? "Saving..." : "Save Changes"}
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader><CardTitle>Core Information</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {renderDetailItem("Dataset Name", dataset.name)}
            {renderDetailItem("Dataset ID", dataset.id, true, "", "object")}
            {renderDetailItem("Owner", dataset.owner, true, "", "address")}
            {renderDetailItem("Version", dataset.version)}
            <div>
                <p className="text-sm text-gray-500 font-medium">Description</p>
                <p className="text-lg text-gray-800 whitespace-pre-wrap">{dataset.description}</p>
            </div>
             {renderDetailItem("Blob ID", dataset.blobId ? shortAddress(dataset.blobId) : "N/A")}
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader><CardTitle>Status & Financials</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-gray-500 font-medium">Visibility</p>
              <Badge variant={dataset.visibility.inner === 0 ? "default" : "secondary"} className="text-lg">
                {dataset.visibility.inner === 0 ? <><Eye className="mr-2 h-4 w-4" />Public</> : <><EyeOff className="mr-2 h-4 w-4" />Private</>}
              </Badge>
            </div>
            {renderDetailItem("Price (USDC)", dataset.price.toLocaleString())}
          </CardContent>
        </Card>
        
        <Card className="lg:col-span-1">
          <CardHeader><CardTitle>On-Chain Metadata</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {renderDetailItem("Number of Rows", dataset.metadata.numRows?.toLocaleString())}
            {renderDetailItem("Number of Tokens", dataset.metadata.numTokens?.toLocaleString())}
          </CardContent>
        </Card>

        <Card className="md:col-span-2 lg:col-span-3">
          <CardHeader><CardTitle>Hugging Face Source</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
            {renderDetailItem("HF Path", dataset.hfMetadata.path)}
            {renderDetailItem("HF Config", dataset.hfMetadata.config)}
            {renderDetailItem("HF Split", dataset.hfMetadata.split)}
            {renderDetailItem("HF Revision", dataset.hfMetadata.revision)}
          </CardContent>
        </Card>

        <Card className="md:col-span-2 lg:col-span-3">
          <CardHeader><CardTitle>Generation Model Details</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-3">
            {renderDetailItem("Model Name", dataset.modelMetadata.name)}
            {renderDetailItem("Model Task Small ID", dataset.modelMetadata.taskSmallId)}
            {renderDetailItem("Model Node Small ID", dataset.modelMetadata.nodeSmallId)}
            {renderDetailItem("Price / 1M Compute Units (USDC units)", dataset.modelMetadata.pricePerOneMillionComputeUnits.toLocaleString())}
            {renderDetailItem("Max Compute Units", dataset.modelMetadata.maxNumComputeUnits.toLocaleString())}
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader><CardTitle>Usage Stats</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {renderDetailItem("Downloads", dataset.stats.numDownloads.toLocaleString())}
          </CardContent>
        </Card>
      </div>
      
      {currentAccount && !isLoading && !error && !parsedData && dataset?.blobId && (
        <div className="p-4 border rounded-lg shadow bg-yellow-100 text-yellow-800 flex items-center">
          <AlertCircle className="mr-2 h-5 w-5" /> 
          Attempted to load dataset content, but no data is available for display. This could be due to decryption issues, an empty dataset, or a problem parsing the content. Check console for errors.
        </div>
      )}

      {dataset && currentAccount && !isLoading && parsedData && features.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Dataset Content Preview</CardTitle>
            <CardDescription>Decrypted and parsed content from the dataset.</CardDescription>
          </CardHeader>
          <CardContent>
            <DatasetViewer features={features} data={parsedData} />
          </CardContent>
        </Card>
      )}

      {!currentAccount && dataset && (
         <div className="p-4 border rounded-lg shadow bg-blue-100 text-blue-700 flex items-center">
          <AlertCircle className="mr-2 h-5 w-5" /> Please connect your wallet to attempt decryption and view dataset contents.
        </div>
      )}

    </div>
  );
}

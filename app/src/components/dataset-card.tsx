import Link from "next/link";
import { useState } from "react";
import Avatar from "@/components/avatar";
import { DatasetObject } from "@/lib/types";
import { getExplorerUrl } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";

export default function DatasetCard({ 
  dataset,
  currentAddress,
  isListed,
  onListDataset
}: {
  dataset: DatasetObject,
  currentAddress: string,
  isListed: boolean,
  onListDataset?: (datasetId: string, price: string, address: string) => void 
}) {
  const [listPrice, setListPrice] = useState("");
  const shortAddress = (address: string) => address.slice(0, 6) + "..." + address.slice(-4);

  const handleConfirmList = () => {
    if (onListDataset && listPrice) {
      onListDataset(dataset.id, listPrice, currentAddress);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{dataset.metadata.name}</CardTitle>
        <CardDescription>
          <Link href={getExplorerUrl(dataset.id, "object")} className="text-muted-foreground hover:text-primary">
            {shortAddress(dataset.id)}
          </Link>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div>
            <p className="text-sm font-medium text-gray-500">Owner</p>
            <div className="flex items-center space-x-2">
              <Avatar address={dataset.owner} />
              <Link href={getExplorerUrl(dataset.owner, "address")} className="text-blue-600 hover:underline text-sm break-all" target="_blank" rel="noopener noreferrer">
                {shortAddress(dataset.owner)}
              </Link>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Creator</p>
            <div className="flex items-center space-x-2">
              <Avatar address={dataset.creator} />
              <Link href={getExplorerUrl(dataset.creator, "address")} className="text-blue-600 hover:underline text-sm break-all" target="_blank" rel="noopener noreferrer">
                {shortAddress(dataset.creator)}
              </Link>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Number of Rows</p>
            <p>{dataset.metadata.numRows}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Number of Tokens</p>
            <p>{dataset.metadata.numTokens}</p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between space-x-2">
        <Link href={`/dataset/${dataset.id}`} className="flex-grow">
          <Button variant="outline" className="w-full">
            View Details
          </Button>
        </Link>
        {currentAddress && dataset.owner === currentAddress && onListDataset && !isListed && (
          <Dialog>
            <DialogTrigger asChild>
              <Button className="flex-grow">List Dataset</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Place and List Dataset on Kiosk</DialogTitle>
                <DialogDescription>
                  Enter the price at which you want to list your dataset.
                  Once listed, others will be able to purchase access.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="price" className="text-right">
                    Price (SUI)
                  </label>
                  <Input
                    id="price"
                    value={listPrice}
                    onChange={(e) => setListPrice(e.target.value)}
                    placeholder="e.g., 100"
                    className="col-span-3"
                    type="number"
                  />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">Cancel</Button>
                </DialogClose>
                <DialogClose asChild>
                  <Button type="button" onClick={handleConfirmList} disabled={!listPrice}>Confirm</Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
        {isListed && (
          <Button className="flex-grow">Buy Dataset</Button>
        )}
      </CardFooter>
    </Card>
  );
}

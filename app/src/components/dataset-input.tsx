import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";

export type HFDataset = {
  path: string;
  name?: string;
  split?: string;
}

export default function DatasetInput({
  setDataset
}: {
  setDataset: (dataset: HFDataset) => void;
}) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [completions, setCompletions] = useState<string[]>([]);

  const quickSearch = async (value: string) => {
    const response = await fetch(`https://huggingface.co/api/quicksearch?q=${value}&type=dataset`)
    const data = await response.json();
    setCompletions(data.datasets.map((dataset: any) => dataset.id));
  }

  useEffect(() => {
    quickSearch(value);
  }, []);

  return (
    <div>
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
      >
        {value && completions.find((completion) => completion === value)
          ? value
          : "Select dataset"}
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Search framework..."
          className="h-9"
          value={value}
          onValueChange={(value) => {
            setValue(value);
            quickSearch(value);
          }}
        />
        <CommandList>
          <CommandEmpty>No framework found.</CommandEmpty>
          <CommandGroup>
            {completions.map((completion) => (
              <CommandItem
                key={completion}
                value={completion}
                onSelect={(currentValue) => {
                  setValue(currentValue === value ? "" : currentValue)
                  setOpen(false)
                  setDataset({
                    path: currentValue,
                  })
                }}
              >
                {completion}
                <Check
                  className={cn(
                    "ml-auto",
                    value === completion ? "opacity-100" : "opacity-0"
                  )}
                />
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </div>
  )
}

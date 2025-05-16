import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Asterisk, Trash2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface PropertyRowProps {
  id: string;
  propertyName: string;
  propertyDescription: string;
  propertyType: string;
  isArray: boolean;
  isRequired: boolean;
  onPropertyNameChange: (id: string, name: string) => void;
  onPropertyDescriptionChange: (id: string, description: string) => void;
  onPropertyTypeChange: (id: string, type: string) => void;
  onIsArrayChange: (id: string, isArray: boolean) => void;
  onIsRequiredChange: (id: string, isRequired: boolean) => void;
  onDelete: () => void;
}

export default function PropertyRow({ 
  id, 
  propertyName, 
  propertyDescription,
  propertyType,
  isArray,
  isRequired,
  onPropertyNameChange,
  onPropertyDescriptionChange,
  onPropertyTypeChange,
  onIsArrayChange,
  onIsRequiredChange,
  onDelete,
}: PropertyRowProps) {
  return (
    <div className="pt-2 pb-2">
      <div className="flex items-center space-x-2">
        <Input
          type="text"
          placeholder="Property name"
          value={propertyName}
          onChange={(e) => onPropertyNameChange(id, e.target.value)}
          className="p-2 rounded w-fit"
        />
        <Input
          type="text"
          placeholder="Property description"
          value={propertyDescription}
          onChange={(e) => onPropertyDescriptionChange(id, e.target.value)}
          className="p-2 rounded flex-1"
        />
        <Select
          value={propertyType}
          onValueChange={(type) => onPropertyTypeChange(id, type)}
        >
          <SelectTrigger className="rounded w-fit">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="string">string</SelectItem>
            <SelectItem value="number">number</SelectItem>
            <SelectItem value="integer">integer</SelectItem>
            <SelectItem value="boolean">boolean</SelectItem>
            <SelectItem value="object">object</SelectItem>
            <SelectItem value="enum">enum</SelectItem>
          </SelectContent>
        </Select>
        <Button
          type="button"
          variant={isArray ? "default" : "outline"}
          size="icon"
          title="Make property an array"
          onClick={() => onIsArrayChange(id, !isArray)}
        >
          [ ]
        </Button>
        <Button
          type="button"
          variant={isRequired ? "default" : "outline"}
          size="icon"
          title="Mark as required"
          onClick={() => onIsRequiredChange(id, !isRequired)}
        >
          <Asterisk className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={onDelete} title="Delete property" className="hover:bg-red-500/10 hover:text-red-500">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
} 
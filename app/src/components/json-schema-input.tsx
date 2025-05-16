import * as z from "zod";
import { nanoid } from "@/lib/utils";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import PropertyRow from "@/components/property-row";

interface Property {
  id: string;
  name: string;
  description: string;
  type: string;
  isArray: boolean;
  isRequired: boolean;
}

export default function JsonSchemaInput({ schema, setSchema }: { schema: z.ZodObject<any> | null, setSchema: (schema: z.ZodObject<any> | null) => void }) {
  const [properties, setProperties] = useState<Property[]>([]);

  useEffect(() => {
    console.log("properties", properties);
  }, [properties]);

  const addProperty = () => {
    setProperties([...properties, { id: nanoid(), name: "", description: "", type: "string", isArray: false, isRequired: false }]);
  };

  const deleteProperty = (id: string) => {
    setProperties(properties.filter(prop => prop.id !== id));
  };

  const handlePropertyNameChange = (id: string, name: string) => {
    setProperties(properties.map(prop => prop.id === id ? { ...prop, name } : prop));
  };

  const handlePropertyDescriptionChange = (id: string, description: string) => {
    setProperties(properties.map(prop => prop.id === id ? { ...prop, description } : prop));
  };

  const handlePropertyTypeChange = (id: string, type: string) => {
    setProperties(properties.map(prop => prop.id === id ? { ...prop, type } : prop));
  };

  const handleIsArrayChange = (id: string, isArray: boolean) => {
    setProperties(properties.map(prop => prop.id === id ? { ...prop, isArray } : prop));
  };

  const handleIsRequiredChange = (id: string, isRequired: boolean) => {
    setProperties(properties.map(prop => prop.id === id ? { ...prop, isRequired } : prop));
  };

  const handleAddNestedProperty = (parentId: string) => {
    console.log("Add nested property for:", parentId);
    // TODO: Implement logic to add nested properties. 
    // This might involve adding a `nestedProperties` array to the parent property 
    // and rendering another JsonSchemaInput or similar component recursively.
  };

  return (
    <div className="p-4 rounded-lg">
      {properties.length > 0 && <h2 className="text-lg font-semibold mb-4">Property</h2>}
      {properties.map(prop => (
        <PropertyRow 
          key={prop.id} 
          id={prop.id}
          propertyName={prop.name}
          propertyDescription={prop.description}
          propertyType={prop.type}
          isArray={prop.isArray}
          isRequired={prop.isRequired}
          onPropertyNameChange={handlePropertyNameChange}
          onPropertyDescriptionChange={handlePropertyDescriptionChange}
          onPropertyTypeChange={handlePropertyTypeChange}
          onIsArrayChange={handleIsArrayChange}
          onIsRequiredChange={handleIsRequiredChange}
          onDelete={() => deleteProperty(prop.id)} 
          onAddNestedProperty={handleAddNestedProperty}
        />
      ))}
      <div className="mt-2 flex flex-col items-start space-y-2">
        {/* {isObjectType && ( // Removed conditional rendering based on global isObjectType 
          <Button
            variant="link"
            onClick={() => console.log("Legacy Add nested property clicked")}
            className="p-0 h-auto text-blue-500 hover:text-blue-400"
          >
            Add nested property
          </Button>
        )} */}
        <Button
          type="button"
          variant="outline"
          onClick={addProperty}
        >
          Add property
        </Button>
      </div>
    </div>
  );
}

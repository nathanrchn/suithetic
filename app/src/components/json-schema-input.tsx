import { z } from "zod";
import { nanoid } from "@/lib/utils";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import PropertyRow from "@/components/property-row";
import { zodToJsonSchema } from "zod-to-json-schema";

interface Property {
  id: string;
  name: string;
  description: string;
  type: string;
  isArray: boolean;
  isRequired: boolean;
  nestedProperties: Property[];
}

const buildZodShapeRecursive = (
  props: Property[],
  currentDepth: number,
  maxObjectDepth: number
): z.ZodRawShape => {
  const shape: z.ZodRawShape = {};
  props.forEach(prop => {
    const trimmedName = prop.name.trim();
    if (!trimmedName) return;

    let zodType: z.ZodTypeAny;

    switch (prop.type) {
      case "string":
        zodType = z.string();
        break;
      case "number":
        zodType = z.number();
        break;
      case "integer":
        zodType = z.number().int();
        break;
      case "boolean":
        zodType = z.boolean();
        break;
      case "object":
        if (currentDepth >= maxObjectDepth) {
          zodType = z.object({});
        } else {
          const nestedShape = buildZodShapeRecursive(
            prop.nestedProperties,
            currentDepth + 1,
            maxObjectDepth
          );
          zodType = z.object(nestedShape);
        }
        break;
      case "enum":
        zodType = z.string();
        break;
      default:
        zodType = z.any();
    }

    if (prop.isArray) {
      zodType = z.array(zodType);
    }

    if (!prop.isRequired) {
      zodType = zodType.optional();
    }

    shape[trimmedName] = zodType;
  });
  return shape;
};

export default function JsonSchemaInput({ schema, setSchema }: { schema: z.ZodObject<any> | null, setSchema: (schema: z.ZodObject<any> | null) => void }) {
  const [confirmed, setConfirmed] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);

  useEffect(() => {
    setConfirmed(false);
  }, [properties]);

  useEffect(() => {
    if (schema) {
      console.log("schema", zodToJsonSchema(schema));
    }
  }, [schema]);

  const addProperty = () => {
    setProperties([...properties, { id: nanoid(), name: "", description: "", type: "string", isArray: false, isRequired: false, nestedProperties: [] }]);
  };

  const addNestedProperty = (parentId: string) => {
    setProperties(properties.map(prop => prop.id === parentId ? { ...prop, nestedProperties: [...prop.nestedProperties, { id: nanoid(), name: "", description: "", type: "string", isArray: false, isRequired: false, nestedProperties: [] }] } : prop));
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

  const handleConfirm = () => {
    if (properties.length === 0) {
      setSchema(z.object({}));
    } else {
      const shape = buildZodShapeRecursive(properties, 0, 1);
      const generatedSchema = z.object(shape);
      setSchema(generatedSchema);
    }
    setConfirmed(true);
  };

  return (
    <div className="p-4 rounded-lg">
      {properties.length > 0 && <h2 className="text-lg font-semibold mb-4">Property</h2>}
      {properties.map(prop => (
        <div key={prop.id}>
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
          />
          <div className="pl-10">
            {prop.nestedProperties.map(nestedProp => (
              <PropertyRow 
                key={nestedProp.id} 
                id={nestedProp.id}
                propertyName={nestedProp.name}
                propertyDescription={nestedProp.description}
                propertyType={nestedProp.type}
                isArray={nestedProp.isArray}
                isRequired={nestedProp.isRequired}
                onPropertyNameChange={handlePropertyNameChange}
                onPropertyDescriptionChange={handlePropertyDescriptionChange}
                onPropertyTypeChange={handlePropertyTypeChange}
                onIsArrayChange={handleIsArrayChange}
                onIsRequiredChange={handleIsRequiredChange}
                onDelete={() => deleteProperty(nestedProp.id)}
              />
            ))}
            {prop.type === "object" && <Button
                type="button"
                variant="outline"
                onClick={() => addNestedProperty(prop.id)}
              >
                Add nested property
              </Button>
            }
          </div>
        </div>
      ))}
      <div className="mt-2 flex flex-col items-start space-y-2">
        <Button
          type="button"
          variant="outline"
          onClick={addProperty}
        >
          Add property
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={handleConfirm}
          className="mt-2 self-end"
          disabled={confirmed}
        >
          Apply Changes
        </Button>
      </div>
    </div>
  );
}

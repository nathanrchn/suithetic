import { HFDataset } from "@/lib/types";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export type Template = {
  name: string;
  description: string;
  dataset: Pick<HFDataset, "path" | "config" | "split">;
  prompt: string;
  inputFeature: string;
  isStructured: boolean;
  maxTokens: number;
  modelId: string;
  price: number;
  visibility: number;
  color?: "blue" | "purple" | "green" | "orange" | "pink" | "teal";
};

const colorVariants = {
  blue: {
    card: "bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800",
    button: "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
  },
  purple: {
    card: "bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800",
    button: "bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
  },
  green: {
    card: "bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800",
    button: "bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
  },
  orange: {
    card: "bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200 dark:border-orange-800",
    button: "bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800"
  },
  pink: {
    card: "bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-950 dark:to-pink-900 border-pink-200 dark:border-pink-800",
    button: "bg-gradient-to-r from-pink-600 to-pink-700 hover:from-pink-700 hover:to-pink-800"
  },
  teal: {
    card: "bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-950 dark:to-teal-900 border-teal-200 dark:border-teal-800",
    button: "bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800"
  }
};

export function TemplateCard({ template }: { template: Template }) {
  const router = useRouter();
  const colors = colorVariants[template.color || "blue"];

  const handleClick = () => {
    const params = new URLSearchParams({
      datasetPath: template.dataset.path,
      datasetConfig: template.dataset.config,
      datasetSplit: template.dataset.split,
      datasetName: template.name,
      description: template.description,
      modelId: template.modelId,
      maxTokens: template.maxTokens.toString(),
      inputFeature: template.inputFeature,
      isStructured: template.isStructured.toString(),
      prompt: template.prompt,
      visibility: template.visibility.toString(),
      price: template.price.toString(),
    });
    router.push(`/create?${params.toString()}`);
  };

  return (
    <Card className={`${colors.card} hover:shadow-md transition-all duration-200 hover:scale-102`}>
      <CardContent className="px-3 py-0">
        <div className="space-y-2">
          <div>
            <h3 className="font-medium text-base text-gray-900 dark:text-gray-100">{template.name}</h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 line-clamp-2">{template.description}</p>
          </div>
          <Button 
            onClick={handleClick}
            size="sm"
            className={`w-full ${colors.button} text-white font-medium py-1.5 px-3 rounded-md shadow-sm transition-all duration-200`}
          >
            Create
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

import { PagePlaceholder } from "@/components/PagePlaceholder";
import { PiggyBank } from "lucide-react";

export function Budgets() {
  return (
    <PagePlaceholder
      title="Budgets"
      description="Set monthly limits and track spending against them."
      icon={PiggyBank}
    />
  );
}

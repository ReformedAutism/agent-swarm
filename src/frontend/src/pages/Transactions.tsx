import { PagePlaceholder } from "@/components/PagePlaceholder";
import { ArrowLeftRight } from "lucide-react";

export function Transactions() {
  return (
    <PagePlaceholder
      title="Transactions"
      description="Every deposit and withdrawal, in one ledger."
      icon={ArrowLeftRight}
    />
  );
}

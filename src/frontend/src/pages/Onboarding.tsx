import { PagePlaceholder } from "@/components/PagePlaceholder";
import { Sparkles } from "lucide-react";

export function Onboarding() {
  return (
    <PagePlaceholder
      title="Welcome to WealthTrack"
      description="Set your starting balance and preferred currency to get going."
      icon={Sparkles}
    />
  );
}

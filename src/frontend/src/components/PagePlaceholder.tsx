import type { LucideIcon } from "lucide-react";

interface PagePlaceholderProps {
  title: string;
  description: string;
  icon: LucideIcon;
}

/**
 * Temporary shell rendered by section pages until their dedicated page tasks
 * land. Keeps every route reachable and visually consistent in the meantime.
 */
export function PagePlaceholder({
  title,
  description,
  icon: Icon,
}: PagePlaceholderProps) {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 md:px-8">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold tracking-tight">
          {title}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      <div
        className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-card py-20 text-center"
        data-ocid="page.empty_state"
      >
        <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Icon className="size-6" />
        </span>
        <p className="mt-4 text-sm font-medium text-foreground">
          This section is being set up
        </p>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Your {title.toLowerCase()} view will appear here shortly.
        </p>
      </div>
    </div>
  );
}

import { cn } from "@/components/ui/utils";

export function Divider({ className }: { className?: string }) {
  return <div className={cn("h-px w-full bg-card-border/70", className)} />;
}

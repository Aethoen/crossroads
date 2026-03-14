import type { HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/components/ui/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.22em]",
  {
    variants: {
      variant: {
        warm: "border-primary/20 bg-primary/10 text-primary",
        cool: "border-secondary/20 bg-secondary/10 text-secondary",
        gold: "border-accent/40 bg-accent/20 text-stone-800",
        neutral: "border-card-border bg-white/50 text-muted",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  },
);

type BadgeProps = HTMLAttributes<HTMLDivElement> & VariantProps<typeof badgeVariants>;

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

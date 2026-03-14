import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/components/ui/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-full text-sm font-semibold transition-transform duration-200 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring active:scale-[0.98]",
  {
    variants: {
      variant: {
        primary:
          "bg-primary px-4 py-2.5 text-white shadow-[0_14px_34px_rgba(255,107,74,0.28)] hover:-translate-y-0.5",
        secondary:
          "bg-secondary px-4 py-2.5 text-white shadow-[0_14px_34px_rgba(15,118,110,0.22)] hover:-translate-y-0.5",
        ghost:
          "border border-card-border bg-white/50 px-4 py-2.5 text-foreground hover:bg-white/90",
        subtle:
          "bg-white/60 px-4 py-2.5 text-foreground hover:bg-white",
      },
      size: {
        sm: "h-9 px-3 text-xs",
        md: "h-11 px-4",
        lg: "h-12 px-5 text-sm",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}

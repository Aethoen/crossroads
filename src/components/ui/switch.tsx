"use client";

import * as SwitchPrimitive from "@radix-ui/react-switch";
import { cn } from "@/components/ui/utils";

export function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      className={cn(
        "peer inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border border-card-border bg-white/80 shadow-inner transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring data-[state=checked]:bg-secondary",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb className="block h-5 w-5 translate-x-0.5 rounded-full bg-foreground shadow transition-transform data-[state=checked]:translate-x-[1.45rem] data-[state=checked]:bg-white" />
    </SwitchPrimitive.Root>
  );
}

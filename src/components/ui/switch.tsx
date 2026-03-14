"use client"

import { Switch as SwitchPrimitive } from "@base-ui/react/switch"

import { cn } from "@/lib/utils"

function Switch({
  className,
  size = "default",
  ...props
}: SwitchPrimitive.Root.Props & {
  size?: "sm" | "default"
}) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      data-size={size}
      className={cn(
        "peer group/switch relative inline-flex shrink-0 items-center border-2 border-border bg-white shadow-[3px_3px_0px_0px_#2d2d2d] transition-all outline-none after:absolute after:-inset-x-3 after:-inset-y-2 focus-visible:border-[#2d5da1] focus-visible:ring-4 focus-visible:ring-[#2d5da1]/15 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 data-[size=default]:h-8 data-[size=default]:w-16 data-[size=sm]:h-7 data-[size=sm]:w-13 data-checked:bg-secondary data-unchecked:bg-white data-disabled:cursor-not-allowed data-disabled:opacity-50",
        className
      )}
      style={{ borderRadius: "999px" }}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className="pointer-events-none block rounded-full border-2 border-border bg-accent ring-0 transition-transform group-data-[size=default]/switch:size-6 group-data-[size=sm]/switch:size-5 group-data-[size=default]/switch:data-checked:translate-x-[calc(100%-2px)] group-data-[size=sm]/switch:data-checked:translate-x-[calc(100%-2px)] group-data-[size=default]/switch:data-unchecked:translate-x-0 group-data-[size=sm]/switch:data-unchecked:translate-x-0"
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }

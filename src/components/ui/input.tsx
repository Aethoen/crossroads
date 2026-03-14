"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      data-slot="input"
      className={cn(
        "flex h-12 w-full border-2 border-input bg-white px-4 text-base text-foreground shadow-[4px_4px_0px_0px_#2d2d2d] transition-[transform,box-shadow,border-color] duration-100 placeholder:text-foreground/40 focus-visible:border-[#2d5da1] focus-visible:ring-4 focus-visible:ring-[#2d5da1]/15 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60",
        className
      )}
      style={{ borderRadius: "var(--wobble-sm)" }}
      {...props}
    />
  );
}

export { Input };

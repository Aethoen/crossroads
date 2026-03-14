"use client"

import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center border-[3px] border-border bg-clip-padding font-medium whitespace-nowrap text-foreground shadow-[4px_4px_0px_0px_#2d2d2d] transition-[transform,box-shadow,background-color,color,border-color] duration-100 outline-none select-none focus-visible:border-[#2d5da1] focus-visible:ring-4 focus-visible:ring-[#2d5da1]/15 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-4 aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-white text-foreground hover:bg-accent hover:text-accent-foreground hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#2d2d2d] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none",
        outline:
          "bg-background hover:bg-muted hover:text-foreground hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#2d2d2d] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none aria-expanded:bg-muted aria-expanded:text-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-[#2d5da1] hover:text-white hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#2d2d2d] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
        ghost:
          "border-dashed bg-white/70 shadow-[2px_2px_0px_0px_#2d2d2d] hover:bg-muted hover:text-foreground hover:-rotate-1 aria-expanded:bg-muted aria-expanded:text-foreground",
        destructive:
          "bg-destructive text-white hover:bg-[#d93636] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#2d2d2d] focus-visible:border-destructive/40 focus-visible:ring-destructive/20 active:translate-x-[4px] active:translate-y-[4px] active:shadow-none",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-12 gap-2 px-4 text-lg has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        xs: "h-9 gap-1.5 px-3 text-sm has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-3.5",
        sm: "h-10 gap-1.5 px-4 text-base has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3 [&_svg:not([class*='size-'])]:size-4",
        lg: "h-14 gap-2 px-6 text-xl has-data-[icon=inline-end]:pr-5 has-data-[icon=inline-start]:pl-5",
        icon: "size-12",
        "icon-xs": "size-9 [&_svg:not([class*='size-'])]:size-3.5",
        "icon-sm": "size-10",
        "icon-lg": "size-14",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      style={{ borderRadius: "var(--wobble-sm)" }}
      {...props}
    />
  )
}

export { Button, buttonVariants }

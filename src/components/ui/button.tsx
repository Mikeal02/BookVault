import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "relative inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium tracking-[-0.01em] transition-[background-color,border-color,box-shadow,color,transform,opacity] duration-200 ease-[cubic-bezier(0.2,0,0,1)] active:translate-y-[0.5px] disabled:pointer-events-none disabled:opacity-45 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-[var(--elev-2)] hover:bg-primary/92 hover:shadow-[var(--elev-3)]",
        destructive:
          "bg-destructive text-destructive-foreground shadow-[var(--elev-2)] hover:bg-destructive/92",
        outline:
          "border border-border bg-card text-foreground shadow-[var(--elev-1)] hover:border-primary/40 hover:bg-muted",
        secondary:
          "bg-secondary text-secondary-foreground shadow-[var(--elev-1)] hover:bg-secondary/85",
        ghost: "text-foreground hover:bg-foreground/[0.06]",
        subtle:
          "bg-muted text-foreground hover:bg-foreground/[0.08]",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3 text-[13px]",
        xs: "h-8 rounded-md px-2.5 text-[12px] [&_svg]:size-3.5",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10 md:h-9 md:w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const bankingButtonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-[var(--shadow-button)] hover:bg-primary-dark active:scale-95",
        primary: "bg-gradient-to-r from-primary to-primary-light text-primary-foreground shadow-[var(--shadow-button)] hover:shadow-lg hover:scale-105 active:scale-95",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        success: "bg-success text-success-foreground shadow-[var(--shadow-button)] hover:bg-success/90",
        danger: "bg-destructive text-destructive-foreground shadow-[var(--shadow-button)] hover:bg-destructive/90",
        outline: "border border-primary text-primary bg-transparent hover:bg-primary hover:text-primary-foreground",
        pix: "bg-gradient-to-r from-success to-success text-success-foreground shadow-[var(--shadow-button)] hover:scale-105 active:scale-95",
      },
      size: {
        default: "h-12 px-6 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-14 rounded-lg px-8",
        icon: "h-12 w-12",
        wide: "h-14 px-12 text-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface BankingButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof bankingButtonVariants> {
  asChild?: boolean
}

const BankingButton = React.forwardRef<HTMLButtonElement, BankingButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(bankingButtonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
BankingButton.displayName = "BankingButton"

export { BankingButton, bankingButtonVariants }
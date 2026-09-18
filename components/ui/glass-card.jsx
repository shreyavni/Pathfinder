import * as React from "react"

import { cn } from "@/lib/utils"

const GlassCard = React.forwardRef(
  ({ className, hover = true, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-xl border border-border/60 bg-card/70 backdrop-blur-xl shadow-sm transition-all duration-300",
        hover &&
          "hover:shadow-lg hover:border-primary/30 hover:-translate-y-0.5",
        className
      )}
      {...props}
    />
  )
)
GlassCard.displayName = "GlassCard"

export { GlassCard }
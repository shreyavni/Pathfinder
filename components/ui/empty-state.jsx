import * as React from "react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const EmptyState = ({
  icon: Icon,
  title,
  description,
  action,
  className,
}) => (
  <div
    className={cn(
      "flex flex-col items-center justify-center text-center py-12 px-4 rounded-xl border border-dashed border-border/60 bg-card/40",
      className
    )}
  >
    {Icon ? (
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
        <Icon className="h-7 w-7" />
      </div>
    ) : null}
    <h3 className="text-lg font-semibold">{title}</h3>
    {description ? (
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
    ) : null}
    {action ? <div className="mt-5">{action}</div> : null}
  </div>
)

export { EmptyState }
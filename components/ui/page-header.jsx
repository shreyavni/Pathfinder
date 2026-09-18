import * as React from "react"

import { cn } from "@/lib/utils"

const PageHeader = ({
  title,
  description,
  action,
  className,
  children,
}) => (
  <div
    className={cn(
      "flex flex-col gap-1 mb-8",
      className
    )}
  >
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
          {title}
        </h1>
        {description ? (
          <p className="text-muted-foreground text-base sm:text-lg">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
    {children}
  </div>
)

export { PageHeader }
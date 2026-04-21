"use client";

import { LucideIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface WizardInputCardProps {
  id: string;
  title: string;
  description: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  icon: LucideIcon;
  variant?: "muted" | "default";
  disabled?: boolean;
}

export function WizardInputCard({
  id,
  title,
  description,
  label,
  value,
  onChange,
  placeholder,
  icon: Icon,
  variant = "default",
  disabled = false,
}: WizardInputCardProps) {
  return (
    <Card className={cn(
      "flex h-full flex-col overflow-hidden transition-opacity duration-300",
      variant === "muted" ? "border-border/60 bg-muted/30" : "shadow-sm",
      disabled && "opacity-60 pointer-events-none"
    )}>
      <CardHeader className="shrink-0 space-y-1 pb-3">
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
            <Icon className="size-4 text-primary" aria-hidden />
          </span>
          <CardTitle className={cn(
            "text-lg font-bold",
            variant === "muted" && "text-sm uppercase tracking-wider text-muted-foreground"
          )}>
            {title}
          </CardTitle>
        </div>
        <CardDescription className="text-sm leading-relaxed">
          {description}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="flex flex-1 flex-col space-y-5 pt-2">
        <div className="flex flex-1 flex-col space-y-2">
          <Label 
            htmlFor={id} 
            className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
          >
            {label}
          </Label>
          <Textarea
            id={id}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            className={cn(
              "resize-none overflow-y-auto font-mono text-sm leading-relaxed",
              "h-[400px] lg:h-[600px]",
              variant === "muted" && "bg-background/50"
            )}
          />
        </div>
      </CardContent>
    </Card>
  );
}

"use client";

import { useCallback, useState } from "react";
import { Check, Copy } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { wizardTextBlockHeightClass } from "@/config/wizard-ui";
import { cn } from "@/lib/utils";
import type { TailorResumeData } from "@/types/resume-tailor";

type ExportPanelProps = {
  data: TailorResumeData;
  onError: (message: string) => void;
};

export function ExportPanel({ data, onError }: ExportPanelProps) {
  const [isCopied, setIsCopied] = useState(false);

  const copyTex = useCallback(() => {
    navigator.clipboard.writeText(data.tailoredTex).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }).catch((e) => onError(e instanceof Error ? e.message : "Copy failed"));
  }, [data.tailoredTex, onError]);

  return (
    <Card className="border-border/80 shadow-sm ring-1 ring-border/50">
      <CardHeader className="space-y-1">
        <CardTitle className="text-xl font-semibold">Tailored LaTeX source</CardTitle>
        <CardDescription className="text-base leading-relaxed">
          Copy the .tex source and use it in Overleaf or locally to generate your final resume.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea
          className={cn("rounded-lg border bg-muted/30", wizardTextBlockHeightClass)}
        >
          <pre className="p-4 font-mono text-xs leading-relaxed">
            {data.tailoredTex}
          </pre>
        </ScrollArea>
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2 border-t border-border/80 bg-muted/20 pt-4">
        <Button
          type="button"
          variant="secondary"
          onClick={copyTex}
          className="gap-2 shadow-sm min-w-32"
        >
          {isCopied ? <Check className="size-4 text-green-600" /> : <Copy className="size-4" />}
          {isCopied ? "Copied!" : "Copy .tex"}
        </Button>
      </CardFooter>
    </Card>
  );
}

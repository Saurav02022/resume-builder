"use client";

import { useCallback, useState } from "react";
import { Download, Loader2 } from "lucide-react";

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
import { apiRoutes } from "@/config/routes";
import { wizardTextBlockHeightClass } from "@/config/wizard-ui";
import { cn } from "@/lib/utils";
import type { TailorResumeData } from "@/types/resume-tailor";

type ExportPanelProps = {
  data: TailorResumeData;
  onError: (message: string) => void;
};

export function ExportPanel({ data, onError }: ExportPanelProps) {
  const [pdfLoading, setPdfLoading] = useState(false);

  const downloadTex = useCallback(() => {
    const blob = new Blob([data.tailoredTex], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "resume-tailored.tex";
    a.click();
    URL.revokeObjectURL(url);
  }, [data.tailoredTex]);

  const downloadPdf = useCallback(async () => {
    setPdfLoading(true);
    onError("");
    try {
      const res = await fetch(apiRoutes.resume.compile, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tex: data.tailoredTex }),
      });
      if (!res.ok) {
        const errJson = (await res.json().catch(() => null)) as {
          error?: { message?: string };
        } | null;
        const msg =
          errJson?.error?.message ?? `PDF failed (${res.status})`;
        throw new Error(msg);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "resume-tailored.pdf";
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      onError(e instanceof Error ? e.message : "PDF download failed");
    } finally {
      setPdfLoading(false);
    }
  }, [data.tailoredTex, onError]);

  return (
    <Card className="border-border/80 shadow-sm ring-1 ring-border/50">
      <CardHeader className="space-y-1">
        <CardTitle className="text-xl font-semibold">Tailored LaTeX source</CardTitle>
        <CardDescription className="text-base leading-relaxed">
          Use the .tex in Overleaf or locally. PDF here is a quick print preview
          (monospace); for real layout, open the file in Overleaf.
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
          onClick={downloadTex}
          className="gap-2 shadow-sm"
        >
          <Download className="size-4" />
          Download .tex
        </Button>
        <Button
          type="button"
          onClick={() => void downloadPdf()}
          disabled={pdfLoading}
          className="gap-2 shadow-sm"
        >
          {pdfLoading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Download className="size-4" />
          )}
          Download PDF
        </Button>
      </CardFooter>
    </Card>
  );
}

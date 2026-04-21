import { useCallback, useState } from "react";
import { Check, Copy, FileCode, FileDown, Loader2 } from "lucide-react";

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
import { cn } from "@/lib/utils";
import type { TailorResumeData } from "@/types/resume-tailor";

type ExportPanelProps = {
  data: TailorResumeData;
  onError: (message: string) => void;
};

export function ExportPanel({ data, onError }: ExportPanelProps) {
  const [isCopied, setIsCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const constructFilename = useCallback(() => {
    const rawName = data.candidateName || "Candidate";
    const rawCompany = data.targetCompany || "Company";
    const rawRole = data.targetRole || "Role";
    const rawLocation = data.targetLocation || "Location";
    
    return `${rawName}+${rawCompany}+${rawRole}+${rawLocation}`
      .replace(/\s+/g, "+")
      .replace(/[^\w+]/g, "")
      + ".tex";
  }, [data]);

  const handleDownloadTex = useCallback(async () => {
    setIsDownloading(true);
    try {
      const filename = constructFilename();
      const blob = new Blob([data.tailoredTex], { type: "text/plain" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (e) {
      onError(e instanceof Error ? e.message : "Download failed");
    } finally {
      setIsDownloading(false);
    }
  }, [data.tailoredTex, constructFilename, onError]);

  const copyTex = useCallback(() => {
    navigator.clipboard.writeText(data.tailoredTex).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }).catch((e) => onError(e instanceof Error ? e.message : "Copy failed"));
  }, [data.tailoredTex, onError]);

  return (
    <div className="grid gap-8 lg:grid-cols-12">
      {/* Settings & Actions */}
      <div className="space-y-6 lg:col-span-12">
        <div className="grid gap-8 md:grid-cols-2">
          {/* Action Card */}
          <Card className="border-primary/20 shadow-md ring-1 ring-primary/10">
            <CardHeader className="space-y-1">
              <CardTitle className="flex items-center gap-2.5 text-xl font-bold">
                <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
                  <FileDown className="size-5 text-primary" aria-hidden />
                </span>
                Export Resume
              </CardTitle>
              <CardDescription className="text-sm leading-relaxed">
                Download your tailored LaTeX source code.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-xl border border-border/60 bg-muted/20 p-6">
                <div className="flex items-start gap-4">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
                    <FileCode className="size-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-semibold text-foreground">LaTeX Source (.tex)</p>
                    <p className="text-xs text-muted-foreground">
                      Best for compiling to PDF using Overleaf or a local LaTeX distribution.
                    </p>
                  </div>
                </div>
                <div className="mt-6 flex flex-col gap-3">
                  <Button
                    onClick={handleDownloadTex}
                    disabled={isDownloading}
                    className="w-full gap-2 shadow-sm"
                    size="lg"
                  >
                    {isDownloading ? <Loader2 className="size-4 animate-spin" /> : <FileDown className="size-4" />}
                    Download .tex File
                  </Button>
                  <Button
                    onClick={copyTex}
                    variant="outline"
                    className="w-full gap-2 shadow-sm"
                  >
                    {isCopied ? <Check className="size-4 text-green-600" /> : <Copy className="size-4" />}
                    {isCopied ? "Copied to Clipboard!" : "Copy Code"}
                  </Button>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3 border-t border-border/80 bg-muted/10 pt-4">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Constructed Filename Preview:
              </p>
              <code className="rounded-md bg-muted px-2 py-1 font-mono text-[11px] text-primary">
                {constructFilename()}
              </code>
            </CardFooter>
          </Card>

          {/* Source Preview Card */}
          <Card className="border-border/80 shadow-sm transition-all hover:shadow-md">
            <CardHeader className="space-y-1">
              <CardTitle className="text-sm font-bold">LaTeX Source Preview</CardTitle>
              <CardDescription className="text-xs">
                The tailored code generated from the master template.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px] rounded-lg border bg-muted/40">
                <pre className="p-4 font-mono text-[10px] leading-relaxed text-foreground/80">
                  {data.tailoredTex}
                </pre>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

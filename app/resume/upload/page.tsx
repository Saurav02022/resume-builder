"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { AlertCircle, Loader2, FileUp } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRoutes, routes } from "@/config/routes";
import { useWizardStore } from "@/store/wizard-store";

const LOG_PREFIX = "[resume/upload]";

export default function ResumeUploadPage() {
  const router = useRouter();
  const setOriginalText = useWizardStore((s) => s.setOriginalText);
  const setOriginalFileName = useWizardStore((s) => s.setOriginalFileName);
  const originalFileName = useWizardStore((s) => s.originalFileName);

  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = useCallback(async () => {
    if (!file) return;

    setError(null);
    setLoading(true);
    setOriginalText("");
    
    try {
      console.info(LOG_PREFIX, "uploading file to parse gateway:", file.name);

      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(apiRoutes.resume.parse, {
        method: "POST",
        body: formData,
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(!json.success ? json.error.message : `HTTP ${res.status}`);
      }

      // Save raw parsed data into standard global context
      setOriginalText(json.data.text);
      setOriginalFileName(file.name);

      console.info(LOG_PREFIX, "parse success, navigating to job step");
      router.push(routes.resume.job);
      
    } catch (e) {
      const message = e instanceof Error ? e.message : "Something went wrong parsing the file.";
      console.error(LOG_PREFIX, "upload failed", message);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [file, router, setOriginalText, setOriginalFileName]);

  const canUpload = file !== null;

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">
          Step 1 — Base Resume
        </p>
        <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground">
          Upload your original resume
        </h1>
        <p className="max-w-3xl text-base leading-relaxed text-muted-foreground">
          Upload your most comprehensive PDF or DOCX file. Our AI uses this base truth to extract your history and tailor it for the job description you provide next.
        </p>
      </div>

      <Card>
        <CardHeader className="space-y-1 pb-2">
          <CardTitle className="flex items-center gap-2.5 text-lg font-bold">
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
              <FileUp className="size-4 text-primary" aria-hidden />
            </span>
            Target Document
          </CardTitle>
          <CardDescription className="text-base leading-relaxed">
            Must be a standard readable format (.pdf, .docx). Scanned images are not yet fully supported.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 pt-2">
          <div className="space-y-2">
            <Label htmlFor="resume-file-upload">Resume File</Label>
            <Input 
              id="resume-file-upload" 
              type="file" 
              accept=".pdf,.doc,.docx" 
              onChange={handleFileChange}
              className="cursor-pointer file:text-primary file:font-semibold"
            />
          </div>

          {error ? (
            <Alert variant="destructive">
              <AlertCircle />
              <AlertTitle>Extraction Failed</AlertTitle>
              <AlertDescription className="whitespace-pre-wrap font-mono text-xs">
                {error}
              </AlertDescription>
            </Alert>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <div className="space-y-1">
              {originalFileName && !loading ? (
                <p className="text-xs text-muted-foreground">
                  You previously uploaded: <strong className="font-medium text-foreground">{originalFileName}</strong>.
                  <br/>Uploading a new file will replace it.
                </p>
              ) : null}
            </div>
            
            <Button
              type="button"
              disabled={!canUpload || loading}
              onClick={() => void handleUpload()}
              className="gap-2 px-6 shadow-sm"
            >
              {loading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <FileUp className="size-4" />
              )}
              {loading ? "Parsing Context..." : "Upload & Continue"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

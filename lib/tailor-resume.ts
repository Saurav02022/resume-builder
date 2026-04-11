import "server-only";

import {
  GoogleGenerativeAI,
  SchemaType,
  type GenerationConfig,
  type ResponseSchema,
} from "@google/generative-ai";

import { buildTailorResumePrompt } from "@/prompts/tailor-resume";
import { normalizeTailorPayload } from "@/lib/tailor-ats";
import type { AtsScore, TailorResumeData } from "@/types/resume-tailor";

/** Unified prefix so DevTools + terminal logs read as one pipeline. */
const FLOW = "[tailor-flow]";
const LOG_PREFIX = "[tailor-resume-server]";

/**
 * Default model: fast, good for long JSON + full LaTeX. Override with `GEMINI_MODEL`.
 */
const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";

const TAILOR_SYSTEM_INSTRUCTION = [
  "You are a strictly grounded assistant limited to the information provided in the user message.",
  "In your answers, rely ONLY on the facts from the base resume LaTeX.",
  "You must NOT access or use your own knowledge to add employers, dates, tools, or metrics not present in the resume.",
  "Return a single JSON object matching the response schema exactly. No markdown fences, no text outside the JSON.",
  "For N+ years in the JD: compute cumulative tenure by summing every Experience role's date range (never use only the Present role as total).",
].join(" ");

const ATS_SCORE_ORIGINAL: ResponseSchema = {
  type: SchemaType.OBJECT,
  required: ["score", "band", "rationale"],
  properties: {
    score: {
      type: SchemaType.INTEGER,
      description:
        "0–100: baseline ATS-style alignment of the ORIGINAL resume vs this JD (before edits).",
    },
    band: {
      type: SchemaType.STRING,
      description: "Short label, e.g. Strong fit, Good, Moderate, Needs work.",
    },
    rationale: {
      type: SchemaType.STRING,
      description:
        "2–4 sentences: keyword fit, structure, honest gaps vs this JD. If JD requires N+ years, use cumulative tenure from all Experience roles (user prompt Step 2)—never only the latest/Present role.",
    },
  },
};

const ATS_SCORE_TAILORED: ResponseSchema = {
  type: SchemaType.OBJECT,
  required: ["score", "band", "rationale"],
  properties: {
    score: {
      type: SchemaType.INTEGER,
      description:
        "0–100: ATS-style alignment of the TAILORED resume vs this JD. Strong scores when must-haves are met or nearly met; do not inflate if hard must-haves are truly missing.",
    },
    band: {
      type: SchemaType.STRING,
      description: "Short label; use Strong fit when score is in the high band.",
    },
    rationale: {
      type: SchemaType.STRING,
      description:
        "2–4 sentences: what you optimized for ATS/JD scan; remaining gaps (honest). For year requirements use cumulative Experience tenure (user prompt Step 2).",
    },
  },
};

/**
 * Gemini JSON schema for structured output: analysis + full LaTeX in one parseable response.
 */
const TAILOR_RESPONSE_SCHEMA: ResponseSchema = {
  type: SchemaType.OBJECT,
  required: [
    "comparisonSummary",
    "atsScores",
    "suggestions",
    "issues",
    "fixes",
    "tailoredTex",
  ],
  properties: {
    comparisonSummary: {
      type: SchemaType.STRING,
      description:
        "2–4 sentences: how the candidate maps to this JD before vs after tailoring (high-level).",
    },
    atsScores: {
      type: SchemaType.OBJECT,
      required: ["original", "tailored", "liftSummary"],
      properties: {
        original: ATS_SCORE_ORIGINAL,
        tailored: ATS_SCORE_TAILORED,
        liftSummary: {
          type: SchemaType.STRING,
          description:
            "One line: difference between original and tailored scores; what drove the change.",
        },
      },
      description:
        "Before/after ATS-style estimates vs the same JD; same rubric for both.",
    },
    suggestions: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      description:
        "Actionable tips for this role (keywords, order, emphasis). No invented experience.",
    },
    issues: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        required: ["issue", "whyItMatters"],
        properties: {
          issue: {
            type: SchemaType.STRING,
            description: "What was weak or misaligned vs the JD.",
          },
          whyItMatters: {
            type: SchemaType.STRING,
            description: "Why recruiters or ATS care for this JD.",
          },
        },
      },
    },
    fixes: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        required: [
          "whatChanged",
          "why",
          "beforeSnippet",
          "afterSnippet",
        ],
        properties: {
          whatChanged: {
            type: SchemaType.STRING,
            description:
              "Short title: what changed (section/bullet level).",
          },
          why: {
            type: SchemaType.STRING,
            description:
              "Why this improves JD fit while staying truthful.",
          },
          beforeSnippet: {
            type: SchemaType.STRING,
            description:
              "Verbatim excerpt from the BASE resume LaTeX that this edit replaces (copy/paste from input; minimal lines, enough to see the change).",
          },
          afterSnippet: {
            type: SchemaType.STRING,
            description:
              "Verbatim matching excerpt from tailoredTex after the edit (copy/paste from your output).",
          },
        },
      },
    },
    tailoredTex: {
      type: SchemaType.STRING,
      description:
        "Full LaTeX from \\documentclass through \\end{document}. Must compile to a single US Letter page (no second page; trim/condense content if needed).",
    },
  },
};

/**
 * Structured JSON + grounded resume facts: lower temperature and topP reduce drift vs
 * creative writing. `maxOutputTokens` avoids truncating long `tailoredTex` (see Gemini
 * GenerationConfig: temperature, topP, responseMimeType + responseSchema).
 */
const TAILOR_GENERATION_CONFIG: GenerationConfig = {
  temperature: 0.2,
  topP: 0.9,
  maxOutputTokens: 16384,
  responseMimeType: "application/json",
  responseSchema: TAILOR_RESPONSE_SCHEMA,
};

/**
 * Single Gemini call: structured JSON (`responseSchema`) + full `tailoredTex` LaTeX.
 *
 * Env: `NEXT_PUBLIC_GEMINI_API_KEY`, optional `GEMINI_MODEL` (defaults to `gemini-2.5-flash`).
 */
export async function tailorResumeWithGemini(
  baseResumeTex: string,
  jobDescription: string
): Promise<TailorResumeData> {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) {
    console.error(LOG_PREFIX, "missing NEXT_PUBLIC_GEMINI_API_KEY");
    throw new Error("NEXT_PUBLIC_GEMINI_API_KEY is not set");
  }

  const modelName =
    process.env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL;

  const userPrompt = buildTailorResumePrompt(baseResumeTex, jobDescription);
  const promptChars = userPrompt.length;

  console.info(FLOW, "gemini · model + user prompt built", {
    model: modelName,
    baseResumeChars: baseResumeTex.length,
    jdChars: jobDescription.length,
    userPromptChars: promptChars,
  });

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: modelName,
    systemInstruction: TAILOR_SYSTEM_INSTRUCTION,
    generationConfig: TAILOR_GENERATION_CONFIG,
  });

  const started = Date.now();

  try {
    console.info(
      FLOW,
      "gemini · generateContent → Google Generative AI (one round-trip)"
    );
    const result = await model.generateContent(userPrompt);
    const text = result.response.text();
    if (!text) {
      console.error(FLOW, "gemini FAILED · empty model response text");
      throw new Error("Empty response from model");
    }

    console.info(FLOW, "gemini · response text received", {
      ms: Date.now() - started,
      responseJsonChars: text.length,
    });

    let parsed: TailorResumeData & { atsScore?: AtsScore };
    try {
      parsed = JSON.parse(text) as TailorResumeData & { atsScore?: AtsScore };
    } catch (parseErr) {
      console.error(FLOW, "gemini FAILED · JSON.parse", {
        responseChars: text.length,
        snippet: text.slice(0, 200),
      });
      throw parseErr;
    }

    if (
      typeof parsed.tailoredTex !== "string" ||
      parsed.tailoredTex.trim().length === 0
    ) {
      console.error(FLOW, "gemini FAILED · missing tailoredTex");
      throw new Error("Model returned no tailoredTex");
    }

    const normalized = normalizeTailorPayload(parsed);
    console.info(FLOW, "gemini · JSON parsed + normalizeTailorPayload OK", {
      totalMs: Date.now() - started,
      tailoredTexChars: normalized.tailoredTex.length,
      fixesCount: normalized.fixes?.length ?? 0,
    });

    return normalized;
  } catch (e) {
    console.error(
      FLOW,
      "gemini pipeline error",
      e instanceof Error ? e.message : e
    );
    console.error(
      LOG_PREFIX,
      "generateContent or parse failed",
      e instanceof Error ? e.message : e
    );
    throw e;
  }
}

import json
from google import genai
from google.genai import types

from app.core.config import settings

class GeminiClient:
    def __init__(self):
        self.client = genai.Client(api_key=settings.GEMINI_API_KEY)
        self.model_name = settings.GEMINI_MODEL

    def call_genai(self, prompt: str, schema: type, system_instruction: str) -> dict:
        try:
            # Set aggressive safety settings to prevent truncation of technical code
            safety_settings = [
                types.SafetySetting(
                    category="HARM_CATEGORY_HARASSMENT",
                    threshold="BLOCK_NONE"
                ),
                types.SafetySetting(
                    category="HARM_CATEGORY_HATE_SPEECH",
                    threshold="BLOCK_NONE"
                ),
                types.SafetySetting(
                    category="HARM_CATEGORY_SEXUALLY_EXPLICIT",
                    threshold="BLOCK_NONE"
                ),
                types.SafetySetting(
                    category="HARM_CATEGORY_DANGEROUS_CONTENT",
                    threshold="BLOCK_NONE"
                ),
                types.SafetySetting(
                    category="HARM_CATEGORY_CIVIC_INTEGRITY",
                    threshold="BLOCK_NONE"
                ),
            ]

            response = self.client.models.generate_content(
                model=self.model_name,
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    temperature=0.0,
                    top_p=1.0,
                    top_k=1,
                    max_output_tokens=16384,
                    response_mime_type="application/json",
                    response_schema=schema,
                    safety_settings=safety_settings,
                )
            )
            
            raw_text = response.text
            if not raw_text:
                raise ValueError("Empty or Filtered response from AI")
            
            # Clean potential markdown or whitespace
            clean_text = raw_text.strip()
            if clean_text.startswith("```"):
                clean_text = clean_text.strip("`").strip()
                if clean_text.startswith("json"):
                    clean_text = clean_text[4:].strip()

            try:
                return json.loads(clean_text)
            except json.JSONDecodeError as je:
                print(f"\n[AI_CLIENT_ERROR] JSON Decode Error: {str(je)}")
                print(f"[RAW_TEXT_PREVIEW]: {clean_text[:500]}...")
                print(f"[RAW_TEXT_END]: ...{clean_text[-500:]}")
                raise

        except Exception as e:
            raise RuntimeError(f"AI call failed: {str(e)}")

ai_client = GeminiClient()
Broadway_client = ai_client # Internal alias for legacy calls if needed

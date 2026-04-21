# Resume Builder Backend Application

This is the Python-based FastAPI backend service for the Resume Builder application. It is decoupled from the Next.js frontend to independently handle heavy AI lifting, PDF/DOCX parsing, and native DOCX generation, enforcing a strict Single Responsibility Principle (SRP) across its endpoints.

## Architecture

Our backend is built around **5 Core Micro-Endpoints** that split the AI processing logic into easily testable, reliable steps:

1. **`POST /api/resume/parse`**
   - **Purpose:** Extracts raw text from uploaded `.pdf` and `.docx` files.
   - **Engine:** `pdfminer.six` and `python-docx`.

2. **`POST /api/resume/score`**
   - **Purpose:** Evaluates a resume text string against a Job Description. 
   - **Engine:** Uses Google Gemini 2.5 Flash to compute an ATS score, fit band, and textual rationale.

3. **`POST /api/resume/tailor`**
   - **Purpose:** Rewrites and filters an original resume to strictly match the requested Job Description without fabricating experience.
   - **Output:** Professional, strictly formatted Markdown.

4. **`POST /api/resume/compare`**
   - **Purpose:** Evaluates the gap between the Original Resume and the Tailored Resume, outputting remaining flaws and interview prep tips.

5. **`POST /api/resume/download`**
   - **Purpose:** Converts the Tailored Markdown returned by the Tailor API directly into a native Microsoft Word (`.docx`) binary stream.
   - **Engine:** `BeautifulSoup4` and `python-docx`.

## Advanced Prompt Engineering
We employ **Semantic XML Tagging** in `services/prompts.py` for all Gemini interactions. By boxing instructions inside strictly defined tags (like `<system_instruction>`, `<data>`, `<constraints>`), the LLM securely separates user-provided resume strings from backend rules. This drastically reduces hallucination and ensures perfect JSON structural output via Pydantic model schemas.

## Requirements

Ensure you have Python 3.12+ installed.

## Local Development Setup

1. **Navigate to the directory:**
   ```bash
   cd backend
   ```

2. **Create and activate a virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows use: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set Environment Variables:**
   You must provide an API key for Google's Generative AI.
   ```bash
   export GEMINI_API_KEY="your-gemini-api-key"
   ```
   *(Optional)* You can override the model type:
   ```bash
   export GEMINI_MODEL="gemini-2.5-flash"
   ```

5. **Run the Development Server:**
   ```bash
   uvicorn main:app --reload --port 8000
   ```
   The backend will be live at `http://127.0.0.1:8000`. You can visit `http://127.0.0.1:8000/docs` to view the interactive Swagger API documentation.

## Deployment
This backend includes a `Dockerfile` optimized for **Google Cloud Run** using a lightweight python-slim image. It is ready for continuous deployment.

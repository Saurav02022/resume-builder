# Resume Builder Backend Application

This is the Python-based FastAPI backend service for the Resume Builder application. It is decoupled from the Next.js frontend to independently handle heavy AI lifting, PDF/DOCX parsing, and LaTeX-to-PDF generation, enforcing a strict Single Responsibility Principle (SRP) across its endpoints.

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
   - **Purpose:** Compiles the tailored LaTeX source returned by the Tailor API into a PDF binary stream.
   - **Engine:** Python `pdflatex` wrapper and the system `pdflatex` command.

## Advanced Prompt Engineering
We employ **Semantic XML Tagging** in `services/prompts.py` for all Gemini interactions. By boxing instructions inside strictly defined tags (like `<system_instruction>`, `<data>`, `<constraints>`), the LLM securely separates user-provided resume strings from backend rules. This drastically reduces hallucination and ensures perfect JSON structural output via Pydantic model schemas.

## Requirements

Ensure you have Python 3.12+ installed. PDF export also requires a LaTeX distribution that provides the `pdflatex` command, such as TeX Live or MacTeX.

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

   Make sure `pdflatex` is available:
   ```bash
   pdflatex --version
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

## Docker Development

Use Docker when you need PDF export without installing TeX Live or MacTeX on your machine. The image installs the system `pdflatex` command and the LaTeX packages needed by the resume template.

1. **Build the backend image:**
   ```bash
   cd /Users/sauravkumar/Downloads/Projects/resume-builder/backend
   docker build -t resume-builder-backend .
   ```

2. **Run the backend container:**
   ```bash
   docker run --rm -p 8000:8080 --env-file .env --name resume-builder-backend-local resume-builder-backend
   ```

   The backend will be available from the host at:
   ```txt
   http://127.0.0.1:8000
   ```

   The frontend should use:
   ```env
   NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
   ```

3. **Check container health:**
   ```bash
   curl http://127.0.0.1:8000/health
   ```

4. **Stop the backend container:**
   ```bash
   docker stop resume-builder-backend-local
   ```

   If you did not use the container name, find the ID first:
   ```bash
   docker ps
   docker stop <container_id>
   ```

5. **Rebuild after backend code or Dockerfile changes:**
   ```bash
   docker stop resume-builder-backend-local
   docker build -t resume-builder-backend .
   docker run --rm -p 8000:8080 --env-file .env --name resume-builder-backend-local resume-builder-backend
   ```

## Deployment
This backend includes a `Dockerfile` optimized for **Google Cloud Run** using a lightweight python-slim image. It is ready for continuous deployment.

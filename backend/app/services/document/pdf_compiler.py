import re
import shutil
import subprocess
import tempfile
from dataclasses import dataclass
from pathlib import Path
from typing import Optional, Union

import pdflatex


class PdfCompileError(Exception):
    def __init__(self, message: str, details: Optional[str] = None):
        super().__init__(message)
        self.details = details


@dataclass(frozen=True)
class CompiledPdf:
    content: bytes
    log: str


def sanitize_jobname(filename: Optional[str]) -> str:
    raw_name = filename or "Candidate+Company+Role+Location.pdf"
    without_extension = re.sub(r"\.pdf$", "", raw_name, flags=re.IGNORECASE)
    jobname = re.sub(r"[^\w+.-]", "", without_extension.replace(" ", "+"))
    return jobname or "Candidate+Company+Role+Location"


def compile_latex_to_pdf(latex: str, filename: Optional[str] = None) -> CompiledPdf:
    if not latex.strip():
        raise PdfCompileError("LaTeX source is required.")

    if shutil.which("pdflatex") is None:
        raise PdfCompileError(
            "pdflatex command is not installed in the backend runtime.",
            "Install a LaTeX distribution such as TeX Live or MacTeX.",
        )

    jobname = sanitize_jobname(filename)

    try:
        pdf_latex = pdflatex.PDFLaTeX.from_binarystring(
            latex.encode("utf-8"),
            jobname,
        )
        pdf_latex.set_interaction_mode(None)
        pdf, log_output, completed_process = pdf_latex.create_pdf()
        log = decode_output(log_output)

        if completed_process.returncode != 0 or not pdf:
            raise PdfCompileError("LaTeX compile failed.", trim_log(log))

        return CompiledPdf(content=pdf, log=log)
    except FileNotFoundError:
        return compile_latex_with_log(latex, jobname)
    except PdfCompileError:
        raise
    except Exception:
        return compile_latex_with_log(latex, jobname)


def compile_latex_with_log(latex: str, jobname: str) -> CompiledPdf:
    try:
        with tempfile.TemporaryDirectory() as temp_dir:
            tex_path = Path(temp_dir) / f"{jobname}.tex"
            pdf_path = Path(temp_dir) / f"{jobname}.pdf"
            log_path = Path(temp_dir) / f"{jobname}.log"

            tex_path.write_text(latex, encoding="utf-8")

            completed_process = subprocess.run(
                [
                    "pdflatex",
                    "-interaction=nonstopmode",
                    "-halt-on-error",
                    f"-output-directory={temp_dir}",
                    f"-jobname={jobname}",
                    str(tex_path),
                ],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                timeout=30,
                check=False,
            )

            log = read_text(log_path)

            if completed_process.returncode != 0 or not pdf_path.exists():
                stdout = completed_process.stdout.decode("utf-8", errors="replace")
                stderr = completed_process.stderr.decode("utf-8", errors="replace")
                details = trim_log("\n\n".join(part for part in [log, stdout, stderr] if part))
                raise PdfCompileError("LaTeX compile failed.", details)

            pdf = pdf_path.read_bytes()
    except FileNotFoundError as exc:
        raise PdfCompileError("LaTeX compile failed.", str(exc)) from exc
    except subprocess.TimeoutExpired as exc:
        raise PdfCompileError("LaTeX compile timed out.", str(exc)) from exc
    except PdfCompileError:
        raise
    except Exception as exc:
        raise PdfCompileError("LaTeX compile failed.", str(exc)) from exc

    if not pdf:
        raise PdfCompileError("LaTeX compile failed.", trim_log(log))

    return CompiledPdf(content=pdf, log=log)


def decode_output(output: Optional[Union[bytes, str]]) -> str:
    if output is None:
        return ""

    if isinstance(output, bytes):
        return output.decode("utf-8", errors="replace")

    return output


def read_text(path: Path) -> str:
    if not path.exists():
        return ""

    return path.read_text(encoding="utf-8", errors="replace")


def trim_log(log: Optional[str], max_length: int = 3000) -> str:
    if not log:
        return "No pdflatex log output was returned."

    if len(log) <= max_length:
        return log

    return log[-max_length:]

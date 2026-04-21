#!/usr/bin/env bash

# Exit immediately if a command exits with a non-zero status
set -e

# Setup colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Fast API Backend Bootstrapper ===${NC}\n"

# 1. Ensure we are in the backend directory
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

# 2. Check for Python 3
if command -v python3 &>/dev/null; then
    PYTHON_CMD="python3"
elif command -v python &>/dev/null; then
    PYTHON_CMD="python"
else
    echo -e "${RED}Error: Python 3 is not installed.${NC}"
    exit 1
fi

PY_VERSION=$($PYTHON_CMD -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")')
FULL_PY_VERSION=$($PYTHON_CMD --version)

echo -e "Detected: ${GREEN}$FULL_PY_VERSION${NC}"

if [ "$(echo "$PY_VERSION < 3.10" | bc -l)" -eq 1 ]; then
    echo -e "${RED}Warning: You are using Python $PY_VERSION which is nearing End-of-Life.${NC}"
    echo -e "${RED}Please upgrade to Python 3.10 or 3.12 for maximum stability and security.${NC}\n"
fi

# 3. Virtual Environment Setup
VENV_DIR="venv"

if [ ! -d "$VENV_DIR" ]; then
    echo -e "${BLUE}Creating virtual environment in ./$VENV_DIR...${NC}"
    $PYTHON_CMD -m venv $VENV_DIR
    echo -e "${GREEN}Virtual environment created successfully!${NC}"
else
    echo -e "${GREEN}Virtual environment already exists. Using existing venv.${NC}"
fi

# 4. Activate Virtual Environment
echo -e "${BLUE}Activating virtual environment...${NC}"
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
    # Windows
    source $VENV_DIR/Scripts/activate
else
    # Mac/Linux
    source $VENV_DIR/bin/activate
fi

# 5. Install Dependencies
echo -e "${BLUE}Installing/Updating dependencies from requirements.txt...${NC}"
pip install --upgrade pip
pip install -r requirements.txt

# 6. Check for .env file
if [ ! -f ".env" ]; then
    echo -e "\n${RED}Warning: .env file not found!${NC}"
    echo -e "You need to add GEMINI_API_KEY inside backend/.env"
    if [ -f ".env.example" ]; then
        echo -e "Creating .env from .env.example..."
        cp .env.example .env
    fi
fi

# 7. Start the Server
echo -e "\n${GREEN}Booting up the Uvicorn Server on http://127.0.0.1:8000${NC}"
echo -e "${BLUE}Press Ctrl+C to stop.${NC}\n"
uvicorn main:app --reload --port 8000

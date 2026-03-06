PYTHON := python3
VENV := .venv
BIN := $(VENV)/bin
PIP := $(BIN)/pip
UVICORN := $(BIN)/uvicorn

.PHONY: help venv install dev run clean

help:
	@echo "Available commands:"
	@echo "  make venv      - create virtual environment"
	@echo "  make install   - install dependencies"
	@echo "  make dev       - run dev server with reload"
	@echo "  make run       - run server without reload"
	@echo "  make clean     - remove virtual environment and caches"

venv:
	$(PYTHON) -m venv $(VENV)

install: venv
	$(PIP) install --upgrade pip
	$(PIP) install -r requirements.txt

dev:
	$(UVICORN) app.main:app --reload --host 0.0.0.0 --port 8000

run:
	$(UVICORN) app.main:app --host 0.0.0.0 --port 8000

clean:
	rm -rf $(VENV) __pycache__ .pytest_cache
	find . -type d -name "__pycache__" -prune -exec rm -rf {} +

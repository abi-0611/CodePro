FROM python:3.12-slim

WORKDIR /app

RUN pip install --no-cache-dir --upgrade pip

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

# Workers = 2×CPU + 1 is the guideline; 4 is a safe default for 1-2 vCPU hosts.
# Override at deploy time: docker run -e WEB_CONCURRENCY=8 ...
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4", "--loop", "uvloop", "--http", "httptools"]

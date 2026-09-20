FROM python:3.11-slim
RUN apt-get update && apt-get install -y --no-install-recommends portaudio19-dev alsa-utils && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY pyproject.toml README.md ./
COPY src/ src/
COPY configs/ configs/
COPY scripts/ scripts/
RUN pip install --no-cache-dir -e .
CMD ["python", "scripts/ingest_raw_server.py", "--bind", "0.0.0.0:5000", "--out", "data/real", "--config", "configs/drift.yaml", "--checkpoint", "artifacts/checkpoints/drift2_h128/drift2_h128_best.pt"]

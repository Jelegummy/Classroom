FROM python:3.10-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /apps

# ffmpeg: pydub mp3 export/overlay (without it every session failed to process)
# libopus0: decoding Discord voice packets (otherwise audio is silently dropped)
# git: discord-ext-voice-recv is installed from GitHub
RUN apt-get update \
    && apt-get install -y --no-install-recommends git ffmpeg libopus0 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
CMD ["python", "main.py"]

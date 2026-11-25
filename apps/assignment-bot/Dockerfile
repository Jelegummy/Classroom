FROM python:3.10-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /apps

# ffmpeg: Whisper decoding · libportaudio2: sounddevice · git: VCS installs
RUN apt-get update \
    && apt-get install -y --no-install-recommends git ffmpeg libportaudio2 libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

EXPOSE 4005
CMD ["python", "main.py"]

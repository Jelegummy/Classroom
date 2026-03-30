FROM python:3.10-slim
WORKDIR /apps

COPY requirements.txt .

RUN apt update && apt install -y \
    git \
    libgl1 \
    libglib2.0-0 \
    portaudio19-dev 

RUN pip install --no-cache-dir -r requirements.txt

COPY . .
CMD ["python", "main.py"]
FROM python:3.10-slim
WORKDIR /apps

COPY  requirements.txt .
RUN apt update && apt install -y git
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
CMD ["python", "main.py"]

FROM python:3.9-slim

WORKDIR /app

# Install curl for healthchecks and wait-for-it tool
RUN apt-get update && apt-get install -y curl netcat-openbsd && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

# Use a script to wait for MySQL before starting the app
COPY wait-for-mysql.sh /wait-for-mysql.sh
RUN chmod +x /wait-for-mysql.sh

CMD ["/wait-for-mysql.sh", "mysql", "3306", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]

#FROM python:3.9-slim

#WORKDIR /app

# Install curl for healthchecks and wait-for-it tool
#RUN apt-get update && apt-get install -y curl netcat-openbsd && rm -rf /var/lib/apt/lists/*

#COPY requirements.txt .

#RUN pip install --no-cache-dir -r requirements.txt

#COPY . .

#EXPOSE 8000

# Use a script to wait for MySQL before starting the app
#COPY wait-for-mysql.sh /wait-for-mysql.sh
#RUN chmod +x /wait-for-mysql.sh

#CMD ["/wait-for-mysql.sh", "mysql", "3306", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]

FROM python:3.9-slim

WORKDIR /app

# Install tools needed for wait-for-mysql.sh and healthchecks
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    curl netcat-openbsd && \
    rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source and wait-for script
COPY . .

COPY wait-for-mysql.sh /wait-for-mysql.sh
RUN chmod +x /wait-for-mysql.sh

# Ensure the wait script has correct line endings and is executable
RUN sed -i 's/\r$//' /wait-for-mysql.sh && chmod +x /wait-for-mysql.sh

# Expose the application port
EXPOSE 8000

# Start the app after MySQL is reachable
CMD ["/wait-for-mysql.sh", "mysql", "3306", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]

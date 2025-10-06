FROM python:3.11-slim

WORKDIR /data

# Copy requirements and install dependencies
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy all database files
COPY . /data

ENV PYTHONUNBUFFERED=1

# Using --drop flag ensures no interactive prompt
# The script will drop existing collection and reload data
CMD ["python3", "convert_csv_to_mongo.py", "--drop"]


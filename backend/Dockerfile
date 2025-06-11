# Use an official Python runtime as a parent image
FROM python:3.9-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Set the working directory in the container
WORKDIR /app

# Install system dependencies including ffmpeg
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copy the requirements file into the container at /app
COPY requirements.txt /app/

# Install any needed packages specified in requirements.txt
RUN pip install --upgrade pip &&     pip install --no-cache-dir -r requirements.txt

# Copy the rest of the backend application code into the container at /app
# This assumes the Dockerfile is in the 'backend' directory and context is 'backend'
COPY . /app/

# Expose port 8000 (or the one Uvicorn will use, Render will map $PORT to this)
# This is more for documentation; Render uses the $PORT env var.
EXPOSE 8000

# Define the command to run your app using uvicorn
# Render will set the $PORT environment variable, which uvicorn should pick up if configured.
# Using 0.0.0.0 to be accessible from outside the container.
# The start command in Render's dashboard will override this if specified,
# but it's good practice to have a default CMD.
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]

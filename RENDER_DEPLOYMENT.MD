**Important Note:** This document (`RENDER_DEPLOYMENT.MD`) provides specific instructions for deploying the AI Interview Preparation App to **Render.com**. It should be considered the primary guide for Render deployments. The `DEPLOYMENT.MD` file in the repository might contain outdated information or instructions for other platforms (like Vercel/Railway) and may not be accurate for Render.com.
---
# Render.com Deployment Guide

This document provides instructions for deploying the AI Interview Preparation App to Render.com.

## Frontend Service (React App - from `frontend/` directory)

When setting up your Frontend Service on Render:

1.  **Repository Source:** Point Render to your Git repository.
2.  **Root Directory:** Set this to `frontend`. This tells Render to operate within the `frontend` subdirectory for this service.
3.  **Branch:** Choose the branch you want to deploy (e.g., `main` or `master`).
4.  **Build Command:**
    *   Render typically requires you to specify how to build your static site. Use the following:
        ```bash
        npm install
        npm run build
        ```
5.  **Publish Directory:**
    *   Set this to `build`. This is the directory created by the `npm run build` command that contains the static assets to be served.
6.  **Environment Variables:**
    *   Click on "Environment" for your frontend service in Render.
    *   Add the following environment variable:
        *   **Key:** `REACT_APP_API_URL`
        *   **Value:** `https://your-backend-service-name.onrender.com` (Replace `your-backend-service-name.onrender.com` with the actual public URL of your **backend service** on Render).
    *   You can also set `REACT_APP_DEFAULT_LANGUAGE` if needed (e.g., `en`).

7.  **Start Command:** For static sites, Render usually handles serving the content from the Publish Directory automatically. You might not need to specify a start command. If issues arise, consult Render's documentation for serving static React builds.

---

*(Backend service instructions will be added in a subsequent step.)*
---

## Backend Service (FastAPI App - from `backend/` directory)

When setting up your Backend Service on Render:

1.  **Repository Source:** Point Render to your Git repository.
2.  **Root Directory:** Set this to `backend`. This tells Render to operate within the `backend` subdirectory for this service.
3.  **Branch:** Choose the branch you want to deploy (e.g., `main` or `master`).
4.  **Runtime:** Select 'Python 3'. Render should allow you to specify a version; aim for Python 3.9 or newer, consistent with your local development.
5.  **Build Command:**
    *   Render typically uses this to install dependencies.
        ```bash
        pip install --upgrade pip
        pip install -r requirements.txt
        ```
6.  **Start Command:**
    *   This command runs your FastAPI application using Uvicorn.
        ```bash
        uvicorn app.main:app --host 0.0.0.0 --port $PORT --workers 1
        ```
        *(Render injects the `PORT` environment variable. You can adjust `--workers` based on your instance type, but start with 1.)*

7.  **Environment Variables:**
    *   Set these in the "Environment" section for your backend service on Render. These are **critical** for the backend to function.
    *   **From `.env.example` and `config.py` (adapt as necessary):**
        *   `SECRET_KEY`: **(Required)** A strong, unique secret key. Generate one if you haven't.
        *   `MONGODB_URL`: **(Required)** Your MongoDB connection string (e.g., from MongoDB Atlas). Example: `mongodb+srv://<username>:<password>@<cluster-url>/<database_name>?retryWrites=true&w=majority`
        *   `MONGODB_DB_NAME`: **(Required)** The name of your database (e.g., `ai_interview_db`).
        *   `OPENAI_API_KEY`: (Optional) Your OpenAI API key, if using OpenAI.
        *   `COHERE_API_KEY`: (Optional) Your Cohere API key, if using Cohere.
        *   `HUGGINGFACE_API_TOKEN`: (Optional) Your Hugging Face API token.
        *   `ASSEMBLY_AI_API_KEY`: (Optional) Your AssemblyAI API key.
        *   `SPEECH_TO_TEXT_PROVIDER`: (Optional, defaults to huggingface) e.g., `assembly_ai` or `huggingface`.
        *   `SPEECH_TO_TEXT_ENDPOINT`: (Optional) If using a custom Hugging Face model for speech-to-text.
        *   `AWS_ACCESS_KEY_ID`: (Optional) If using AWS S3 for storing recordings.
        *   `AWS_SECRET_ACCESS_KEY`: (Optional) If using AWS S3.
        *   `AWS_REGION`: (Optional, defaults to us-east-1) If using AWS S3.
        *   `S3_BUCKET`: (Optional) If using AWS S3.
        *   `REDIS_HOST`: (Optional) If using Redis for rate limiting/caching.
        *   `REDIS_PORT`: (Optional) If using Redis.
        *   `REDIS_PASSWORD`: (Optional) If using Redis.
        *   `REDIS_SSL`: (Optional, defaults to False) Set to `True` if your Redis requires SSL.
        *   *(Add any other custom environment variables your application relies on.)*

8.  **System Dependencies (`ffmpeg`):**
    *   The backend requires `ffmpeg` for audio processing.
    *   **Option 1 (Native Environment):** Check Render's documentation for "System Packages" or "Native Dependencies." You might be able to specify `ffmpeg` for installation in the build environment.
    *   **Option 2 (Docker):** If native installation of `ffmpeg` is not straightforward or supported for your chosen instance type, the most reliable solution is to deploy your backend as a Docker container. This is covered in the next section. Using Docker gives you full control over the environment.

9.  **Dependency Update for Authentication:**
    *   The `backend/requirements.txt` file has been updated to include specific versions of `bcrypt` and `passlib` (`bcrypt==4.0.1` pinned alongside `passlib[bcrypt]==1.7.4`). This is to prevent a common `AttributeError` related to `bcrypt.__about__` that can occur in some environments. Ensure your deployment pulls the latest `requirements.txt`.

10. **Database (MongoDB Atlas):**
    *   Ensure your MongoDB Atlas cluster is accessible from Render's IP addresses.
    *   In MongoDB Atlas, go to "Network Access" and add `0.0.0.0/0` to allow connections from anywhere (for testing, then refine if possible to Render's specific egress IPs if they provide them).
    *   Alternatively, Render might offer options to integrate with private networks or provide static outbound IP addresses you can whitelist.

11. **CORS Configuration:**
    *   The backend (`backend/app/core/config.py`) is configured to allow requests from `https://*.onrender.com`, which should cover your frontend if it's also hosted on a Render subdomain.
    *   For production, it's best practice to list specific frontend URLs instead of using broad wildcards if possible. The `BACKEND_CORS_ORIGINS` setting in `config.py` has been updated to remove the global `"*"` wildcard for better security. You can further refine this list once your frontend URL on Render is stable.
    *   If you set `BACKEND_CORS_ORIGINS` as an environment variable on Render, ensure it's a comma-separated string of URLs (e.g., `https://frontend.onrender.com,http://localhost:3000`).

---
*(Instructions for Dockerizing the backend will be added if you choose that path.)*
---

## Option: Deploying Backend with Docker on Render

If you encounter issues installing `ffmpeg` natively or prefer a containerized environment for consistency, you can deploy your backend using Docker. Render has excellent Docker support.

A `backend/Dockerfile` has been provided.

**To use Docker for your Backend Service on Render:**

1.  **Runtime Selection:** When creating or configuring your backend service on Render, choose **"Docker"** as the runtime environment.
2.  **Dockerfile Path:**
    *   Render will look for a `Dockerfile` in your repository.
    *   If your service's "Root Directory" is set to `backend`, Render should automatically find `backend/Dockerfile`. Ensure this path is correct in Render's settings (e.g., `backend/Dockerfile` or `./Dockerfile` if root is `backend/`).
3.  **Build and Start Commands:**
    *   Render usually infers build from the Dockerfile. You typically won't need to specify a separate build command in Render's UI.
    *   The `CMD` instruction in the `Dockerfile` (`uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 1`) will be used as the start command.
    *   **Important for Port:** Render dynamically assigns a port via the `$PORT` environment variable. The provided `Dockerfile` sets a default port of `8000`. For Render to correctly route traffic, your Uvicorn command *inside the Docker container* must listen on the port specified by `$PORT`.
        *   The simplest way is often to adjust the `CMD` in your `Dockerfile` if Render doesn't substitute `$PORT` into the Docker `CMD` itself. However, many applications (including FastAPI/Uvicorn) can be configured to read the port from an environment variable.
        *   **Modify `backend/app/main.py` (Recommended for Docker):**
            It's good practice for your application to respect the `PORT` environment variable.
            If `app.main:app` refers to where Uvicorn is run programmatically (e.g. `uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", 8000)))`), ensure it uses `$PORT`.
            If you are only using the CLI command, Render's environment should handle this. The command `uvicorn app.main:app --host 0.0.0.0 --port $PORT` (if Render allows env var substitution in its start command override for Docker) or using the default `8000` and letting Render map to it is common.
            The current Dockerfile `CMD` uses port `8000`. Render will map its `$PORT` to this container port `8000`. This setup is usually fine.
4.  **Environment Variables:** Set these up in Render's "Environment" tab for the service, just as you would for a native Python deployment. The Docker container will have access to these environment variables.

By using Docker, `ffmpeg` and other system dependencies are bundled directly with your application, leading to more predictable deployments.
---

## Summary of Deployment on Render.com

To deploy this application on Render.com, you will typically create two services:

1.  **Frontend Service:**
    *   **Type:** Static Site
    *   **Source:** Your Git repository
    *   **Root Directory:** `frontend`
    *   **Build Command:** `npm install && npm run build`
    *   **Publish Directory:** `build` (or `frontend/build` depending on how Render handles the root directory)
    *   **Environment Variable:** `REACT_APP_API_URL` pointing to your live backend service URL on Render.

2.  **Backend Service:**
    *   **Type:** Web Service
    *   **Source:** Your Git repository
    *   **Root Directory:** `backend`
    *   **Runtime:**
        *   **Option A (Native Python):** Choose Python 3 (e.g., 3.9+).
            *   **Build Command:** `pip install --upgrade pip && pip install -r requirements.txt`
            *   **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT --workers 1`
            *   **System Dependencies:** You may need to configure Render to install `ffmpeg`. If this is complex, use Docker.
        *   **Option B (Docker):** Choose Docker.
            *   **Dockerfile Path:** `backend/Dockerfile` (or `./Dockerfile` if root is `backend`).
            *   Render will use the `CMD` from the Dockerfile to start the service.
    *   **Environment Variables:** Set all required variables as detailed in the "Backend Service (FastAPI App)" section (e.g., `SECRET_KEY`, `MONGODB_URL`, AI service keys, etc.).

**Key Steps for You on Render.com:**

1.  Create the Frontend service on Render using the settings above.
2.  Create the Backend service on Render (either as a Python app or using Docker).
3.  Ensure all **Environment Variables** for both services are correctly configured in the Render dashboard. This is the most common source of deployment errors.
4.  For the backend, ensure your **MongoDB Atlas** (or other database) is configured to allow connections from Render.
5.  Once the backend is deployed and you have its public URL (e.g., `https://your-backend-app-name.onrender.com`), update the `REACT_APP_API_URL` environment variable in your **Frontend service** on Render to point to this backend URL.
6.  Test thoroughly. Check browser console logs for frontend errors and Render logs for backend errors.

Good luck with your deployment!

# Cloud Run Deployment Guide for Farm2Art

## Option 1: Deploy sử dụng Cloud Console (Recommended)

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select project: **farm2art-e1ed0**
3. Enable Cloud Run API:
   - Search "Cloud Run" → Click "Enable API"

4. Create Cloud Run Service:
   - Click "Create Service"
   - Name: `farm2art`
   - Region: `asia-southeast1`
   - Container image URL: `gcr.io/farm2art-e1ed0/farm2art:latest`
   - CPU: 1 vCPU
   - Memory: 512 MB
   - Timeout: 3600 seconds
   - Allow unauthenticated invocations: ✓
   - Click "Create"

5. Wait for deployment, copy the Cloud Run URL

6. Update `.gcloudignore` and commit:
   ```bash
   git add -A && git commit -m "Prepare for Cloud Run deployment"
   ```

## Option 2: Deploy sử dụng Cloud Console + Source Repositories

1. Go to Cloud Console → Cloud Source Repositories
2. Create new repository: `farm2art`
3. Clone this repo to Cloud Source Repositories:
   ```bash
   git remote add google https://source.developers.google.com/p/farm2art-e1ed0/r/farm2art
   git push google main
   ```

4. Go to Cloud Console → Cloud Run
5. Create Service from Source:
   - Repository: `farm2art`
   - Branch: `main`
   - Dockerfile location: `Dockerfile`
   - Click "Deploy"

## Option 3: Deploy using gcloud CLI (if installed)

```bash
gcloud config set project farm2art-e1ed0
gcloud run deploy farm2art \
  --source . \
  --region asia-southeast1 \
  --allow-unauthenticated \
  --platform managed \
  --memory 512Mi \
  --timeout 3600
```

## After Deployment

1. Get Cloud Run URL from Cloud Console
2. Update `firebase.json` with correct service URL
3. Deploy Firebase Hosting:
   ```bash
   firebase deploy --only hosting
   ```

## Environment Variables (if needed)

In Cloud Run Console:
- Go to your service
- Click "Edit & Deploy New Revision"
- Under "Runtime settings" → "Runtime environment variables"
- Add:
  - `NEXT_PUBLIC_FIREBASE_API_KEY`
  - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
  - etc.

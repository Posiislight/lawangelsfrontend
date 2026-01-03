# Cloudflare Stream Setup Guide

This guide walks you through setting up Cloudflare Stream for Law Angels video tutorials.

## Prerequisites

- Cloudflare account
- Videos ready for upload (MP4, MOV, or other supported formats)

## Step 1: Enable Cloudflare Stream

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to **Stream** in the left sidebar
3. Click **Get Started** if Stream isn't enabled
4. Review pricing (~$5/1000 min stored + $1/1000 min delivered)
5. Enable Stream for your account

## Step 2: Get API Credentials

1. Go to **My Profile** → **API Tokens**
2. Create a new token with **Stream:Edit** permissions
3. Copy the token and your Account ID

Add to your backend `.env`:
```
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_API_TOKEN=your_api_token
```

## Step 3: Upload Videos

### Option A: Dashboard Upload (Easiest)
1. Go to **Stream** → **Videos**
2. Click **Upload** and select your video files
3. Once uploaded, copy the **Video ID** for each video

### Option B: Direct Creator Upload Links
For bulk uploads, use tus-resumable uploads via the API.

## Step 4: Add Videos to Database

1. Go to Django Admin: `http://localhost:8000/admin`
2. Navigate to **Video Courses** → **Add**
3. Create your course (e.g., "Contract Law")
4. Add videos inline with their Cloudflare Video IDs

### Video Fields:
- **Title**: Video title shown to users
- **Description**: Detailed description
- **Cloudflare Video ID**: The UID from Step 3
- **Duration (seconds)**: Video length in seconds
- **Order**: Display order within course
- **Key Topics**: JSON array like `["Topic 1", "Topic 2"]`

## Step 5: Verify Integration

1. Run your servers:
```bash
# Backend
cd backend
.\venv\Scripts\python.exe manage.py runserver

# Frontend  
cd lawangels
npm run dev
```

2. Navigate to `/video-tutorials`
3. Click a course to watch videos
4. Verify playback and progress tracking work

## Cloudflare Stream Pricing

| Resource | Cost |
|----------|------|
| Storage | $5 per 1,000 minutes stored/month |
| Delivery | $1 per 1,000 minutes viewed |

For 5.6GB of videos (~10-15 hours), expect ~$5-8/month storage.

## Troubleshooting

### Video not playing
- Verify the Cloudflare Video ID is correct
- Check browser console for errors
- Ensure video is fully processed in Cloudflare

### Progress not saving
- Verify user is authenticated
- Check backend console for API errors

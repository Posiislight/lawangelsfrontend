# PRODUCTION DEPLOYMENT GUIDE
# Django + React + Supabase → Render + Vercel

**Deployment Timeline:** Approximately 30-45 minutes
**Prerequisites:** GitHub account, Render account, Vercel account, Supabase account

---

## ⚠️ CRITICAL FIRST STEPS

### 1. Generate a New SECRET_KEY (DO THIS FIRST!)

Your development SECRET_KEY is insecure. Generate a new one:

**Windows PowerShell:**
```powershell
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

Copy the output. You'll need this when setting up Render.

Example output:
```
a_ks8j@#$%^&*()_+-=[]{}|;:',.<>?/~`
```

### 2. Verify All Configuration Files Are In Place

Check that these files exist in your project:

**Backend:**
- ✅ `backend/lawangels/settings_production.py` (NEW - we created this)
- ✅ `backend/requirements.txt` (UPDATED - now has production deps)
- ✅ `backend/gunicorn_config.py` (NEW)
- ✅ `backend/Procfile` (NEW)
- ✅ `backend/render.yaml` (NEW)
- ✅ `backend/.env.example` (NEW)

**Frontend:**
- ✅ `lawangels/vercel.json` (UPDATED)
- ✅ `lawangels/.env.production` (NEW)
- ✅ `lawangels/.env.example` (UPDATED)
- ✅ `lawangels/src/services/quizApi.ts` (UPDATED)

**At root:**
- ✅ `ENVIRONMENT_VARIABLES.md` (THIS FILE - reference for env vars)

---

## PART A: PREPARE YOUR GITHUB REPOSITORY

### Step 1: Push All Changes to GitHub

```powershell
# Navigate to your project root
cd C:\Users\adele\Desktop\lawangelsfrontend2

# Check git status
git status

# Add all new files
git add .

# Commit with message
git commit -m "Production deployment configuration - Render + Vercel + Supabase"

# Push to GitHub
git push origin main
```

Expected output:
```
remote: Create a pull request for 'main' on GitHub by visiting:
...
main -> main
```

### Step 2: Verify Changes on GitHub

1. Go to https://github.com/Posiislight/lawangelsfrontend
2. You should see your commit with new files:
   - `settings_production.py`
   - `gunicorn_config.py`
   - `Procfile`
   - `render.yaml`
   - Updated `quizApi.ts`
   - Updated `vercel.json`

---

## PART B: SETUP BACKEND ON RENDER

### Step 1: Create a New Service on Render

1. Go to https://dashboard.render.com
2. Click **"New +"** → **"Web Service"**
3. Choose **"Build and deploy from a Git repository"**
4. Click **"Connect"** next to your `lawangelsfrontend` repository
5. Select the repository and click **"Connect"**

### Step 2: Configure the Web Service

**Name:** `quiz-backend` (must match your URL)

**Environment:** `Python 3`

**Build Command:** `pip install -r requirements.txt`

**Start Command:** `cd lawangels && gunicorn lawangels.wsgi:application --config ../gunicorn_config.py`

**Region:** Choose closest to you (e.g., if in EU: Frankfurt)

**Plan:** Free (starter)

### Step 3: Set Environment Variables (CRITICAL!)

Before clicking "Create Web Service", click **"Advanced"** and set the following:

| Key | Value | Is Secret |
|-----|-------|-----------|
| `DATABASE_URL` | `postgresql://postgres.kfviwdoyiknsnnnadkpe:YOUR_PASSWORD@aws-1-eu-west-2.pooler.supabase.com:5432/postgres` | ✅ YES |
| `SECRET_KEY` | `<Paste the generated key from step A>` | ✅ YES |
| `DEBUG` | `False` | ❌ NO |
| `ALLOWED_HOSTS` | `quiz-backend.onrender.com,localhost` | ❌ NO |
| `FRONTEND_URL_PRODUCTION` | `https://lawangelsfrontend-wy6w.vercel.app` | ❌ NO |
| `FRONTEND_URL_STAGING` | `https://lawangelsfrontend-staging.vercel.app` | ❌ NO |
| `FRONTEND_URL_DEVELOPMENT` | `http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:3000` | ❌ NO |
| `TIME_ZONE` | `UTC` | ❌ NO |
| `GUNICORN_WORKERS` | `2` | ❌ NO |
| `LOG_LEVEL` | `info` | ❌ NO |

**Detailed replacement for YOUR_PASSWORD:**
- Open your local `backend/.env` file
- Copy the value after `DB_PASSWORD=` (this is your Supabase password)
- Paste it into the DATABASE_URL value above, replacing `YOUR_PASSWORD`

### Step 4: Create the Service

Click **"Create Web Service"** and wait for deployment (~3-5 minutes)

### Step 5: Verify Backend is Running

1. When deployment completes, you'll see "Your service is live"
2. Click the URL (should be `https://quiz-backend.onrender.com`)
3. You should see Django REST Framework interface OR a 404 page
4. To test API: Visit `https://quiz-backend.onrender.com/api/exams/`
   - Should return empty list `[]` or JSON data

**If you see errors:**
- Click "Logs" tab in Render dashboard
- Look for database connection errors
- Check DATABASE_URL is correct (no typos)

### Step 6: Run Migrations (If First Deployment)

Render automatically runs migrations via the Procfile `release` command. Check logs to confirm:

In Render dashboard → Logs, you should see:
```
release: cd lawangels && python manage.py migrate --noinput
```

---

## PART C: SETUP FRONTEND ON VERCEL

### Step 1: Create a New Project on Vercel

1. Go to https://vercel.com/dashboard
2. Click **"Add New"** → **"Project"**
3. Find your `lawangelsfrontend` repository
4. Click **"Import"**

### Step 2: Configure Project Settings

**Framework Preset:** React (should auto-detect)

**Build Command:** `npm run build` (should auto-detect)

**Output Directory:** `dist` (should auto-detect)

**Install Command:** `npm ci` (should auto-detect)

Leave root directory as `.` (project root)

### Step 3: Set Environment Variables

Click **"Environment Variables"** and add:

| Name | Value | Environment |
|------|-------|-------------|
| `VITE_API_URL` | `https://quiz-backend.onrender.com/api` | Production |

**Note:** These are non-secrets (exposed to browser anyway), so just mark as Production.

### Step 4: Deploy

Click **"Deploy"** and wait for deployment (~2-3 minutes)

### Step 5: Verify Frontend is Running

1. When deployment completes, you'll see "Congratulations!"
2. Click the URL (should be `https://lawangelsfrontend-wy6w.vercel.app`)
3. You should see the Law Angels website
4. Check browser console (F12) for any errors

**If you see errors:**
- Click "Deployments" tab
- Click the latest deployment
- Check "Build Logs" and "Runtime Logs"
- Common issues:
  - API URL wrong → fix VITE_API_URL in Vercel environment
  - CORS errors → check backend CORS settings

---

## PART D: VERIFY DEPLOYMENT

### Step 1: Test Backend API

```bash
# Test from your local machine
curl https://quiz-backend.onrender.com/api/exams/

# Should return:
# []
# (or JSON data if you have exams)
```

### Step 2: Test Frontend API Connection

1. Open frontend: https://lawangelsfrontend-wy6w.vercel.app
2. Open browser Developer Tools (F12)
3. Go to Console tab
4. Look for message like:
   ```
   [QuizAPI] Production environment detected, using: https://quiz-backend.onrender.com/api
   ```
5. Try navigating to a page that uses the API
6. Check Network tab for successful API requests (status 200)

### Step 3: Test Full Flow

1. Login to frontend (if authentication required)
2. Start a quiz
3. Submit an answer
4. Check that it works without errors
5. Check browser console for errors

### Step 4: Check Logs

**Render Backend Logs:**
1. Dashboard → Logs
2. Should show requests coming in from Vercel
3. No errors about CORS, database, or authentication

**Vercel Frontend Logs:**
1. Dashboard → Deployments → Latest → Runtime Logs
2. Should be clean (no major errors)

---

## PART E: CONFIGURE STAGING (Optional)

If you want a staging environment (recommended):

### Step 1: Create Staging Service on Render

Repeat PART B, but:
- Use branch: `staging`
- Name: `quiz-backend-staging`
- URL will be: `https://quiz-backend-staging.onrender.com`

### Step 2: Create Staging Project on Vercel

Repeat PART C, but:
- Deploy from `staging` branch
- This time, set VITE_API_URL to staging URL

---

## PART F: CUSTOM DOMAIN (Optional)

If you have a custom domain (e.g., `quiz.yourdomain.com`):

### For Backend (Render):
1. Dashboard → Settings → Custom Domains
2. Add your domain
3. Add DNS records as shown by Render

### For Frontend (Vercel):
1. Dashboard → Settings → Domains
2. Add your domain
3. Update DNS records

### Update Environment Variables:
- Render: Update FRONTEND_URL_PRODUCTION to custom domain
- Vercel: Redeploy with new domain

---

## PART G: ONGOING MAINTENANCE

### After Deployment

#### Daily Checks:
- Monitor API uptime: `curl https://quiz-backend.onrender.com/api/exams/`
- Check Render dashboard for errors
- Check Vercel dashboard for failed deploys

#### Weekly Checks:
- Review logs for errors
- Test full quiz flow
- Check database performance

#### Before Each Update:
1. Test locally with production settings
2. Run migrations in dev: `python manage.py migrate`
3. Commit and push to GitHub
4. Monitor deployment via dashboard

---

## PART H: ROLLBACK PROCEDURE

If something breaks after deployment:

### Rollback Frontend (Vercel):
1. Dashboard → Deployments
2. Find previous working deployment
3. Click "..." menu → "Promote to Production"
4. Frontend reverts to previous version

### Rollback Backend (Render):
1. Dashboard → Logs
2. Find previous deployment
3. Restart service or redeploy from previous commit

---

## PART I: MONITORING & ALERTS

### Render Alerts:
1. Dashboard → Alerts
2. Set up notifications for:
   - Service errors
   - CPU/Memory alerts
   - SSL certificate expiry

### Vercel Monitoring:
1. Dashboard → Settings → Monitoring
2. Set up notifications

---

## TROUBLESHOOTING

### "Deployment Failed" Error

**Check logs:**
```
Render Dashboard → Logs (shows error messages)
```

**Common issues:**
1. **Import error in settings.py**
   - Check all imports are available
   - Run locally first: `python manage.py check`

2. **Database connection error**
   - Verify DATABASE_URL is correct
   - Check password has no special characters that need escaping
   - Test locally: `python manage.py dbshell`

3. **Missing dependencies**
   - Update requirements.txt locally
   - Test with `pip install -r requirements.txt`
   - Push to GitHub and redeploy

### "API Returns 403 CORS Error"

**Check:**
1. Frontend URL is in FRONTEND_URL_PRODUCTION on Render
2. URL matches exactly (including https://)
3. Restart Render service after changing env vars

### "Frontend Can't Reach API"

**Check:**
1. VITE_API_URL is set on Vercel
2. Backend service is running (check Render logs)
3. API endpoint exists: `curl https://quiz-backend.onrender.com/api/exams/`

### "Static Files Not Loading"

**Check:**
1. Run migrations: `python manage.py collectstatic --noinput`
2. Check STATIC_URL is `/static/`
3. Use WhiteNoise middleware (already in settings_production.py)

---

## FINAL CHECKLIST

Before declaring deployment complete:

### Backend (Render):
- [ ] Service is "Live"
- [ ] No errors in Logs
- [ ] API responds to requests
- [ ] Database migrations ran successfully
- [ ] Environment variables are set
- [ ] SECRET_KEY is unique (not development key)

### Frontend (Vercel):
- [ ] Deployment succeeded
- [ ] Website loads without errors
- [ ] No console errors visible
- [ ] API requests go to correct backend
- [ ] VITE_API_URL is set

### Database (Supabase):
- [ ] Connection works from Django
- [ ] Migrations completed
- [ ] Tables exist and have data

### Connectivity:
- [ ] Frontend can reach backend
- [ ] CORS is working (no errors)
- [ ] Cookies/sessions work across domains
- [ ] CSRF tokens work properly

---

## SUPPORT & DOCUMENTATION

- **Render Docs:** https://render.com/docs
- **Vercel Docs:** https://vercel.com/docs
- **Supabase Docs:** https://supabase.com/docs
- **Django Deployment:** https://docs.djangoproject.com/en/5.2/howto/deployment/

---

## NEXT STEPS AFTER DEPLOYMENT

1. **Set up monitoring:** Configure alerts for errors and uptime
2. **Enable logging:** Check logs regularly for issues
3. **Implement health checks:** Create endpoint for monitoring
4. **Set up CI/CD:** Automate tests before deploy
5. **Backup database:** Set up Supabase automated backups
6. **Monitor performance:** Track API response times
7. **Update documentation:** Document your deployment setup

---

**Generated:** 2025-11-23
**Deployment Target:** Render (Backend) + Vercel (Frontend) + Supabase (Database)
**Backend URL:** https://quiz-backend.onrender.com
**Frontend URL:** https://lawangelsfrontend-wy6w.vercel.app

# PRODUCTION DEPLOYMENT EXECUTION CHECKLIST

**For:** Render (Backend) + Vercel (Frontend) + Supabase (Database)  
**Date Started:** [DATE]  
**Date Completed:** [DATE]  
**Completed By:** [NAME]

---

## ⚠️ PRE-DEPLOYMENT (DO THIS FIRST)

### Step 1: Generate SECRET_KEY
```powershell
# Run in Windows PowerShell
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```
- [ ] Command executed successfully
- [ ] Copied output (the long random string)
- [ ] Saved in secure location (password manager recommended)
- [ ] **DO NOT** commit this to Git or share publicly

Generated SECRET_KEY: `_________________________________`

### Step 2: Verify All Files Exist
```powershell
# Backend files
Test-Path backend\settings_production.py           # Should be TRUE
Test-Path backend\requirements.txt                  # Should be TRUE
Test-Path backend\gunicorn_config.py               # Should be TRUE
Test-Path backend\Procfile                          # Should be TRUE
Test-Path backend\render.yaml                       # Should be TRUE
Test-Path backend\.env.example                      # Should be TRUE

# Frontend files
Test-Path lawangels\src\services\quizApi.ts        # Should be TRUE
Test-Path lawangels\vercel.json                     # Should be TRUE
Test-Path lawangels\.env.production                 # Should be TRUE
Test-Path lawangels\.env.example                    # Should be TRUE
```

- [ ] All backend files exist
- [ ] All frontend files exist
- [ ] Documentation files exist:
  - [ ] QUICK_DEPLOYMENT_REFERENCE.md
  - [ ] DEPLOYMENT_GUIDE_COMPLETE.md
  - [ ] ENVIRONMENT_VARIABLES.md
  - [ ] CONFIGURATION_SUMMARY.md
  - [ ] README_DEPLOYMENT.md

### Step 3: Git Commit & Push
```powershell
cd C:\Users\adele\Desktop\lawangelsfrontend2

# Check status
git status

# Stage all changes
git add .

# Commit
git commit -m "Production deployment configuration - Render + Vercel + Supabase"

# Push to GitHub
git push origin main
```

- [ ] Git status shows no errors
- [ ] All files staged
- [ ] Commit message is clear
- [ ] Push to GitHub successful
- [ ] Verified on GitHub.com that files are there

### Step 4: Gather Required Information

**Supabase Credentials (from backend/.env):**
- Supabase Host: `aws-1-eu-west-2.pooler.supabase.com`
- Supabase Port: `5432`
- Supabase Database: `postgres`
- Supabase User: `postgres.kfviwdoyiknsnnnadkpe`
- Supabase Password: `________________` (from DB_PASSWORD= in backend/.env)

**URLs:**
- Backend URL: `quiz-backend.onrender.com`
- Frontend URL: `lawangelsfrontend-wy6w.vercel.app`

---

## 🔧 RENDER BACKEND DEPLOYMENT

### Step 1: Create Web Service

- [ ] Go to https://dashboard.render.com
- [ ] Click "New +" button
- [ ] Select "Web Service"
- [ ] Choose "Build and deploy from a Git repository"
- [ ] Click "Connect" next to your `lawangelsfrontend` repository
- [ ] Authorize GitHub access if prompted
- [ ] Select repository: `lawangelsfrontend`
- [ ] Click "Connect"

### Step 2: Configure Service

**Basic Information:**
- [ ] Name: `quiz-backend`
- [ ] Environment: `Python 3`
- [ ] Region: Select closest to you (EU/US/etc)
- [ ] Branch: `main`
- [ ] Build Command: `pip install -r requirements.txt`
- [ ] Start Command: `cd lawangels && gunicorn lawangels.wsgi:application --config ../gunicorn_config.py`
- [ ] Plan: `Free`

### Step 3: Add Environment Variables

**CRITICAL:** Click "Advanced" before creating service

**Database Variables (SECRETS):**
```
DATABASE_URL
  Value: postgresql://postgres.kfviwdoyiknsnnnadkpe:SUPABASE_PASSWORD@aws-1-eu-west-2.pooler.supabase.com:5432/postgres
  Secret: YES ✓
  
SECRET_KEY
  Value: [Paste your generated SECRET_KEY here]
  Secret: YES ✓
```

**Django Variables:**
```
DEBUG
  Value: False
  Secret: NO
  
ALLOWED_HOSTS
  Value: quiz-backend.onrender.com,localhost
  Secret: NO
  
FRONTEND_URL_PRODUCTION
  Value: https://lawangelsfrontend-wy6w.vercel.app
  Secret: NO
  
FRONTEND_URL_STAGING
  Value: https://lawangelsfrontend-staging.vercel.app
  Secret: NO
  
FRONTEND_URL_DEVELOPMENT
  Value: http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:3000
  Secret: NO
  
TIME_ZONE
  Value: UTC
  Secret: NO
  
GUNICORN_WORKERS
  Value: 2
  Secret: NO
  
LOG_LEVEL
  Value: info
  Secret: NO
```

**Checklist:**
- [ ] DATABASE_URL added (with actual password, marked Secret)
- [ ] SECRET_KEY added (marked Secret)
- [ ] DEBUG=False
- [ ] ALLOWED_HOSTS set correctly
- [ ] FRONTEND_URL_PRODUCTION set to Vercel URL
- [ ] All other variables added
- [ ] Verified no typos in values

### Step 4: Deploy

- [ ] Click "Create Web Service"
- [ ] Wait for deployment to start (shows "Deploying...")
- [ ] Check Logs for any errors
- [ ] Deployment should complete in 3-5 minutes
- [ ] Status should show "Your service is live"

**Wait for:** ~5 minutes

- [ ] Click service URL: https://quiz-backend.onrender.com
- [ ] Should see Django REST Framework interface or 404 (both OK)
- [ ] Test API endpoint: https://quiz-backend.onrender.com/api/exams/
- [ ] Should return JSON data (or empty list)

**If Deployment Fails:**
- [ ] Check Logs tab for error messages
- [ ] Common issue: Import error in settings
- [ ] Common issue: Database connection error
- [ ] Fix issue, commit, push, and redeploy

**Verification:**
- [ ] Service is live (status shows "Live")
- [ ] Logs show no errors
- [ ] API endpoint returns data
- [ ] No database connection errors in logs

---

## 🎨 VERCEL FRONTEND DEPLOYMENT

### Step 1: Create Project

- [ ] Go to https://vercel.com/dashboard
- [ ] Click "Add New"
- [ ] Select "Project"
- [ ] Search for repository: `lawangelsfrontend`
- [ ] Click on it when found
- [ ] Click "Import"

### Step 2: Configure Project

**Build Settings (should auto-detect, verify):**
- [ ] Framework: React
- [ ] Build Command: `npm run build`
- [ ] Output Directory: `dist`
- [ ] Install Command: `npm ci`
- [ ] Root Directory: `.` (dot/root)

### Step 3: Add Environment Variables

- [ ] Click "Environment Variables" section
- [ ] Add variable:
  ```
  Name: VITE_API_URL
  Value: https://quiz-backend.onrender.com/api
  Environment: Production (selected)
  ```
- [ ] Click "Add"
- [ ] Environment variable is now set

### Step 4: Deploy

- [ ] Click "Deploy"
- [ ] Wait for deployment (shows "Building...")
- [ ] Check Build Logs for any errors
- [ ] Deployment should complete in 2-3 minutes
- [ ] You should see "Congratulations!"

**Wait for:** ~3 minutes

- [ ] Click "Visit" button or go to project URL
- [ ] Should see your Law Angels website
- [ ] Check that page loads without errors

**If Deployment Fails:**
- [ ] Check "Build Logs" tab for errors
- [ ] Common issue: npm build error
- [ ] Common issue: Module not found
- [ ] Fix issue, commit, push, and redeploy

**Verification:**
- [ ] Deployment successful (green checkmark)
- [ ] Build logs show no critical errors
- [ ] Frontend loads without errors
- [ ] No console errors visible

---

## ✅ POST-DEPLOYMENT VERIFICATION

### Test 1: Backend API Direct Call

```bash
# In PowerShell or any terminal
curl https://quiz-backend.onrender.com/api/exams/
```

- [ ] Request returns HTTP 200
- [ ] Response is valid JSON
- [ ] Returns: `[]` or array of exams

### Test 2: Frontend Loading

- [ ] Open https://lawangelsfrontend-wy6w.vercel.app
- [ ] Page loads completely
- [ ] No visible errors on page
- [ ] Can see website content

### Test 3: Browser Console Check

1. Open frontend URL: https://lawangelsfrontend-wy6w.vercel.app
2. Press F12 to open Developer Tools
3. Click "Console" tab
4. Look for message:
   ```
   [QuizAPI] Production environment detected, using: https://quiz-backend.onrender.com/api
   ```

- [ ] Console message appears
- [ ] API URL is correct: https://quiz-backend.onrender.com/api
- [ ] No red error messages in console

### Test 4: Network Requests

1. Keep Developer Tools open (F12)
2. Click "Network" tab
3. Navigate to any page that uses API
4. Watch for network requests

- [ ] See requests to `quiz-backend.onrender.com`
- [ ] Requests have status 200/201
- [ ] No 403/CORS errors
- [ ] Response data is valid JSON

### Test 5: Full User Flow

1. Try using the application
2. If login required: login
3. Navigate to a quiz
4. View questions
5. If possible: submit an answer

- [ ] All pages load
- [ ] No API errors
- [ ] Data displays correctly
- [ ] Actions work (click buttons, submit forms)

### Test 6: Check Server Logs

**Render Logs:**
1. Go to https://dashboard.render.com
2. Click on `quiz-backend` service
3. Click "Logs" tab
4. Watch for new requests from Vercel

- [ ] Logs show requests coming in
- [ ] No 500 errors
- [ ] No database connection errors
- [ ] Migrations appear to have run

**Vercel Logs:**
1. Go to https://vercel.com/dashboard
2. Click on `lawangelsfrontend` project
3. Click latest Deployment
4. Check "Runtime Logs"

- [ ] Logs show successful deployment
- [ ] No runtime errors
- [ ] API calls are being made

---

## 🔧 TROUBLESHOOTING

### Issue: "CORS Error" in Console

```
Error: Access to XMLHttpRequest at 'https://quiz-backend.onrender.com/api/...' 
from origin 'https://lawangelsfrontend-wy6w.vercel.app' has been blocked by CORS policy
```

**Fix:**
1. Render Dashboard → Settings → Environment
2. Find `FRONTEND_URL_PRODUCTION`
3. Verify value: `https://lawangelsfrontend-wy6w.vercel.app` (exact match)
4. Check for typos
5. Click "Save"
6. Service restarts automatically
7. Wait 2 minutes
8. Test again

- [ ] CORS error resolved

### Issue: "Cannot Connect to API"

```
Frontend shows: "Cannot reach API" or blank page
```

**Fix:**
1. Test backend directly:
   ```bash
   curl https://quiz-backend.onrender.com/api/exams/
   ```
2. If this fails: Render service has problem
   - Check Render Logs for errors
   - Check DATABASE_URL is correct
   - Restart service
3. If this works: Vercel issue
   - Check VITE_API_URL in Vercel environment variables
   - Verify it equals: `https://quiz-backend.onrender.com/api`
   - Redeploy frontend

- [ ] API connectivity restored

### Issue: "Database Connection Error"

```
Error: could not translate host name "aws-1-eu-west-2.pooler.supabase.com" to address
```

**Fix:**
1. Check DATABASE_URL in Render environment
2. Verify format: `postgresql://user:password@host:5432/database`
3. Verify password is correct (from Supabase)
4. Verify no special characters in password (if yes, URL-encode them)
5. Verify host is reachable:
   ```bash
   ping aws-1-eu-west-2.pooler.supabase.com
   ```
6. If ping works but Django doesn't: restart Render service

- [ ] Database connection restored

### Issue: "500 Internal Server Error"

```
API returns: 500 Internal Server Error
```

**Fix:**
1. Check Render Logs for exact error
2. Common issues:
   - Missing migration: `python manage.py migrate`
   - Import error in settings: check syntax
   - Missing environment variable: check all required vars set
3. Fix issue, commit, push, and redeploy

- [ ] 500 error resolved

---

## 📊 FINAL VERIFICATION CHECKLIST

Before declaring successful deployment:

### Backend (Render)
- [ ] Service is "Live" status
- [ ] No errors in Logs
- [ ] API responds: `curl https://quiz-backend.onrender.com/api/exams/`
- [ ] Database migrations completed
- [ ] All environment variables set
- [ ] SECRET_KEY is unique (not development key)
- [ ] DEBUG=False
- [ ] CORS allows Vercel URL

### Frontend (Vercel)
- [ ] Deployment succeeded
- [ ] Website loads without errors
- [ ] No console errors
- [ ] No console warnings (CORS, etc)
- [ ] VITE_API_URL set correctly
- [ ] Can navigate pages

### Integration (End-to-End)
- [ ] Frontend loads from Vercel
- [ ] Frontend detects correct API URL
- [ ] API requests reach Render backend
- [ ] Backend connects to Supabase database
- [ ] Data displays in frontend
- [ ] No CORS errors
- [ ] No network errors

### Security
- [ ] HTTPS on both frontend and backend
- [ ] DEBUG=False in production
- [ ] SECRET_KEY is production key
- [ ] Database password in secrets (not visible)
- [ ] CORS restricted to frontend URL
- [ ] No sensitive data in logs

---

## 📝 NOTES & OBSERVATIONS

```
[Notes during deployment - fill in as you go]

Time started: __:__ AM/PM
Issue #1: _______________________________________________
Resolution: _______________________________________________
Time to resolve: _________ minutes

Issue #2: _______________________________________________
Resolution: _______________________________________________
Time to resolve: _________ minutes

Total deployment time: _________ minutes

Any other observations:
_______________________________________________________
_______________________________________________________
_______________________________________________________
```

---

## ✅ SIGN-OFF

### Deployment Manager
- [ ] All checklist items completed
- [ ] No critical issues remain
- [ ] Deployment verified and tested
- [ ] Team notified of new URLs
- [ ] Documentation shared

**Deployment Status:** ☐ PENDING  ☐ IN PROGRESS  ☐ COMPLETE  ☐ FAILED

**Deployed By:** ________________________  
**Date:** ________________________  
**Time:** ________________________  
**Version:** lawangelsfrontend (main branch - commit ID)

**Next Steps:**
1. Share new URLs with team: https://lawangelsfrontend-wy6w.vercel.app
2. Notify backend is at: https://quiz-backend.onrender.com
3. Set up monitoring (optional)
4. Document in team wiki/confluence
5. Begin daily monitoring schedule

---

**🎉 DEPLOYMENT COMPLETE!**

Your Law Angels application is now live on production!

Generated: November 23, 2025

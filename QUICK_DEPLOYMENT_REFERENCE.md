# QUICK DEPLOYMENT REFERENCE

## Generated Files

### Backend Configuration
- `backend/settings_production.py` - Production-ready Django settings with Supabase + dynamic CORS
- `backend/requirements.txt` - Updated with production dependencies (gunicorn, whitenoise, etc.)
- `backend/gunicorn_config.py` - Gunicorn WSGI server configuration optimized for Render
- `backend/Procfile` - Render process file (runs migrations + starts server)
- `backend/render.yaml` - Render deployment configuration (blueprint)
- `backend/.env.example` - Environment variables template

### Frontend Configuration
- `lawangels/src/services/quizApi.ts` - Updated with dynamic API URL detection
- `lawangels/vercel.json` - Vercel deployment configuration with security headers
- `lawangels/.env.production` - Production environment file
- `lawangels/.env.example` - Frontend environment template

### Documentation
- `ENVIRONMENT_VARIABLES.md` - Complete env var setup guide (WHERE TO PUT WHAT)
- `DEPLOYMENT_GUIDE_COMPLETE.md` - Step-by-step deployment instructions

---

## 5-MINUTE SETUP SUMMARY

### 1. Generate SECRET_KEY (Windows PowerShell)
```powershell
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```
Copy the output - you'll need this for Render.

### 2. Push to GitHub
```powershell
cd C:\Users\adele\Desktop\lawangelsfrontend2
git add .
git commit -m "Production deployment configuration"
git push origin main
```

### 3. Deploy Backend (Render)
- Go to https://dashboard.render.com
- New Web Service → Select your GitHub repo
- Name: `quiz-backend`
- Build Command: `pip install -r requirements.txt`
- Start Command: `cd lawangels && gunicorn lawangels.wsgi:application --config ../gunicorn_config.py`
- Add Environment Variables (see ENVIRONMENT_VARIABLES.md):
  - DATABASE_URL (with your Supabase password)
  - SECRET_KEY (the generated key)
  - DEBUG=False
  - FRONTEND_URL_PRODUCTION, etc.
- Deploy

### 4. Deploy Frontend (Vercel)
- Go to https://vercel.com/dashboard
- Import Project → Select your GitHub repo
- Framework: React (auto-detected)
- Add Environment Variables:
  - VITE_API_URL=https://quiz-backend.onrender.com/api
- Deploy

### 5. Test
- Open https://lawangelsfrontend-wy6w.vercel.app
- Check browser console for "[QuizAPI] Production environment detected"
- Try using the app - API calls should work

---

## KEY DESIGN DECISIONS

### 1. Dynamic API URL Detection ✅
- Frontend uses `VITE_API_URL` environment variable if available
- Falls back to auto-detection based on hostname
- localhost → http://localhost:8000/api
- Production domain → https://quiz-backend.onrender.com/api
- **No hardcoding needed!**

### 2. Supabase Connection ✅
- Using PostgreSQL pooler endpoint (better for Render free tier)
- Connection string in DATABASE_URL environment variable
- SSL enabled for security
- Connection pooling configured

### 3. Security ✅
- NEW SECRET_KEY required (not dev key)
- DEBUG=False in production
- HTTPS enforced with HSTS headers
- CORS locked to frontend URL only
- Database password in secrets (not visible)
- CSRF protection enabled across domains

### 4. Staging Support ✅
- Settings support both production and staging URLs
- Can easily add staging Render service
- Environment variables control which URLs are used

---

## ENVIRONMENT VARIABLES CHECKLIST

### Required on Render (Backend)
```
DATABASE_URL=postgresql://postgres.kfviwdoyiknsnnnadkpe:PASSWORD@aws-1-eu-west-2.pooler.supabase.com:5432/postgres  [SECRET]
SECRET_KEY=<generated-key>  [SECRET]
DEBUG=False
ALLOWED_HOSTS=quiz-backend.onrender.com,localhost
FRONTEND_URL_PRODUCTION=https://lawangelsfrontend-wy6w.vercel.app
FRONTEND_URL_STAGING=https://lawangelsfrontend-staging.vercel.app
TIME_ZONE=UTC
GUNICORN_WORKERS=2
LOG_LEVEL=info
```

### Required on Vercel (Frontend)
```
VITE_API_URL=https://quiz-backend.onrender.com/api
```

### Local Development (.env)
```
DATABASE_URL=postgresql://postgres.kfviwdoyiknsnnnadkpe:PASSWORD@aws-1-eu-west-2.pooler.supabase.com:5432/postgres
DEBUG=True
SECRET_KEY=django-insecure-jjukq=b0!nx!wt%v89aan8**(kloh)ow88=d$8=$3i-6u98mzp
```

---

## URLS AFTER DEPLOYMENT

- **Backend API:** https://quiz-backend.onrender.com
- **Frontend App:** https://lawangelsfrontend-wy6w.vercel.app
- **API Endpoint Example:** https://quiz-backend.onrender.com/api/exams/

---

## TESTING CHECKLIST

After deployment:

- [ ] Backend is live: `curl https://quiz-backend.onrender.com/api/exams/`
- [ ] Frontend loads without errors
- [ ] Browser console shows: `[QuizAPI] Production environment detected, using: https://quiz-backend.onrender.com/api`
- [ ] Network tab shows API requests to quiz-backend.onrender.com
- [ ] Click on a quiz or try to load data
- [ ] Data displays correctly
- [ ] No CORS errors in console

---

## ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────┐
│                         PRODUCTION SETUP                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Frontend (React + TypeScript)                                   │
│  https://lawangelsfrontend-wy6w.vercel.app                       │
│  - Uses VITE_API_URL env var or auto-detects                     │
│  - Connects to https://quiz-backend.onrender.com/api             │
│  - Built and deployed by Vercel                                  │
│                                    │                             │
│                                    │ HTTPS                        │
│                                    ↓                             │
│  Backend (Django REST API)                                       │
│  https://quiz-backend.onrender.com                               │
│  - Gunicorn WSGI server                                          │
│  - Runs on Render                                                │
│  - Uses Supabase PostgreSQL                                      │
│  - CORS configured for Vercel URL                                │
│                                    │                             │
│                                    │ Database                     │
│                                    ↓                             │
│  Database (Supabase PostgreSQL)                                  │
│  aws-1-eu-west-2.pooler.supabase.com:5432                        │
│  - External PostgreSQL database                                  │
│  - Connection via pooler endpoint                                │
│  - SSL/TLS encryption enabled                                    │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## COMMON TASKS

### Update Backend
```bash
# Make changes locally
git add .
git commit -m "Backend update"
git push origin main
# Render automatically redeploys
```

### Update Frontend
```bash
# Make changes locally
git add .
git commit -m "Frontend update"
git push origin main
# Vercel automatically redeploys
```

### View Logs
- **Render:** Dashboard → Logs
- **Vercel:** Dashboard → Deployments → Latest → Logs

### Scale Backend
- Render free tier: 1 web service
- To add more capacity: Upgrade to paid plan

### Add Custom Domain
- Render: Settings → Custom Domains
- Vercel: Settings → Domains
- Update CORS settings with new domain

---

## FILES CHANGED

### Created (New)
- `backend/settings_production.py`
- `backend/gunicorn_config.py`
- `backend/Procfile`
- `backend/render.yaml`
- `backend/.env.example`
- `lawangels/.env.production`
- `ENVIRONMENT_VARIABLES.md`
- `DEPLOYMENT_GUIDE_COMPLETE.md`

### Updated
- `backend/requirements.txt` (added production deps)
- `lawangels/vercel.json` (added env vars + headers)
- `lawangels/src/services/quizApi.ts` (dynamic URL detection)

### Not Modified
- `backend/lawangels/settings.py` (keep for development)
- All other Django files

---

## RECOMMENDED NEXT STEPS

1. **Implement health check endpoint**
   - Add `/api/health/` endpoint for monitoring
   - Returns server status and version

2. **Set up automated backups**
   - Supabase → Settings → Backups
   - Enable daily automated backups

3. **Configure error tracking**
   - Add Sentry for error monitoring
   - Track production issues automatically

4. **Set up CI/CD**
   - GitHub Actions for running tests
   - Auto-run tests before deploying

5. **Monitor performance**
   - Set up Render/Vercel analytics
   - Track API response times
   - Monitor database queries

6. **Implement rate limiting**
   - Prevent API abuse
   - Protect free tier from overuse

7. **Add logging**
   - Send logs to external service
   - Analyze production issues

---

**Ready to deploy?** Follow `DEPLOYMENT_GUIDE_COMPLETE.md` for step-by-step instructions!

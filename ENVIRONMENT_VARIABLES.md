# ENVIRONMENT VARIABLES CONFIGURATION GUIDE
# Production Deployment: Render (Backend) + Vercel (Frontend) + Supabase (Database)

## PART 1: RENDER BACKEND - Environment Variables

### Navigate to:
1. Go to your Render service dashboard
2. Settings → Environment
3. Add each variable below

### CRITICAL: Database Variables
These are required for Supabase PostgreSQL connection:

**Option A: Using DATABASE_URL (Recommended)**
```
DATABASE_URL=postgresql://postgres.kfviwdoyiknsnnnadkpe:YOUR_PASSWORD@aws-1-eu-west-2.pooler.supabase.com:5432/postgres
```
- Get YOUR_PASSWORD from your backend/.env (the value after DB_PASSWORD=)
- This is a secret - use Render's secret variable feature

**Option B: Individual Database Variables (If DATABASE_URL fails)**
```
DB_HOST=aws-1-eu-west-2.pooler.supabase.com
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres.kfviwdoyiknsnnnadkpe
DB_PASSWORD=YOUR_PASSWORD  ← KEEP THIS SECRET
```

### Django Security Variables (⚠️ CRITICAL)

**SECRET_KEY** (MUST be changed from development key)
```
SECRET_KEY=<Generate a new secure key>
```
Generate using Python:
```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```
Then copy the output and paste as SECRET_KEY value.

```
DEBUG=False
ALLOWED_HOSTS=quiz-backend.onrender.com,localhost
```

### Frontend URLs for CORS

```
FRONTEND_URL_PRODUCTION=https://lawangelsfrontend-wy6w.vercel.app
FRONTEND_URL_STAGING=https://lawangelsfrontend-staging.vercel.app
FRONTEND_URL_DEVELOPMENT=http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:3000
```

### Server Configuration

```
PORT=8000
TIME_ZONE=UTC
GUNICORN_WORKERS=2
LOG_LEVEL=info
```

### Complete Render Environment Variables Summary

| Variable | Value | Type | Secret |
|----------|-------|------|--------|
| `DATABASE_URL` | `postgresql://postgres.kfviwdoyiknsnnnadkpe:PASSWORD@aws-1-eu-west-2.pooler.supabase.com:5432/postgres` | Environment | ✅ YES |
| `SECRET_KEY` | `<Generated key>` | Environment | ✅ YES |
| `DEBUG` | `False` | Environment | ❌ NO |
| `ALLOWED_HOSTS` | `quiz-backend.onrender.com,localhost` | Environment | ❌ NO |
| `FRONTEND_URL_PRODUCTION` | `https://lawangelsfrontend-wy6w.vercel.app` | Environment | ❌ NO |
| `FRONTEND_URL_STAGING` | `https://lawangelsfrontend-staging.vercel.app` | Environment | ❌ NO |
| `FRONTEND_URL_DEVELOPMENT` | `http://localhost:5173,...` | Environment | ❌ NO |
| `PORT` | `8000` | Environment | ❌ NO |
| `TIME_ZONE` | `UTC` | Environment | ❌ NO |
| `GUNICORN_WORKERS` | `2` | Environment | ❌ NO |
| `LOG_LEVEL` | `info` | Environment | ❌ NO |

---

## PART 2: VERCEL FRONTEND - Environment Variables

### Navigate to:
1. Go to your Vercel project dashboard
2. Settings → Environment Variables
3. Add each variable below

### API Configuration

```
VITE_API_URL=https://quiz-backend.onrender.com/api
```
- This tells the React app where the backend API is located
- The frontend will use this URL for all API requests
- If not set, quizApi.ts will auto-detect (but explicit is better for production)

### Build Environment

```
VITE_ENV=production
```

### Complete Vercel Environment Variables Summary

| Variable | Value | Environment | Type |
|----------|-------|-------------|------|
| `VITE_API_URL` | `https://quiz-backend.onrender.com/api` | Production | Non-secret |
| `VITE_ENV` | `production` | Production | Non-secret |

Note: These can be set as non-secret (Production only), so they don't expose sensitive data.

---

## PART 3: LOCAL DEVELOPMENT - .env File

For local development, create `backend/.env` with:

```
DEBUG=True
DATABASE_URL=postgresql://postgres.kfviwdoyiknsnnnadkpe:YOUR_PASSWORD@aws-1-eu-west-2.pooler.supabase.com:5432/postgres
SECRET_KEY=django-insecure-jjukq=b0!nx!wt%v89aan8**(kloh)ow88=d$8=$3i-6u98mzp
ALLOWED_HOSTS=localhost,127.0.0.1,quiz-backend.onrender.com
TIME_ZONE=UTC
```

For frontend development, create `lawangels/.env.local` with:

```
VITE_API_URL=http://localhost:8000/api
```

Or just let it auto-detect (it will use localhost:8000 when running on localhost).

---

## PART 4: SUPABASE CONNECTION VERIFICATION

### To verify your Supabase connection works:

1. Get your Supabase credentials from Supabase dashboard → Project Settings → Database
2. Your connection string format:
   ```
   postgresql://[user]:[password]@[host]:[port]/[database]
   ```
3. Current setup:
   - Host: `aws-1-eu-west-2.pooler.supabase.com`
   - Port: `5432`
   - Database: `postgres`
   - User: `postgres.kfviwdoyiknsnnnadkpe`
   - Password: Get from `backend/.env` → `DB_PASSWORD`

### Test connection locally:
```bash
# Install psql (PostgreSQL client) if not already installed
# Then run:
psql "postgresql://postgres.kfviwdoyiknsnnnadkpe:YOUR_PASSWORD@aws-1-eu-west-2.pooler.supabase.com:5432/postgres" -c "SELECT 1;"
```

If you get "1" output, connection is working.

---

## PART 5: QUICK SETUP CHECKLIST

### Backend (Render) Setup:
- [ ] Create new web service on Render
- [ ] Connect to GitHub repository
- [ ] Set Environment → Add all variables from PART 1
- [ ] Set Build Command: `pip install -r requirements.txt`
- [ ] Set Start Command: `cd lawangels && gunicorn lawangels.wsgi:application --config ../gunicorn_config.py`
- [ ] Deploy and verify at `https://quiz-backend.onrender.com`

### Frontend (Vercel) Setup:
- [ ] Import project from GitHub
- [ ] Settings → Environment Variables → Add variables from PART 2
- [ ] Deploy and verify at `https://lawangelsfrontend-wy6w.vercel.app`

### Database (Supabase):
- [ ] Verify connection string is correct
- [ ] Run migrations: `python manage.py migrate` (via Render release command)
- [ ] Test query from both Django and psql

---

## PART 6: TROUBLESHOOTING

### "Connection refused" error
- Check DATABASE_URL is correct
- Verify Supabase host is reachable: `ping aws-1-eu-west-2.pooler.supabase.com`
- Check DB_PASSWORD is correct (not placeholder)

### "CORS error" on frontend
- Verify FRONTEND_URL_PRODUCTION is in Render environment variables
- Check it matches your Vercel URL exactly
- Restart Render service after changing env vars

### "Secret key is insecure" warning
- Generate new SECRET_KEY using the Python command from PART 1
- Update in Render dashboard
- Restart service

### Frontend can't reach API
- Check VITE_API_URL in Vercel environment variables
- Verify API URL is correct: `https://quiz-backend.onrender.com/api`
- Check browser console for API URL being used
- Test API directly: `curl https://quiz-backend.onrender.com/api/exams/`

---

## PART 7: SECRETS MANAGEMENT

### Which variables should be SECRETS (hidden):
- `DATABASE_URL` ✅ YES (contains password)
- `SECRET_KEY` ✅ YES (Django security key)
- `DB_PASSWORD` ✅ YES (if using individual variables)

### Which variables can be PUBLIC:
- `DEBUG` - ❌ NO (should be False in production)
- `ALLOWED_HOSTS` - ❌ NO (hostnames are public)
- `FRONTEND_URL_*` - ❌ NO (URLs are public)
- `VITE_API_URL` - ❌ NO (exposed to browser anyway)

---

## PART 8: ENVIRONMENT VARIABLE PRIORITY

When deploying:

1. **Render Dashboard** (highest priority)
   - Set in Settings → Environment Variables
   - These override .env file values
   - Use for secrets and deployment-specific values

2. **Vercel Dashboard** (highest priority for frontend)
   - Set in Settings → Environment Variables
   - Used during build and at runtime

3. **Local .env file** (development only)
   - Use for local development
   - Never commit to Git
   - Add to .gitignore

---

## PART 9: UPDATING ENVIRONMENT VARIABLES

### After deploying, if you need to change an env var:

**Render:**
1. Go to Settings → Environment
2. Edit the variable
3. Click "Save"
4. Service restarts automatically

**Vercel:**
1. Go to Settings → Environment Variables
2. Edit the variable
3. Redeploy (automatic if GitHub connected)

**Always test after changing:**
- API connectivity
- CORS from frontend
- Database queries

---

Generated: 2025-11-23
Deployment: Render (Backend) + Vercel (Frontend) + Supabase (Database)
Backend URL: https://quiz-backend.onrender.com
Frontend URL: https://lawangelsfrontend-wy6w.vercel.app

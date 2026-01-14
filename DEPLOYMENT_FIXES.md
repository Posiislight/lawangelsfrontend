# Deployment Fixes for quiz-backend Services

## Issues Fixed

### 1. WSGI Settings Module Import Error
**Problem**: The `wsgi.py` file was trying to import `settings_production` instead of `lawangels.settings_production`.

**Fix**: Updated `backend/lawangels/wsgi.py` to use the correct module path:
```python
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'lawangels.settings_production')
```

### 2. Missing Static Files Collection
**Problem**: The build command in `render.yaml` was not collecting static files, which are required for WhiteNoise to serve static files in production.

**Fix**: Added `collectstatic` to the build command:
```yaml
buildCommand: pip install -r requirements.txt && python manage.py collectstatic --noinput
```

### 3. Database Configuration During Build
**Problem**: During the build phase, `DATABASE_URL` might not be available, causing `collectstatic` to fail when trying to import settings that require database configuration.

**Fix**: Updated `backend/lawangels/settings_production.py` to use a dummy SQLite in-memory database during build when no database credentials are available. This allows `collectstatic` to run without requiring a database connection.

## Files Modified

1. `backend/lawangels/wsgi.py` - Fixed settings module import path
2. `render.yaml` - Added collectstatic to build command for both services
3. `backend/lawangels/settings_production.py` - Added fallback database configuration for build phase

## Next Steps

1. **Commit and push these changes** to trigger new deployments:
   ```bash
   git add .
   git commit -m "Fix deployment issues: wsgi settings path, static files collection, build database config"
   git push origin main  # for production
   git push origin develop  # for staging
   ```

2. **Monitor the deployments** in the Render dashboard to ensure they complete successfully.

3. **Verify the services** are running:
   - Production: https://quiz-backend.onrender.com
   - Staging: https://quiz-backend-staging.onrender.com

## Additional Notes

- The build command now collects static files during the build phase, which is required for WhiteNoise to serve them efficiently.
- The dummy database configuration only activates during build when no database credentials are available. At runtime, when `DATABASE_URL` is set by Render, it will use the production database.
- Both services (production and staging) have been updated with the same fixes.

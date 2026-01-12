

import sys
import traceback
from rest_framework.test import APIClient
from django.contrib.auth.models import User

try:
    # Ensure we have a user
    user, created = User.objects.get_or_create(username='testuser')
    client = APIClient()
    client.force_authenticate(user=user)

    print("Checking /api/quizzes-page/...")
    response = client.get('/api/quizzes-page/')
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print("SUCCESS!")
        print(f"Topics found: {len(data['topics'])}")
        print(f"Recent attempts: {len(data.get('recentAttempts', []))}")
    else:
        print("FAILED with:")
        print(response.content.decode())
except Exception:
    traceback.print_exc()


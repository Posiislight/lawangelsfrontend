import requests
import json
import time

BASE_URL = "http://localhost:8000"

# Test data
exam_data = {
    "exam_id": 1,
    "speed_reader_enabled": False
}

print("Testing POST /api/exam-attempts/ endpoint\n")
print("=" * 60)

# Test without auth
print("\n[1] POST without authentication...")
response = requests.post(
    f"{BASE_URL}/api/exam-attempts/",
    json=exam_data,
    headers={"Content-Type": "application/json"}
)
print(f"Status: {response.status_code}")
if response.status_code != 401:
    print(f"Response: {response.text[:200]}")
else:
    print("Expected 401 Unauthorized")

print("\n[2] POST with authentication...")
# First, we need to get a token or use session
# Let's try with a simple auth token if available
headers = {
    "Content-Type": "application/json",
    # Add token here if needed
}

response = requests.post(
    f"{BASE_URL}/api/exam-attempts/",
    json=exam_data,
    headers=headers
)
print(f"Status: {response.status_code}")
print(f"Response: {response.text}")

if response.status_code in [200, 201]:
    data = response.json()
    print(f"\nSuccess!")
    print(f"  Attempt ID: {data.get('id')}")
    print(f"  Status: {data.get('status')}")
    print(f"  Total Questions: {data.get('total_questions')}")

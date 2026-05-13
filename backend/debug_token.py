import sys
sys.path.insert(0, ".")
from app.config import settings
from app.routers.auth import create_token
from jose import jwt

print(f"SECRET_KEY from config: {settings.SECRET_KEY[:20]}...")
print(f"ALGORITHM: {settings.JWT_ALGORITHM}")

token = create_token(1)
print(f"Token: {token}")

# Decode it back
decoded = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
print(f"Decoded: {decoded}")

# Try hitting the API
import urllib.request
req = urllib.request.Request(
    "http://localhost:8900/api/v1/records?page=1&page_size=1",
    headers={"Authorization": f"Bearer {token}"},
)
try:
    resp = urllib.request.urlopen(req)
    print(f"Status: {resp.status}")
    print(resp.read().decode()[:200])
except urllib.error.HTTPError as e:
    print(f"HTTP Error: {e.code}")
    print(e.read().decode())

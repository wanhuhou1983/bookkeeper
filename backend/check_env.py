import sys
sys.path.insert(0, ".")
from app.config import settings
print(f"SECRET_KEY: {settings.SECRET_KEY[:30]}...")
print(f"DB URL: {settings.DATABASE_URL}")

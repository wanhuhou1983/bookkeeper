import sys
sys.path.insert(0, ".")
from app.config import settings
from app.routers.auth import create_token

token = create_token(1)
print(f"Token: {token[:50]}...")

import urllib.request
import json

req = urllib.request.Request(
    "http://localhost:8900/api/v1/records?page=1&page_size=3",
    headers={"Authorization": f"Bearer {token}"},
)
resp = urllib.request.urlopen(req)
data = json.loads(resp.read())
print(f"Total: {data['total']} records")
for r in data["items"]:
    t = "支出" if r["type"] == 1 else "收入"
    note = r.get("note") or ""
    cat = r.get("category_name") or ""
    print(f"  {r['record_date']} {t} {r['amount']} {note} [{cat}]")

# Test stats overview
req2 = urllib.request.Request(
    "http://localhost:8900/api/v1/stats/overview?month=2026-05",
    headers={"Authorization": f"Bearer {token}"},
)
resp2 = urllib.request.urlopen(req2)
stats = json.loads(resp2.read())
print(f"\n2026-05 概览:")
print(f"  支出: {stats['month_expense']}")
print(f"  收入: {stats['month_income']}")
print(f"  结余: {stats['month_balance']}")
print(f"  最近记录数: {len(stats['recent_records'])}")

#!/usr/bin/env bash
# E2E curl test script for Leverage OJ backend
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3000}"
PASS=0
FAIL=0
FAILED_TESTS=()

green() { printf "\033[32m%s\033[0m\n" "$1"; }
red()   { printf "\033[31m%s\033[0m\n" "$1"; }

check() {
  local name="$1" expected_code="$2" actual_code="$3" body="$4" body_check="${5:-}"
  if [ "$actual_code" != "$expected_code" ]; then
    red "FAIL: $name (expected $expected_code, got $actual_code)"
    FAIL=$((FAIL + 1))
    FAILED_TESTS+=("$name")
    return
  fi
  if [ -n "$body_check" ]; then
    if ! echo "$body" | grep -q "$body_check"; then
      red "FAIL: $name (body missing: $body_check)"
      FAIL=$((FAIL + 1))
      FAILED_TESTS+=("$name")
      return
    fi
  fi
  green "PASS: $name"
  PASS=$((PASS + 1))
}

echo "=== Leverage OJ E2E Tests ==="
echo "Target: $BASE_URL"
echo ""

# ---------- 1. User login ----------
RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"user1","password":"Test@123456"}')
HTTP_CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
USER_TOKEN=$(echo "$BODY" | grep -o '"accessToken":"[^"]*"' | head -1 | cut -d'"' -f4)
check "POST /auth/login (user1)" "200" "$HTTP_CODE" "$BODY" "accessToken"

# small delay to avoid rate limiting
sleep 2

# ---------- Admin login ----------
RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin@123456"}')
HTTP_CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
ADMIN_TOKEN=$(echo "$BODY" | grep -o '"accessToken":"[^"]*"' | head -1 | cut -d'"' -f4)
check "POST /auth/login (admin)" "200" "$HTTP_CODE" "$BODY" "accessToken"

# ---------- 2. GET /problems ----------
RESP=$(curl -s -w "\n%{http_code}" "$BASE_URL/problems?page=1&perPage=5")
HTTP_CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
check "GET /problems?page=1&perPage=5" "200" "$HTTP_CODE" "$BODY"

# ---------- 3. GET /problems/1 ----------
RESP=$(curl -s -w "\n%{http_code}" "$BASE_URL/problems/1")
HTTP_CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
check "GET /problems/1 (has content)" "200" "$HTTP_CODE" "$BODY" "content"

# ---------- 4. GET /contests ----------
RESP=$(curl -s -w "\n%{http_code}" "$BASE_URL/contests?page=1&perPage=5" \
  -H "Authorization: Bearer $USER_TOKEN")
HTTP_CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
check "GET /contests?page=1&perPage=5" "200" "$HTTP_CODE" "$BODY"

# ---------- 5. GET /courses ----------
RESP=$(curl -s -w "\n%{http_code}" "$BASE_URL/courses?page=1&perPage=5" \
  -H "Authorization: Bearer $USER_TOKEN")
HTTP_CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
check "GET /courses?page=1&perPage=5" "200" "$HTTP_CODE" "$BODY"

# ---------- 6. GET /auth/profile ----------
RESP=$(curl -s -w "\n%{http_code}" "$BASE_URL/auth/profile" \
  -H "Authorization: Bearer $USER_TOKEN")
HTTP_CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
check "GET /auth/profile (user token)" "200" "$HTTP_CODE" "$BODY"

# ---------- 7. GET /users (admin) ----------
RESP=$(curl -s -w "\n%{http_code}" "$BASE_URL/users?page=1&perPage=5" \
  -H "Authorization: Bearer $ADMIN_TOKEN")
HTTP_CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
check "GET /users?page=1&perPage=5 (admin)" "200" "$HTTP_CODE" "$BODY"

# ---------- 8. GET /suspicion (admin) ----------
RESP=$(curl -s -w "\n%{http_code}" "$BASE_URL/suspicion?page=1&perPage=5" \
  -H "Authorization: Bearer $ADMIN_TOKEN")
HTTP_CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
check "GET /suspicion?page=1&perPage=5 (admin)" "200" "$HTTP_CODE" "$BODY"

# ---------- 9. GET /settings (admin) ----------
RESP=$(curl -s -w "\n%{http_code}" "$BASE_URL/settings" \
  -H "Authorization: Bearer $ADMIN_TOKEN")
HTTP_CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
check "GET /settings (admin)" "200" "$HTTP_CODE" "$BODY"

# ---------- 10. GET /stat (admin) ----------
RESP=$(curl -s -w "\n%{http_code}" "$BASE_URL/stat" \
  -H "Authorization: Bearer $ADMIN_TOKEN")
HTTP_CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
check "GET /stat (admin)" "200" "$HTTP_CODE" "$BODY"

# ---------- Summary ----------
echo ""
echo "=== Results: $PASS passed, $FAIL failed ==="
if [ "$FAIL" -gt 0 ]; then
  echo "Failed tests:"
  for t in "${FAILED_TESTS[@]}"; do
    red "  - $t"
  done
  exit 1
fi
green "All tests passed!"

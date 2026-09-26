"""Example bot for closest-judge.py. Output must be flushed each turn."""
import json
import sys

for line in sys.stdin:
    request = json.loads(line)
    if "requests" in request:
        current = request["requests"][-1] if request["requests"] else {}
        request = json.loads(current) if isinstance(current, str) else current
    print(json.dumps({"move": request.get("target", 5)}), flush=True)

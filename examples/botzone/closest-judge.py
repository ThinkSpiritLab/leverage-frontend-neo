"""One-turn 'closest to 5' judge. Run under the external judge, NOT the frontend.

Protocol: one stdin JSON object {round, responses} per line; one flushed JSON line
{commands, display, verdict, [scores]} per turn. Responses are bot stdout.
"""
import json
import sys


def move(value, player):
    try:
        parsed = json.loads(value) if isinstance(value, str) else value
        if isinstance(parsed, dict):
            parsed = parsed.get("move", parsed.get(str(player), -1))
        return int(parsed) if 0 <= int(parsed) <= 9 else -1
    except (ValueError, TypeError):
        return -1


for line in sys.stdin:
    data = json.loads(line)
    responses = data.get("responses", {})
    if not responses:  # first turn: send requests; do not finish yet
        out = {
            "commands": {"0": {"target": 5}, "1": {"target": 5}},
            "display": {"target": 5, "moves": None},
            "verdict": "continue",
        }
    else:
        a, b = move(responses.get("0"), 0), move(responses.get("1"), 1)
        distance = lambda n: abs(n - 5) if n >= 0 else 100
        scores = {"0": int(distance(a) < distance(b)), "1": int(distance(b) < distance(a))}
        out = {
            "commands": {"0": None, "1": None},
            "display": {"target": 5, "moves": {"0": a, "1": b}},
            "verdict": "finish", "scores": scores,
        }
    print(json.dumps(out), flush=True)
    if out["verdict"] == "finish":
        break

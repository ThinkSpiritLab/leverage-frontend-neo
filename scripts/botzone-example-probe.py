"""Trusted example protocol checks only; not sandbox/judge acceptance."""
import json
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]

def run(name, messages):
    result = subprocess.run([sys.executable, str(ROOT / 'examples' / 'botzone' / name)],
                            input=''.join(json.dumps(message) + '\n' for message in messages),
                            text=True, capture_output=True, check=True, timeout=5)
    return [json.loads(line) for line in result.stdout.splitlines()]

for response in [5, {'move': 5}, {'0': 5}]:
    frames = run('closest-judge.py', [
        {'round': 1, 'responses': {}},
        {'round': 2, 'responses': {'0': response, '1': 4}},
    ])
    assert frames[0]['verdict'] == 'continue'
    assert frames[-1]['scores'] == {'0': 1, '1': 0}, response

for message in [{'target': 3}, {'requests': ['{"target":3}'], 'responses': []}]:
    assert run('closest-bot.py', [message]) == [{'move': 3}], message
print('PASS trusted examples: raw/envelope/player-keyed moves and BotInput wrapper; no real judge executed')

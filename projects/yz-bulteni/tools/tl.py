"""Print the timeline main.js builds from vo/dur.json (or the estimate), for picking still times."""
import json, math, os, sys
H = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
p = os.path.join(H, 'vo', 'dur.json'); dur = json.load(open(p if os.path.exists(p) else os.path.join(H, 'vo', 'dur.est.json')))
PLAN = [('sting', [], 1.5, 0, 0), ('rundown', ['v1'], 5.5, .3, 1.4), ('eniac', ['v2'], 4.5, .15, .9), ('turing', ['v3'], 5.0, .15, .7),
 ('quote', ['v4'], 6.5, .3, 2.3), ('dart', ['v5'], 8.0, .2, 1.8), ('winter', ['v6', 'v7'], 9.0, .2, 1.9), ('deepblue', ['v8'], 6.0, .15, .9),
 ('chess', ['v9', 'v10'], 9.0, .15, 1.2), ('go', ['v11'], 6.5, .15, 2.0), ('vision', ['v12', 'v13', 'v14'], 18, .2, 2.6),
 ('transformer', ['v15'], 6.0, .15, 1.0), ('scale', ['v16'], 8.5, .15, 2.2), ('chatgpt', ['v17'], 6.0, .15, 2.0), ('recap', ['v18'], 5.0, .2, 1.6), ('end', [], 5.5, 0, 0)]
t = 0; S = {}; V = {}
for id, lines, mn, lead, tail in PLAN:
    S[id] = t; a = t + lead
    for i, l in enumerate(lines): V[l] = (round(a, 2), dur[l]); a += dur[l] + (.4 if i < len(lines) - 1 else 0)
    end = max(t + mn, a + tail)
    if id not in ('sting', 'end'): end = 1.5 + math.ceil((end - 1.5) / .5 - 1e-6) * .5
    print(f'{id:12s} {t:7.2f} {end - t:6.2f}  ' + ' '.join(f'{l}@{V[l][0]}' for l in lines)); t = end
print('DUR', t)

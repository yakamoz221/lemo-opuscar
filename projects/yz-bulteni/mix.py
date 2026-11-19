"""YZ Bülteni · score + foley + voice -> out/mix.wav (48 kHz stereo; mux.sh brings it to -14 LUFS).
Score: 120 BPM news theme, beat 0 = 1.5 s, sections follow the bulletin (timeline from events.json):
SORU full E minor -> KIŞ sparse pizzicato + horns, cold -> OYUN darker (violins down, tremolo, heartbeat kick)
-> GÖRME pulse, one beat of silence before the 2015 step, the heaviest hit, a held drone under the stamp
-> DİL lifts to G major -> recap theme with a glockenspiel note per tick -> E-major tutti on the end card.
Run: $LIB/.venv/bin/python mix.py"""
import json, os, sys
import numpy as np
from scipy.io import wavfile
from scipy.signal import resample_poly

HERE = os.path.dirname(os.path.abspath(__file__))
LIB = os.environ.get('LIB', '/home/claude/lemo-opuscar')
sys.path.insert(0, os.path.join(LIB, 'core/audio'))
import sfx as X
import sampler as Sm

SR = X.SR
EVD = json.load(open(os.path.join(HERE, 'events.json')))
DUR, EV = EVD['dur'], EVD['ev']
TL = next(e for e in EV if e['type'] == 'timeline'); S, D, CROSS = TL['S'], TL['D'], TL['cross']
N = int(DUR * SR) + SR
music = np.zeros((N, 2), np.float32); fx = np.zeros((N, 2), np.float32); vo = np.zeros((N, 2), np.float32)
tt = np.arange(N) / SR
B = .5; T0 = 1.5
NOTE = {'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11}

def section(t):
    if t < S['winter']: return 'soru'
    if t < S['deepblue']: return 'kis'
    if t < S['vision']: return 'oyun'
    if t < S['transformer']: return 'gorme'
    if t < S['recap']: return 'dil'
    if t < S['end']: return 'recap'
    return 'end'
PROG = {'soru': ['Em', 'C', 'G', 'D'], 'kis': ['Am', 'Em', 'B', 'Em'], 'oyun': ['Am', 'B', 'Em', 'C'],
        'gorme': ['Em', 'C', 'Am', 'B'], 'dil': ['G', 'D', 'Em', 'C'], 'recap': ['Em', 'C', 'B', 'B'], 'end': ['E']}
SIL = (CROSS - .5, CROSS)                         # one beat of silence before the threshold breaks
DRONE = (CROSS + .9, S['transformer'] - .3)       # after the stamp: only a held low E until the next story
def state(t):
    if SIL[0] <= t < SIL[1] or DRONE[0] <= t < DRONE[1]: return 'off'
    sec = section(t)
    return {'soru': 'full', 'kis': 'sparse', 'oyun': 'tense', 'gorme': 'mid', 'dil': 'full', 'recap': 'full', 'end': 'off'}[sec]
def triad(ch, octv):
    minor = ch.endswith('m'); r = 12 * (octv + 1) + NOTE[ch.rstrip('m')]; return [r, r + (3 if minor else 4), r + 7]

M = []
def ev(t, inst, pitch, dur, vel, pan=0, gain=1.0, **kw): M.append(dict(t=t, inst=inst, pitch=pitch, dur=dur, vel=vel, pan=pan, gain=gain, **kw))
def stab(t, notes, v=.9, d=.35):
    for ins, o, pan, g in [('trumpet_stac', 12, .15, .9), ('horn_stac', 0, -.2, 1.0), ('trombone_stac', -12, .05, 1.0)]:
        for n in notes: ev(t, ins, n + o, d, v, pan, g)

# —— sting ——
for i, p in enumerate([64, 67, 71, 76]): ev(i * .02, 'violins_trem', p, .42, .25 + i * .05, (i - 1.5) * .2, .5, attack=.35)
stab(.4, [64, 67, 71], .95, .5)
ev(.4, 'timpani', 'E3', 1, .95, 0, 1.3); ev(.4, 'bass_drum', None, None, .9, 0, 1.1); ev(.4, 'crash', None, None, .7, .1, .7)
for i, p in enumerate([76, 83, 79, 88]): ev(.82 + i * .1, 'glockenspiel', p, .6, .55, .3 - i * .2, .7)

END = S['end'] - .05
bar = 0; secbar = {}
while True:
    tb = T0 + bar * 2.0
    if tb >= END: break
    sec = section(tb + .01); i = secbar.get(sec, 0); secbar[sec] = i + 1
    ch = PROG[sec][i % len(PROG[sec])]; tri = triad(ch, 3)
    pat = [tri[0] + 12, tri[2] + 12, tri[0] + 24, tri[2] + 12]
    for k in range(8):
        t = tb + k * B / 2; st = state(t)
        if st == 'off' or t >= END: continue
        if st == 'sparse' and k % 2: continue
        v = (.42 if k % 2 == 0 else .32) * (.75 if st == 'sparse' else 1)
        ev(t, 'violins_spic', pat[k % 4] - (12 if st == 'tense' else 0), .2, v, .25, .5 if st != 'mid' else .4)
    for k in range(4):
        t = tb + k * B; st = state(t)
        if st == 'off' or t >= END: continue
        ev(t, 'contrabass_pizz', tri[0] - 12, .4, .72 if k == 0 else .5, -.1, .9)
        if st == 'sparse' and k in (0, 2): ev(t, 'cellos_pizz', tri[1], .4, .45, .2, .5)
    st0 = state(tb + .6)
    if st0 in ('full', 'sparse', 'mid'):
        ev(tb, 'horn', tri[1], 2.0, .28, -.25, .5, attack=.25); ev(tb, 'horn', tri[2], 2.0, .26, .25, .45, attack=.25)
    if st0 == 'tense':
        ev(tb, 'violins_trem', tri[0] + 12, 2.0, .3, -.2, .45, attack=.2); ev(tb, 'violins_trem', tri[2] + 12, 2.0, .28, .2, .4, attack=.2)
    for k in range(4):
        t = tb + k * B; st = state(t)
        if st == 'off' or t >= END: continue
        if st == 'tense': ev(t, 'bass_drum', None, None, .5, 0, .7)
        elif st in ('full', 'mid'):
            if k in (0, 2): ev(t, 'bass_drum', None, None, .55, 0, .7)
            if k in (1, 3) and t > 3.4 and st == 'full': ev(t, 'snare2', None, None, .33, .1, .33)
        elif k == 0: ev(t, 'bass_drum', None, None, .4, 0, .5)
    bar += 1

# rundown rows, story changes, the break, the lift, recap ticks, end card
for e in EV:
    if e['type'] == 'row': ev(e['t'], 'glockenspiel', [76, 79, 83, 86, 88][e['i']], .5, .5, .2, .55)
for k in ('eniac', 'winter', 'deepblue', 'vision', 'transformer', 'recap'): ev(S[k], 'timpani', 'E3', 1, .7, 0, .9)
for k in ('turing', 'quote', 'dart', 'chess', 'go', 'scale', 'chatgpt'): ev(S[k], 'timpani', 'B2', .6, .45, 0, .6)
stab(S['eniac'], [64, 67, 71], .7, .3)
ev(S['winter'] + .1, 'cellos', 45, 3.0, .3, -.1, .45, attack=.6, release=.8); ev(S['winter'] + .1, 'contrabass', 33, 3.0, .3, .1, .4, attack=.6, release=.8)
stab(CROSS, [52, 55, 59], 1.0, .7); ev(CROSS, 'timpani', 'E2', 1.2, 1.0, 0, 1.4); ev(CROSS, 'crash', None, None, .8, -.1, .8); ev(CROSS, 'bass_drum', None, None, 1.0, 0, 1.2)
for i in range(14): ev(CROSS + .1 + i * .05, 'timpani', 'B2', .3, .25 + i * .03, 0, .5)
ev(CROSS + .9, 'tubular_bells', 'E4', 2, .5, .2, .4)
dl = DRONE[1] - DRONE[0]
if dl > .5:
    ev(DRONE[0] + .05, 'cellos', 40, dl, .4, -.1, .55, attack=.3, release=.4); ev(DRONE[0] + .05, 'contrabass', 28, dl, .4, .1, .5, attack=.3, release=.4)
    ev(DRONE[0] + .05, 'horn', 52, dl - .1, .25, 0, .35, attack=.5)
stab(S['transformer'] + .05, [67, 71, 74], .8, .35)
for i, n in enumerate([79, 83, 86]): ev(S['transformer'] + .2 + i * .1, 'glockenspiel', n, .6, .5, -.2 + i * .2, .55)
for e in EV:
    if e['type'] == 'tick_ok': ev(e['t'], 'glockenspiel', [76, 79, 83, 86, 88][e['i']], .6, .55, -.3 + e['i'] * .15, .6)
TE = S['end']
for i in range(10): ev(TE - .5 + i * .05, 'timpani', 'B2', .3, .35 + i * .05, 0, .6)
for ins, ns, g in [('trumpet', [76, 80, 83], .7), ('horn', [64, 68, 71], .8), ('trombone', [52, 59], .8), ('violins', [76, 80, 83, 88], .5), ('cellos', [40, 52], .7)]:
    for n in ns: ev(TE, ins, n, 3.2, .78, 0, g, attack=.02, release=1.2)
ev(TE, 'timpani', 'E3', 1, 1.0, 0, 1.3); ev(TE, 'crash', None, None, .8, 0, .8); ev(TE, 'tubular_bells', 'E5', 3, .7, .2, .6); ev(TE, 'bass_drum', None, None, 1.0, 0, 1.1)
for i, p in enumerate([76, 80, 83, 88]): ev(TE + .35 + i * .09, 'glockenspiel', p, .8, .5, -.3 + i * .2, .55)

music += Sm.render(M, DUR + 1, master=False)[:N]

# 16th-note low-passed saw pulse under full / tense / mid sections
def saw(f, d): t = X.t_(d); return 2 * ((t * f) % 1) - 1
pulse = np.zeros((N, 2), np.float32)
bar = 0; secbar = {}
while True:
    tb = T0 + bar * 2.0
    if tb >= END: break
    sec = section(tb + .01); i = secbar.get(sec, 0); secbar[sec] = i + 1
    ch = PROG[sec][i % len(PROG[sec])]; f = 440 * 2 ** ((12 * 3 + NOTE[ch.rstrip('m')] - 69) / 12)
    for k in range(16):
        t = tb + k * B / 4; st = state(t)
        if st not in ('full', 'tense', 'mid') or t >= END: continue
        x = saw(f, .11) * X.env_exp(.11, .045); x = X.lp(x, 1150 if st == 'tense' else 900)
        X.add(pulse, x.astype(np.float32), t, (.18 if st == 'mid' else .15) * (1.0 if k % 4 else .6))
    bar += 1
music += pulse
music = Sm.room(music, .35, .14)

# —— beds ——
amb = np.zeros((N, 2), np.float32)
def bed(a, b, x, g):
    n0, n1 = int(a * SR), min(N, int(b * SR)); sg = x[:n1 - n0] * g
    fade = np.minimum(1, np.minimum(np.arange(len(sg)) / (.3 * SR), (len(sg) - np.arange(len(sg))) / (.3 * SR)))
    amb[n0:n1] += (sg * fade)[:, None]
def hum(d): return X.lp(X.brown(d), 400) + np.sin(2 * np.pi * 120 * X.t_(d)) * .05
for a, b, kind, g in [(S['eniac'], S['turing'], 'hum', .08), (S['winter'], S['deepblue'], 'air', .07), (S['vision'], S['transformer'], 'hum', .05), (S['scale'], S['chatgpt'], 'hum', .1)]:
    d = b - a + .1; x = hum(d) if kind == 'hum' else X.lp(X.noise(d), 900); bed(a, b, X.norm(x, .5), g)

# —— foley ——
for e in EV:
    t, ty = e['t'], e['type']
    if ty == 'swish': X.add(fx, X.whoosh(.32, .7), t, .6, -.4)
    elif ty == 'whoosh': X.add(fx, X.whoosh(.38, .8), t - .05, .55, .3)
    elif ty == 'glint': X.add(fx, X.ding(.4), t, .25, .4)
    elif ty == 'hit': X.add(fx, X.thump(.9, 60), t, .6)
    elif ty == 'card': X.add(fx, X.thump(.7, 65), t, .5); X.add(fx, X.whoosh(.2, .5), t - .08, .28)
    elif ty == 'row': X.add(fx, X.click(.8, .9), t, .4, .3); X.add(fx, X.thump(.5, 110), t, .32)
    elif ty == 'blip': X.add(fx, X.ding(.5), t, .2, .3)
    elif ty == 'slam': X.add(fx, X.thump(.8, 75), t, .5); X.add(fx, X.whoosh(.18, .6), t - .1, .32, .4)
    elif ty == 'stamp': X.add(fx, X.thump(.9, 90), t, .55); X.add(fx, X.lp(X.clack(.7, .8), 3000), t, .35)
    elif ty == 'stamp_big': X.add(fx, X.thump(1.0, 70), t, .6); X.add(fx, X.lp(X.clack(.6, 1.0), 2500), t, .3)
    elif ty == 'flap':
        for i in range(3): X.add(fx, X.click(1.1 + i * .15, .7), t + i * .05, .3, .2)
    elif ty == 'ding': X.add(fx, X.ding(.9), t, .35, .3)
    elif ty == 'pop': X.add(fx, X.pop(.7), t, .32, .3)
    elif ty == 'paper': X.add(fx, (X.bp(X.noise(.35), 1200, 6000) * X.env_exp(.35, .12)).astype(np.float32), t, .25, .4); X.add(fx, X.whoosh(.3, .6), t, .28, .4)
    elif ty == 'type':
        for i in range(14): X.add(fx, X.clack(1.4 + X._rng.random() * .3, .5), t + i * .09, .1, .3)
    elif ty == 'check': X.add(fx, X.click(1.2, .8), t, .3, .3)
    elif ty == 'mark': X.add(fx, (X.bp(X.noise(.4), 2500, 7000) * np.sin(np.pi * X.t_(.4) / .4)).astype(np.float32), t, .1, .3)
    elif ty == 'quote': X.add(fx, X.thump(.6, 95), t, .38); X.add(fx, X.whoosh(.25, .5), t - .05, .25, -.2)
    elif ty == 'draw': X.add(fx, (X.bp(X.noise(.5), 3000, 7000) * np.sin(np.pi * X.t_(.5) / .5)).astype(np.float32), t, .05, -.2)
    elif ty == 'drop':
        t2 = X.t_(.22); f = 330 * 2 ** (-e['d'] / 12); X.add(fx, (np.sin(2 * np.pi * f * t2) * X.env_exp(.22, .06)).astype(np.float32), t, .28, .2)
    elif ty == 'boom': X.add(fx, X.thump(1.0, 42), t, .9); X.add(fx, X.lp(X.whoosh(.5, .9), 1200), t - .3, .4)
    elif ty == 'roll': X.add(fx, X.click(1.8, .4), t, .16, .3)
    elif ty == 'fall': X.add(fx, X.lp(X.whoosh(.45, .8), 1500), t, .35, .2)
    elif ty == 'tick_ok': X.add(fx, X.pop(.6), t, .3)
    elif ty == 'end': pass
fx = Sm.room(fx, .2, .08)

# —— narration: broadcast EQ + compression ——
spans = []
for e in EV:
    if e['type'] != 'vo': continue
    p = os.path.join(HERE, 'vo', e['id'] + '.wav')
    if not os.path.exists(p): continue
    sr, x = wavfile.read(p); x = x.astype(np.float32) / (32768 if x.dtype == np.int16 else 1)
    if x.ndim > 1: x = x.mean(1)
    x = resample_poly(x, SR, sr).astype(np.float32)
    x = X.hp(x, 90).astype(np.float32); x = X.compress(x / (np.abs(x).max() + 1e-9) * .8, .3, 3)
    X.add(vo, x.astype(np.float32), e['t'], 1.0, 0); spans.append((e['t'], e['t'] + len(x) / SR))
duck = np.ones(N, np.float32)
for a, b in spans:
    k = np.clip(np.minimum((tt - (a - .08)) / .08, ((b + .15) - tt) / .15), 0, 1); duck = np.minimum(duck, 1 - .55 * k)
music *= duck[:, None]
cut = 1 - duck
band = np.stack([X.bp(music[:, c], 1200, 5000) for c in range(2)], 1).astype(np.float32)
music -= band * (cut / .55 * .6)[:, None]

mix = music * .9 + fx * .8 + amb * .8 + vo * 1.3
mix *= np.clip((DUR - tt) / 1.0, 0, 1)[:, None]
mix = mix[:int(DUR * SR)]
mix = np.stack([X.limit(mix[:, 0], .95), X.limit(mix[:, 1], .95)], 1)
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
wavfile.write(os.path.join(HERE, 'out', 'mix.wav'), SR, (mix * 32767).astype(np.int16))
print('mix', mix.shape, 'peak', float(np.abs(mix).max()), 'voice lines', len(spans))
print('\n'.join(Sm.credits(sorted({e['inst'] for e in M}))))

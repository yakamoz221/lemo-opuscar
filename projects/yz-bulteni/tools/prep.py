"""raw/*.jpg (Wikimedia Commons, see SOURCES.md) -> assets/plate_*.jpg: one shared duotone grade (STYLE.md §6)."""
import os
import numpy as np
from PIL import Image
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SHADOW = np.array([14, 16, 19], float); LIGHT = np.array([236, 231, 216], float)
def grade(im, black=8, white=232, gamma=1.05):
    g = np.asarray(im.convert('L'), float)
    lo, hi = np.percentile(g, 0.5), np.percentile(g, 99.6)
    g = np.clip((g - lo) / max(1, hi - lo), 0, 1) ** gamma
    g = g * g * (3 - 2 * g) * .35 + g * .65
    g = black / 255 + g * (white - black) / 255
    return Image.fromarray(np.clip(SHADOW + (LIGHT - SHADOW) * g[..., None], 0, 255).astype(np.uint8))
os.makedirs(os.path.join(HERE, 'assets'), exist_ok=True)
for n in ['turing', 'eniac', 'deepblue', 'baduk', 'pleiades']:
    im = Image.open(os.path.join(HERE, 'raw', n + '.jpg')).convert('RGB')
    grade(im).save(os.path.join(HERE, 'assets', f'plate_{n}.jpg'), quality=93)
    print(n, im.size)

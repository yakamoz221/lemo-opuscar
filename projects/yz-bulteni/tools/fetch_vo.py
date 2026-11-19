#!/usr/bin/env python3
"""Download the ElevenLabs takes, make trimmed 48 kHz mono WAVs, write vo/dur.json.

Usage: python3 tools/fetch_vo.py vo/urls.json
urls.json = {"v1": "<signed mp3 url>", ...}  (from ElevenLabs MCP creative_get_generations,
generation ids in vo/elevenlabs.json). Run from the project folder.
"""
import json, subprocess, sys, urllib.request
from pathlib import Path

P = Path(__file__).resolve().parent.parent
VO = P / "vo"
SRC = VO / "src"
SRC.mkdir(parents=True, exist_ok=True)
urls = json.loads(Path(sys.argv[1]).read_text())
# trim leading/trailing silence (-50 dB), keep a 40 ms tail so words don't clip
TRIM = ("silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.02,"
        "areverse,silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.04,areverse")
dur = {}
for vid in sorted(urls, key=lambda k: int(k[1:])):
    mp3 = SRC / f"{vid}.mp3"
    if not mp3.exists() or mp3.stat().st_size == 0:
        urllib.request.urlretrieve(urls[vid], mp3)
    wav = VO / f"{vid}.wav"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(mp3), "-af", TRIM,
                    "-ar", "48000", "-ac", "1", str(wav)], check=True)
    d = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                                       "-of", "csv=p=0", str(wav)]).decode())
    dur[vid] = round(d, 2)
    print(f"{vid}: {dur[vid]:.2f}s")
(VO / "dur.json").write_text(json.dumps(dur, indent=1) + "\n")
print(f"total speech {sum(dur.values()):.1f}s -> vo/dur.json")

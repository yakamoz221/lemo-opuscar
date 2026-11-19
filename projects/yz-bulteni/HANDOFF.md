# HANDOFF — YZ Bülteni (yapay zekânın tarihi, dikey 2 dk)

Durum (19 Kasım 2026, akşam): **FİLM TAMAM.** `yz-bulteni.mp4` (1080×1920, 24 fps, 2:12, −14 LUFS) ve `yz-bulteni.srt` üretildi; MP4 depoya konmadı (48 MB), aynı komutlarla yeniden üretilir.

Son oturumda yapılanlar: 18 ElevenLabs kaydı indirildi (`vo/v*.wav`, `vo/dur.json`, toplam 87,9 sn konuşma). Gerçek süreler tahminden kısa çıktığı için 6 damga okuma süresini karşılamıyordu; `main.js` PLAN'ında turing/dart/winter/go/scale/chatgpt kuyrukları uzatıldı (`tools/tl.py` eşitlendi), readcheck temiz. Whisper kontrolü yapılamadı (Hugging Face oturumda kapalıydı); yerine satır başına konuşma hızı ve iç duraklama kontrolü yapıldı, hepsi normal. ffmpeg 7+ için pypi'deki `imageio-ffmpeg` paketinin içindeki ffmpeg 9 kullanıldı (`PATH=/opt/ff7:$PATH`).

## Neler hazır
- Stil: Broadcast News Package (`styles/news-package`), 1080×1920, 24 fps, Türkçe.
- `TREATMENT.md`, `FACTS.md` (her sayı kaynaklı), `SOURCES.md` (5 Commons görseli, lisanslar kontrol edildi).
- `main.js` + `index.html`: tüm çekimler. Zamanlama `vo/dur.json`'dan otomatik kurulur (yoksa `vo/dur.est.json` tahmini kullanılır).
- `mix.py`: müzik (VSCO 2 CE / VCSL örnekleri), efektler, ses ducking. `events.json`'u okur.
- `vo/lines.json`: 18 satır; `text` = altyazı, `say` = seslendirilecek metin (sayılar yazıyla, isimler okunuşa göre).
- `tools/prep.py`: görselleri duotone'a çevirir. `tools/tl.py`: zaman çizelgesini yazdırır.

## Kalan adımlar
1. **Ses — ÜRETİLDİ (19 Kasım):** 18 satır ElevenLabs'te "Adil – Clear & Confident Turkish News" sesiyle, `eleven_multilingual_v2`, satır başına tek take. Hangi satırın hangi üretim olduğu `vo/elevenlabs.json`'da. Kapanış kartındaki "Ses:" satırı güncellendi.
   **Engel:** mp3'ler `elevenlabsusercontent.com` üzerinden iniyor; bu alan adı oturumun ağ izin listesinde olmalı (claude.ai → Ayarlar → Yetenekler). İzin verilince:
   - `creative_get_generations` ile (flow `gIziuszsDsZ6vCz8dCwN`, en fazla 4 id/çağrı) imzalı URL'leri al, `vo/urls.json` olarak yaz: `{ "v1": "<url>", ... }`
   - `python3 tools/fetch_vo.py vo/urls.json` → `vo/<id>.wav` (kırpılmış, 48 kHz mono) + `vo/dur.json`.
   Yeniden üretme: kredi harcar, gerek yok.
2. `vo/dur.json` toplamı ~2 dk filme sığmalı; uzun gelirse `atempo` ile hafif hızlandır.
3. `core/tts/asr_check.py vo/lines.json vo --lang tr` (gerekirse satırlara `asr` alanı).
4. Kütüphane kökünden (`$LIB`):
   - `node core/render/events.mjs <proje> --size 1080x1920`
   - `node core/render/readcheck.mjs <proje> --size 1080x1920`
   - `node core/render/video.mjs <proje> --size 1080x1920 --fps 24 --out <proje>/out/video.mp4`
   - `$LIB/.venv/bin/python <proje>/mix.py` (LIB ortam değişkeni)
   - `sh core/render/mux.sh <proje>/out/video.mp4 <proje>/out/mix.wav <proje>/yz-bulteni.mp4 24 2` (ffmpeg ≥ 7 gerekir)
5. `.srt`: `events.json` içindeki `vo` olaylarından (`t`, `d`, `text`) yaz; altyazı görüntüye basılmaz.
6. DIRECTOR.md §11 öz-denetimi, sonra MP4 + SRT teslim.

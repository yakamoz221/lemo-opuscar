# Türkçe uyarlama notları

Bu, [lemo-opuscar](https://github.com/lemomo-ai/lemo-opuscar) deposunun gözden geçirilmiş ve Türkçe kullanım için küçük düzeltmeler yapılmış bir kopyasıdır. Kütüphanenin kendisinde (51 "sinematik film stili") dil/kod bakımından bir engel yoktu; yalnızca iki yerde dokümantasyon Çince'ye özel yazılmıştı ve bir fontta gerçek bir glyph (karakter) boşluğu vardı. Aşağıda ne bulundu ve ne değiştirildi var.

## 1) Çevrimiçi TTS (edge-tts) — sadece dokümantasyon sorunu

`core/tts/tts_zh.py` dosyası, adına rağmen (ilk bağlanan dil Çince olduğu için bu isim kalmış) **kod seviyesinde dile bağlı değil**: `--voice` parametresi Microsoft Edge TTS'in verdiği her sesi kabul ediyor, Çince'ye özel bir kontrol yok. Yani Türkçe için:

```
.venv/bin/python core/tts/tts_zh.py lines.json out_dir --voice tr-TR-EmelNeural
# veya
.venv/bin/python core/tts/tts_zh.py lines.json out_dir --voice tr-TR-AhmetNeural
```

çalışır, kod değişikliği gerekmiyordu. Değiştirilen tek şey dokümantasyonun diliydi:

- `TECHNIQUE.md` §4: "Chinese" başlığı "Chinese, Turkish, or any other language Kokoro doesn't cover" olarak genişletildi; Türkçe ses örnekleri eklendi.
- `tools/directory/SECURITY.md`: "narration text sent to Microsoft's speech service" uyarısı artık sadece Çince'ye değil, edge-tts ile seslendirilen her dile (Türkçe dahil) uygulanıyor diye açıkça yazıldı. **Önemli:** bu, metninizin (senaryonuzun) Microsoft'un sunucusuna gönderildiği anlamına geliyor — hangi dilde olursa olsun, kullanmadan önce onay vermeniz gerekiyor (`SECURITY.md`'de olduğu gibi).
- `core/README.md`: font tablosuna İM Fell English'in sadece Latin (Türkçe harfleri değil) kapsadığı notu eklendi (bkz. aşağı).

Kokoro (`core/tts/tts.py`, çevrimdışı) Türkçe'yi hiç desteklemiyor — o yüzden Türkçe narrasyon için pratik seçenek edge-tts (çevrimiçi, Microsoft) olacak.

## 2) IM Fell English fontu — gerçek bir boşluk, düzeltildi/işaretlendi

`core/fonts/fonts.css`'teki unicode-range'leri karşılaştırdım:

- **Fredoka, Lilita One**: hem `latin` hem `latin-ext` alt kümesi var → ğ (U+011F), Ş/ş (U+015E/U+015F), İ (U+0130) dahil, Türkçe sorunsuz render olur.
- **IM Fell English**: sadece `latin` alt kümesi var (Latin Extended-A YOK) → ğ, Ş, ş, İ eksik. Bu harfler geçen bir Türkçe kelime o harfleri kaybeder veya altyazı ortasında tarayıcının varsayılan fontuna düşer.

IM Fell English'i gerçek altyazı/caption metni için kullanan 3 stil düzeltildi (her birinin "## 4. Type & subtitles" bölümüne bir not eklendi):

- `styles/stained-glass/STYLE.md`
- `styles/rubber-hose/STYLE.md`
- `styles/woodcut/STYLE.md`

(`paper-popup` stilinde IM Fell English sadece örnek bir seçenek olarak geçiyor — gerçek altyazılar Fredoka kullanıyor, o yüzden dokunmadım.)

**Çözüm** (kod değişikliği değil, kütüphanenin zaten kullandığı Google Fonts alt kümeleme tekniğinin aynısı): proje klasörünüzün `fonts/` dizinine, `core/fonts/`'un bütünleşik kopyası yerine, projenizin gerçek metnini içeren kendi alt kümenizi indirin:

```
https://fonts.googleapis.com/css2?family=IM+Fell+English:ital@0;1&text=<projenizin ekrandaki gerçek metni, URL-encoded>
```

Bu talimat artık `TECHNIQUE.md` §11'de de yazılı; üç STYLE.md dosyasındaki not da oraya işaret ediyor.

## 3) Kurulumla ilgili bir şey bilmeniz gerekiyor

Bu depo, Claude Code eklentisi (`claude plugin install lemo-opuscar@lemolab`) üzerinden kurulduğunda, `setup.sh` her çalıştığında kütüphaneyi GitHub'daki `main` dalıyla **otomatik senkronize ediyor** (`git fetch` + `git reset --hard FETCH_HEAD`, `lemo.managed=true` olduğu için). Yani eklenti üzerinden kurarsanız, bu yamalı kopya bir sonraki senkronizasyonda kaybolur.

Yamaların kalıcı olması için iki seçenek var:
1. **Bu kopyayı doğrudan kullanın**: depoyu eklenti olarak değil, README'deki "Option 2" (klonla, içinden `claude` çalıştır) yöntemiyle kullanın — `lemo.managed` ayarlanmaz, otomatik senkronizasyon devre dışı kalır.
2. **Kendi fork'unuzu oluşturun**: GitHub'da depoyu fork'layın, bu değişiklikleri fork'unuza uygulayın, eklenti marketplace'ini kendi fork'unuza yönlendirin.

## Paket içeriği hakkında not

Yükleme boyutunu küçük tutmak için her stilin `demo/` klasörü ve `poster.jpg`'si (kütüphanenin varsayılan sparse-checkout'unun da hariç tuttuğu dosyalar), `styleboard/` ve `docs/` klasörleri bu paketten çıkarıldı — bunlar galeri/referans görselleri, render motorunun kendisi için gerekli değiller. `.git` geçmişi de yok. Üretim koduna (`core/`, `styles/*/STYLE.md` ve `.js` dosyaları, `tools/`, `plugin/`) dokunulmadı.

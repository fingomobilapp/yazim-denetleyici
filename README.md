# ÖD Robotu

Bilgi notunu TDK yazım kuralları, sayı/noktalama biçimi ve birim kurallarına göre tarar, takılan yerleri listeler.

**Dosya hiçbir sunucuya gönderilmez.** Sayfa yalnızca kodu yükler, denetim kullanıcının tarayıcısında yapılır.

## Kullanım

- **Word dosyası (.docx):** Dosya yüklenir, bulgular listelenir. Uygulanacak düzeltmeler işaretlenir (hatalar varsayılan olarak seçili, kontrol bulguları seçili değil). **Değişiklikleri izle ile indir** düğmesi, düzeltmelerin Word'ün izlenen değişiklik biçiminde işlendiği yeni bir .docx verir. Word'de *Gözden Geçir > Kabul Et / Reddet* ile tek tek onaylanır. Özgün dosya değişmez.
- **Metin yapıştırma:** Bulgular listelenir; **Düzeltilmiş metni kopyala** seçili düzeltmeleri uygulanmış metni panoya kopyalar.
- Değişikliklerde görünecek ad (Word'de değişikliğin yazarı) sayfada değiştirilebilir; tarayıcı bunu hatırlar.

## Neleri denetler?

- **TDK:** sözcük yazımı (itibarıyla, iş birliği, yurt dışı…), kurum ve dil adlarına gelen ekler, kısaltma ekleri (TCMB'nin, BDDK'ye, GSYH'nın), rakamlara gelen ekler, ay adları, soru eki.
- **Biçim:** saat (14.00), ondalık virgül, boşluk ve noktalama; yalnızca Word dosyasında künye satırlarının *Sonra* boşluğu ve başlığın *Önce* boşluğu.
- **Birim:** `birim-kurallari.js` dosyasındaki sözcük listesi, GSYİH → GSYH, yüzde işareti, "bp" yerine "baz puan", yüklem tutarlılığı (notun çoğu "-mıştır" ise "-dı, -maktadır, -mış, -yor" ile biten yüklemler işaretlenir), sayı yazımı (süre ve sayım ifadelerinde 10'dan küçükler yazıyla, 10 ve üstü rakamla: ilk dört ay, ilk 11 ay; tablolar ve istisna listesi hariç).

## Dosyalar

| Dosya | Görevi | Düzenlenir mi? |
|---|---|---|
| `birim-kurallari.js` | **Birim kuralları ve ayarlar** | Evet, rutin değişiklikler burada |
| `tdkkuralları.js` | TDK ve biçim kuralları (kod gerektirir) | Nadiren |
| `index.html` | Sayfanın kendisi | Gerekmez |
| `motor.js` | Kuralları uygulayan ve Word dosyasını işleyen kod | Gerekmez |
| `vendor/jszip.min.js` | .docx dosyasını açan kütüphane (MIT lisanslı) | Hayır |
| `ornek/ornek_not.docx` | Deneme için hatalı örnek not | İsteğe bağlı |

## GitHub'a yükleme ve link alma

1. github.com'da oturum açın, sağ üstteki **+** düğmesinden **New repository** seçin.
2. Depoya bir ad verin (ör. `yazim-denetleyici`), **Public** seçili kalsın, **Create repository** deyin.
   - Ücretsiz planda GitHub Pages yalnızca herkese açık depolarda çalışır. Depoda not değil, yalnızca kod ve kurallar olacağı için sorun yoktur.
3. Açılan sayfada **uploading an existing file** bağlantısına tıklayın.
4. Zip'ten çıkardığınız klasörün **içindekileri** (dosyalar ve `vendor`, `ornek` klasörleri) sürükleyip bırakın, **Commit changes** deyin.
5. Depoda **Settings → Pages** bölümüne gidin.
   - **Source**: Deploy from a branch
   - **Branch**: `main`, klasör `/ (root)` → **Save**
6. 1–2 dakika sonra aynı sayfada link görünür: `https://KULLANICIADI.github.io/yazim-denetleyici/`

> İlk iş olarak linki **iş bilgisayarınızdan** açıp `ornek/ornek_not.docx` ile deneyin. Kurum ağı `github.io` adresini engelliyorsa klasörü zip olarak paylaşıp `index.html` dosyasına çift tıklayarak da kullanabilirsiniz (internet gerekmez).

## Kuralları değiştirme

1. GitHub'da `birim-kurallari.js` dosyasını açın, sağ üstteki kalem simgesine (**Edit**) tıklayın.
2. Değişikliği yapın, **Commit changes** deyin. Birkaç dakika içinde herkesin linki yeni kuralları kullanır.

### Sözcük ve ifade düzeltmesi eklemek

Dosyanın başındaki listeye bir satır eklenir:

```
yanlış => doğru
yanlış => doğru            # açıklama (isteğe bağlı)
plân* => plan              # * : ek almış halleri de yakalar (plânlama, plânın…)
? hala => hâlâ             # ? : "Kontrol" olarak işaretlenir, otomatik seçilmez
```

- Büyük/küçük harf otomatik yönetilir: `iran savaşı => İran Savaşı` kuralı "İran savaşı" yazımını yakalar, doğru yazılmış "İran Savaşı"na dokunmaz.
- Bir kuralı kapatmak için satırın başına `#` koyun.
- Satır anlaşılamazsa sayfanın üstünde hangi satır olduğu yazar.

### Ayarlar

Aynı dosyanın altındaki `BIRIM_AYARLARI` bölümünde:

- `yuklemTutarliligi: true/false` yüklem denetimini açar/kapatır.
- `kunye.satirSonrasiBosluk` ve `baslik.oncesiBosluk` boşlukları nokta (nk) cinsinden belirler.
- `kunye.etiketler` künye satırlarının başındaki etiketlerdir.
- `sayiYazimi.birimler` sayı kuralının uygulandığı sözcüklerdir (ay, hafta, gün…); `sayiYazimi.istisnalar` rakamla kalacak kalıplardır (13 haftalık yıllıklandırılmış).
- `bazPuan: false` "bp" denetimini kapatır.

### Künye nasıl tanınır?

Notun başındaki "Etiket: değer" biçimindeki satırlar (ör. "Hazırlayan: …", "Tarih: …") ya da `kunye.etiketler` listesindeki sözcüklerle başlayan satırlar künye sayılır. Künyeden sonraki ilk dolu paragraf başlıktır. Sonuç ekranında hangi satırların künye ve başlık olarak algılandığı yazar; yanlışsa etiket listesini güncelleyin.

## Sınırlar

- Yalnızca kural listesindeki durumları yakalar; anlatım bozukluğu, cümle yapısı ve üslup sorunlarını yakalamaz.
- Özel adları kendiliğinden bilmez; "İran Savaşı" gibi her özel ad listeye eklenmelidir.
- **Kontrol** seviyesindeki bulgular kesin hata değildir (ör. `3.5` bir bölüm numarası olabilir); bakıp karar verin.
- Yüklem denetimi cümle sonundaki sözcüğün ekine bakar; "-yor" ile biten yüklemler için öneri üretmez, elle düzeltilir.
- Eski `.doc` biçimi okunmaz; Word'de `.docx` olarak kaydedin.
- Gövde metni, tablolar, metin kutuları ve dipnotlar taranır; üst bilgi ve alt bilgi taranmaz.
- İzlenen değişiklikler açıksa silinmiş metin taranmaz, eklenmiş metin taranır.

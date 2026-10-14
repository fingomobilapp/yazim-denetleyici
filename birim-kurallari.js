/*
 * BİRİM KURALLARI VE AYARLARI
 * ===========================
 * Amirlerden gelen düzeltmeleri bu dosyaya eklersiniz. Kod bilgisi gerekmez.
 *
 * Dosyayı GitHub'da açın, kalem simgesine (Edit) tıklayın, değişikliği yapıp
 * "Commit changes" deyin. Birkaç dakika içinde herkesin linki yeni kuralları kullanır.
 */

/*
 * 1) SÖZCÜK VE İFADE DÜZELTMELERİ
 * -------------------------------
 * Her satıra bir kural:      yanlış => doğru
 * Açıklama eklemek için:     yanlış => doğru   # açıklama
 * Ek almış halleri için *:   plân* => plan        (plânlama, plânın... da yakalanır)
 * Kesin değilse başa ?:      ? hala => hâlâ       (Kontrol olarak işaretlenir, otomatik seçilmez)
 *
 * Büyük/küçük harf otomatik yönetilir: "iran savaşı => İran Savaşı" kuralı
 * "İran savaşı" yazımını da yakalar, doğru yazılmış "İran Savaşı"na dokunmaz.
 * # ile başlayan satırlar not satırıdır, dikkate alınmaz.
 */
var BIRIM_KURALLARI = `
# --- Şapka (düzeltme işareti) ---
ikâme* => ikame            # Şapkasız yazılır.
plân* => plan              # Şapkasız yazılır.
halinde* => hâlinde        # "Hâl" sözcüğü şapkalı yazılır.
hale => hâle               # "Hâl" sözcüğü şapkalı yazılır.
haline => hâline           # "Hâl" sözcüğü şapkalı yazılır.
halini => hâlini           # "Hâl" sözcüğü şapkalı yazılır.
imkan* => imkân            # Şapkalı yazılır (imkânı, imkânsız).

# --- Özel adlar ve terimler ---
PMI endeksi* => PMI Endeksi
İran savaşı* => İran Savaşı
13 haftalık yıllıklandırılmış => 13 haftalık yıllıklandırılmış   # "Haftalık" küçük harfle yazılır.
no'lu => numaralı          # "no'lu" yerine "numaralı" yazılır.
no’lu => numaralı          # (Word'ün eğik kesme işaretli yazımı)
nolu => numaralı
`;

/*
 * 2) AYARLAR
 * ----------
 * Değerleri değiştirebilirsiniz; true = açık, false = kapalı.
 * Boşluklar nokta (nk / pt) cinsindendir.
 */
var BIRIM_AYARLARI = {
  // Notun büyük çoğunluğu "-mıştır" (görülmüştür, değerlendirilmiştir) ile bitiyorsa
  // "-dı, -maktadır, -mış, -mıştı, -yor" ile biten yüklemler işaretlenir.
  yuklemTutarliligi: true,
  yuklemCogunlukOrani: 0.5,   // yüklemlerin yarısından fazlası "-mıştır" ise devreye girer
  yuklemEnAzSayi: 3,          // notta en az bu kadar fiil yüklem olmalı

  // Sayı yazımı: "enBuyukYazi"ya kadar olan sayılar yazıyla, daha büyükleri rakamla
  // (ilk dört ay, ilk 11 ay). Yalnızca aşağıdaki birimlerden önce gelen sayılara uygulanır;
  // yüzde, tutar, yıl gibi verilere ve tablolara dokunmaz.
  sayiYazimi: {
    etkin: true,
    enBuyukYazi: 9,          // 9'a kadar yazıyla, 10 ve üstü rakamla
    birimler: ['ay', 'hafta', 'gün', 'yıl', 'çeyrek', 'dönem', 'kez', 'defa'],
    // Rakamla kalması gereken kalıplar (büyük/küçük harf fark etmez):
    istisnalar: ['13 haftalık yıllıklandırılmış']
  },

  // "bp" / "Bp" / "bps" yerine "baz puan" yazılır (50 bp → 50 baz puan, bp'lik → baz puanlık).
  bazPuan: true,

  // Künye: notun başındaki "Etiket: değer" satırları (Hazırlayan: ..., Tarih: ...).
  // Aşağıdaki etiketlerle başlayan satırlar iki nokta olmasa da künye sayılır.
  kunye: {
    etkin: true,
    etiketler: ['Hazırlayan', 'Hazırlayanlar', 'Tarih', 'Birim', 'Konu', 'Sayı', 'İlgi', 'Dağıtım', 'Kontrol Eden', 'Onaylayan'],
    satirSonrasiBosluk: 0      // künye satırlarında "Sonra" boşluğu
  },

  // Başlık: künyeden sonraki ilk paragraf.
  baslik: {
    etkin: true,
    oncesiBosluk: 12           // başlıkta "Önce" boşluğu
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { BIRIM_KURALLARI: BIRIM_KURALLARI, BIRIM_AYARLARI: BIRIM_AYARLARI };
}

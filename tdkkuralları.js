/*
 * KURAL LİSTESİ
 * =============
 * Denetleyicinin uyguladığı tüm kurallar bu dosyadadır.
 * Yeni kural eklemek için ilgili bölümün sonuna bir satır eklemeniz yeterlidir.
 *
 * EN KOLAY YOL: kelime('yanlış yazım', 'doğru yazım', 'açıklama', { seçenekler })
 *
 *   kelime('itibariyle', 'itibarıyla', 'TDK yazımı budur.'),
 *   kelime('yurtdışı', 'yurt dışı', 'Ayrı yazılır.', { ekli: true }),
 *   kelime('akabinde', 'ardından', 'Birim tercihi.', { kategori: 'Birim' }),
 *
 *   Seçenekler (hepsi isteğe bağlı):
 *     kategori: 'TDK' | 'Biçim' | 'Birim'   (varsayılan: 'TDK')
 *     seviye:   'hata' | 'kontrol'           (varsayılan: 'hata')
 *               'kontrol' = kesin hata değil, bakılması gereken yer
 *     ekli:     true  -> ek almış hallerini de yakalar (yurtdışından, yurtdışında...)
 *
 *   Büyük/küçük harf farkı otomatik yönetilir: 'itibariyle' kuralı
 *   'İtibariyle' ve 'İTİBARİYLE' yazımlarını da yakalar.
 *
 * İLERİ DÜZEY: kural({ ... desen: /düzenli ifade/ ... })  (örnekler aşağıda)
 *
 * Her satırın sonundaki virgülü unutmayın. Dosyayı kaydettikten sonra
 * sayfayı yenileyin; kural sayısı sayfanın altında görünür.
 */
(function (kok) {
  'use strict';

  var D = (typeof module !== 'undefined' && module.exports) ? require('./motor.js') : kok.Denetleyici;
  var kelime = D.kelime;
  var kural = D.kural;

  var KESME = "['’]"; // Word düz kesme işaretini ’ işaretine çevirdiği için ikisi de aranır.
  var AYLAR = ['ocak', 'şubat', 'mart', 'nisan', 'mayıs', 'haziran', 'temmuz', 'ağustos', 'eylül', 'ekim', 'kasım', 'aralık'];
  function buyukIlk(s) { return s.charAt(0).toLocaleUpperCase('tr-TR') + s.slice(1); }

  // Belgede eğik kesme (’) kullanılıyorsa öneride de o kullanılır.
  function kesmeSec(paragraf) { return paragraf.indexOf('’') >= 0 ? '’' : "'"; }

  // Harfleri tek tek okunan kısaltmanın ekini son harfin okunuşuna uydurur.
  // H "ha" okunur (kalın ünlü); diğer ünsüzler "be, ce, de, ke..." (ince ünlü).
  function kisaltmaEki(kisaltma, ek) {
    var kalin = kisaltma.slice(-1) === 'H';
    var donustur = kalin
      ? { e: 'a', i: 'ı', ü: 'ı', u: 'ı', ö: 'a', o: 'a' }
      : { a: 'e', ı: 'i', u: 'i', ü: 'i', o: 'e', ö: 'e' };
    var uydur = function (s) { return s.replace(/[aeıioöuü]/g, function (c) { return donustur[c] || c; }); };
    var ki = '';
    if (/.ki$/.test(ek)) { ki = 'ki'; ek = ek.slice(0, -2); } // "-ki" eki uyuma girmez: GSYH'daki
    var g = kalin ? ['nın', 'yı', 'ya'] : ['nin', 'yi', 'ye'];
    var sonuc;
    if (/^[ıiuü]n/.test(ek)) sonuc = g[0] + uydur(ek.slice(2));
    else if (/^[ıiuü]/.test(ek)) sonuc = g[1] + uydur(ek.slice(1));
    else if (/^[ae]/.test(ek)) sonuc = g[2] + uydur(ek.slice(1));
    else sonuc = uydur(ek);
    return sonuc + ki;
  }

  // ======================================================================
  // 1) TDK — SÖZCÜK YAZIMI
  // ======================================================================
  var TDK_SOZCUK = [
    kelime('itibariyle', 'itibarıyla', '"İtibarıyla" biçiminde yazılır.'),
    kelime('işbirli', 'iş birli', '"İş birliği" ayrı yazılır.', { ekli: true }),
    kelime('yurtdış', 'yurt dış', '"Yurt dışı" ayrı yazılır.', { ekli: true }),
    kelime('yurtiç', 'yurt iç', '"Yurt içi" ayrı yazılır.', { ekli: true }),
    kelime('alt yapı', 'altyapı', '"Altyapı" bitişik yazılır.', { ekli: true }),
    kelime('üst yapı', 'üstyapı', '"Üstyapı" bitişik yazılır.', { ekli: true }),
    kelime('kamu oyu', 'kamuoyu', '"Kamuoyu" bitişik yazılır.', { ekli: true }),
    kelime('hiç bir', 'hiçbir', '"Hiçbir" bitişik yazılır.'),
    kelime('hiçkimse', 'hiç kimse', '"Hiç kimse" ayrı yazılır.'),
    kelime('bir çok', 'birçok', '"Birçok" bitişik yazılır.'),
    kelime('bir kaç', 'birkaç', '"Birkaç" bitişik yazılır.'),
    kelime('her hangi', 'herhangi', '"Herhangi" bitişik yazılır.'),
    kelime('herhangibir', 'herhangi bir', '"Herhangi bir" ayrı yazılır.'),
    kelime('birşey', 'bir şey', '"Bir şey" ayrı yazılır.', { ekli: true }),
    kelime('herşey', 'her şey', '"Her şey" ayrı yazılır.', { ekli: true }),
    kelime('herbir', 'her bir', '"Her bir" ayrı yazılır.'),
    kelime('herzaman', 'her zaman', '"Her zaman" ayrı yazılır.'),
    kelime('hergün', 'her gün', '"Her gün" ayrı yazılır.'),
    kelime('birkez', 'bir kez', '"Bir kez" ayrı yazılır.'),
    kelime('birden bire', 'birdenbire', '"Birdenbire" bitişik yazılır.'),
    kelime('pekçok', 'pek çok', '"Pek çok" ayrı yazılır.'),
    kelime('sözkonusu', 'söz konusu', '"Söz konusu" ayrı yazılır.'),
    kelime('yanısıra', 'yanı sıra', '"Yanı sıra" ayrı yazılır.'),
    kelime('ardarda', 'art arda', '"Art arda" biçiminde yazılır.'),
    kelime('şuanda', 'şu anda', '"Şu anda" ayrı yazılır.'),
    kelime('şuan', 'şu an', '"Şu an" ayrı yazılır.'),
    kelime('yada', 'ya da', '"Ya da" bağlacı ayrı yazılır.'),
    kelime('tabi ki', 'tabii ki', '"Elbette" anlamındaki sözcük "tabii" biçiminde yazılır.'),
    kelime('yanlız', 'yalnız'),
    kelime('yalnış', 'yanlış', null, { ekli: true }),
    kelime('herkez', 'herkes', null, { ekli: true }),
    kelime('malesef', 'maalesef'),
    kelime('orjinal', 'orijinal', null, { ekli: true }),
    kelime('döküman', 'doküman', null, { ekli: true }),
    kelime('tesbit', 'tespit', null, { ekli: true }),
    kelime('klavuz', 'kılavuz', null, { ekli: true }),
    kelime('dolaysıyla', 'dolayısıyla'),
    kelime('mütevazi', 'mütevazı'),
    kelime('laboratuar', 'laboratuvar', null, { ekli: true }),
    kelime('konsensus', 'konsensüs', null, { ekli: true }),
    kelime('süpriz', 'sürpriz', null, { ekli: true }),
    kelime('ana para', 'anapara',
      '"Anapara" (borcun faizsiz tutarı) bitişik yazılır. "Ana para birimi" gibi kullanımlarda sorun yoktur.',
      { ekli: true, seviye: 'kontrol' }),
    kelime('bu gün', 'bugün',
      '"Bugün" bitişik yazılır. "Bu gün" yalnızca "o gün"e karşıt "bu gün" anlamında ayrı yazılır.',
      { ekli: true, seviye: 'kontrol' }),
    kural({
      id: 'öngörü',
      aciklama: '"Öngörü" bitişik yazılır ("ön görüşme" ayrıdır).',
      ornek: 'ön görü → öngörü',
      desen: /(?<![\p{L}\p{N}])([öÖ]n)\s+(görü)(?!ş)(\p{L}*)/,
      oneri: function (m) { return m[1] + m[2] + m[3]; }
    })
  ];

  // ======================================================================
  // 2) TDK — EKLER, KESME İŞARETİ, BÜYÜK HARF, SORU EKİ
  // ======================================================================
  var TDK_KURAL = [
    kural({
      id: 'kurum-adi-kesme',
      aciklama: 'Kurum, kuruluş ve kurul adlarına gelen ekler kesme işaretiyle ayrılmaz.',
      ornek: "Merkez Bankası'nın → Merkez Bankasının",
      desen: new RegExp('(?<=\\p{Lu}\\p{Ll}*\\s)(Bankası|Kurumu|Kurulu|Bakanlığı|Başkanlığı|Müdürlüğü|Ajansı|Borsası|Odası|Birliği|Fonu|Meclisi|Üniversitesi|Teşkilatı|Konseyi|Komitesi|Komisyonu|Vakfı|Derneği|Sandığı)' + KESME + '(\\p{L}+)'),
      oneri: function (m) { return m[1] + m[2]; }
    }),
    kural({
      id: 'dil-adi-kesme',
      aciklama: 'Dil adlarına (Türkçe, İngilizce vb.) gelen ekler kesme işaretiyle ayrılmaz.',
      ornek: "Türkçe'nin → Türkçenin",
      desen: new RegExp('(?<![\\p{L}])(Türkçe|İngilizce|Almanca|Fransızca|Arapça|Rusça|Çince|Farsça|İspanyolca|İtalyanca|Japonca|Yunanca|Kürtçe)' + KESME + '(\\p{L}+)'),
      oneri: function (m) { return m[1] + m[2]; }
    }),
    kural({
      id: 'kisaltma-ek-uyumu',
      aciklama: 'Kısaltmalara gelen ekler, son harfin okunuşuna uyar. Harfleri tek tek okunan kısaltmalarda son harf "be, de, ke, me..." gibi ince okunur (TCMB\'nin, BDDK\'ye); birimde "H" harfi "ha" okunduğundan H ile bitenler kalın ek alır (GSYH\'nın, GSYH\'ya).',
      ornek: "TCMB'nın → TCMB'nin, BDDK'ya → BDDK'ye, GSYH'nin → GSYH'nın",
      desen: new RegExp('(?<![\\p{L}\\p{N}])([BCÇDFGĞHJKLMNPRSŞTVYZ]{2,})(' + KESME + ')(\\p{L}+)'),
      kosul: function (m) {
        var ek = m[3];
        if (ek !== ek.toLocaleLowerCase('tr-TR')) return false; // BÜYÜK HARFLİ başlıklar atlanır
        return kisaltmaEki(m[1], ek) !== ek;
      },
      oneri: function (m) { return m[1] + m[2] + kisaltmaEki(m[1], m[3]); }
    }),
    kural({
      id: 'rakam-ek-kesme',
      seviye: 'kontrol',
      aciklama: 'Rakamlara getirilen ekler kesme işaretiyle ayrılır.',
      ornek: "2026da → 2026'da, 1inci → 1'inci",
      desen: /(?<![\p{L}\p{N}.,])(\d+)([a-zçğıöşü]{1,6})(?![\p{L}])/,
      kosul: function (m) {
        var birimler = ['m', 'cm', 'mm', 'km', 'kg', 'g', 'gr', 'mg', 'ml', 'l', 'lt', 'gb', 'mb', 'kb', 'tb',
          'kw', 'kwh', 'mw', 'mwh', 'bp', 'bps', 'mn', 'mlr', 'x', 'sn', 'dk', 's', 'h', 'px', 'pt'];
        return birimler.indexOf(m[2]) < 0;
      },
      oneri: function (m, p) { return m[1] + kesmeSec(p) + m[2]; }
    }),
    kural({
      id: 'tarih-ay-buyuk',
      aciklama: 'Belli bir tarih bildiren ay adları büyük harfle başlar.',
      ornek: '14 ekim 2026 → 14 Ekim 2026',
      desen: new RegExp('(?<!\\d)(\\d{1,2})(\\s+)(' + AYLAR.join('|') + ')(?![\\p{L}])'),
      oneri: function (m) { return m[1] + m[2] + buyukIlk(m[3]); }
    }),
    kural({
      id: 'tarihsiz-ay-kucuk',
      seviye: 'kontrol',
      aciklama: 'Belli bir tarih bildirmeyen ay adları küçük harfle yazılır.',
      ornek: 'geçen Ekim ayında → geçen ekim ayında',
      desen: new RegExp('(?<=[\\p{Ll},][ ]+)(' + AYLAR.map(buyukIlk).join('|') + ')(?=[ ]+ay)'),
      oneri: function (m) { return m[1].toLocaleLowerCase('tr-TR'); }
    }),
    kural({
      id: 'soru-eki',
      aciklama: 'Soru eki "mı, mi, mu, mü" ayrı yazılır.',
      ornek: 'değilmi → değil mi',
      desen: /(?<![\p{L}])(var|yok|değil|olur|olmaz|mümkün|doğru|gerekli|yeterli)(mı|mi|mu|mü)(?![\p{L}])/,
      oneri: function (m) { return m[1] + ' ' + m[2]; }
    }),
    kural({
      id: 'ki-sifat',
      seviye: 'kontrol',
      aciklama: 'Sıfat yapan "-ki" eki bitişik yazılır (bağlaç olan "ki" ayrı yazılır).',
      ornek: 'aşağıda ki tablo → aşağıdaki tablo',
      desen: /(?<![\p{L}])(\p{L}{2,}[dt][ae])\s+ki(?![\p{L}])/,
      oneri: function (m) { return m[1] + 'ki'; }
    }),
    kural({
      id: 'vb-kisaltma',
      aciklama: '"ve benzeri" kısaltması "vb." biçiminde yazılır.',
      ornek: 'v.b. → vb.',
      desen: /(?<![\p{L}])[vV]\.\s?[bB]\./,
      oneri: 'vb.'
    }),
    kural({
      id: 'kisaltma-nokta',
      aciklama: '"vb." ve "vs." kısaltmaları noktayla yazılır.',
      ornek: 'vb → vb.',
      desen: /(?<![\p{L}])(vb|vs)(?![\p{L}.])/,
      oneri: function (m) { return m[1] + '.'; }
    }),
    kural({
      id: 'sozcuk-tekrari',
      aciklama: 'Aynı sözcük art arda iki kez yazılmış.',
      ornek: 've ve → ve',
      desen: /(?<![\p{L}])(ve|ile|için|veya|ancak|ise|olarak|da|de|bu|ki|olan)\s+\1(?![\p{L}])/,
      oneri: function (m) { return m[1]; }
    })
  ];

  // ======================================================================
  // 3) BİÇİM — SAYI, SAAT, BOŞLUK, NOKTALAMA
  // ======================================================================
  var BICIM = [
    kural({
      id: 'saat-iki-nokta',
      kategori: 'Biçim',
      aciklama: 'Saat ile dakika arasına nokta konur.',
      ornek: "13:00'te → 13.00'te",
      desen: /(?<![\d.,:])([01]?\d|2[0-3]):([0-5]\d)(?![\d:])/,
      oneri: function (m) { return m[1] + '.' + m[2]; }
    }),
    kural({
      id: 'ondalik-nokta',
      kategori: 'Biçim',
      seviye: 'kontrol',
      aciklama: 'Türkçede ondalık ayırıcı virgüldür (3,5). Bu bir saat (14.30) ya da bölüm numarasıysa sorun yoktur.',
      ornek: 'yüzde 3.5 → yüzde 3,5',
      desen: /(?<![\d.,])(\d+)\.(\d{1,2})(?![\d.])/,
      kosul: function (m, p) {
        // Paragraf başındaki bölüm numaraları (2.1 Kredi Büyümesi) atlanır.
        if (p.slice(0, m.index).trim() === '') return false;
        // Ekli saat (14.30'da) atlanır.
        var tamsayi = parseInt(m[1], 10);
        var sonrasi = p.slice(m.index + m[0].length);
        if (m[2].length === 2 && tamsayi <= 23 && /^['’]/.test(sonrasi)) return false;
        if (/saat\s*$/i.test(p.slice(0, m.index))) return false;
        return true;
      },
      oneri: function (m) { return m[1] + ',' + m[2]; }
    }),
    kural({
      id: 'cift-bosluk',
      kategori: 'Biçim',
      aciklama: 'Sözcükler arasında birden fazla boşluk var.',
      ornek: 'iki  boşluk → tek boşluk',
      desen: /(?<=\S)[  ]{2,}(?=\S)/,
      oneri: ' '
    }),
    kural({
      id: 'noktalama-oncesi-bosluk',
      kategori: 'Biçim',
      aciklama: 'Nokta, virgül, noktalı virgül, iki nokta, soru ve ünlem işaretinden önce boşluk bırakılmaz.',
      ornek: 'artmıştır . → artmıştır.',
      desen: /(?<=[\p{L}\p{N})\]"”’'])[  ]+([,;:!?]|\.(?!\.))/,
      oneri: function (m) { return m[1]; }
    }),
    kural({
      id: 'virgul-sonrasi-bosluk',
      kategori: 'Biçim',
      aciklama: 'Virgülden sonra bir boşluk bırakılır.',
      ornek: 'kredi,mevduat → kredi, mevduat',
      desen: /,(\p{L})/,
      oneri: function (m) { return ', ' + m[1]; }
    })
  ];


  // ======================================================================
  // 4) BİRİM KURALLARI
  // ======================================================================
  // Sözcük düzeltmeleri ve ayarlar birim-kurallari.js dosyasındadır;
  // yeni düzeltmeleri oraya ekleyin. Aşağıdakiler kod gerektiren birim kurallarıdır.
  var BIRIM_KAYNAK = (typeof module !== 'undefined' && module.exports)
    ? require('./birim-kurallari.js')
    : { BIRIM_KURALLARI: kok.BIRIM_KURALLARI, BIRIM_AYARLARI: kok.BIRIM_AYARLARI };
  var AYAR = BIRIM_KAYNAK.BIRIM_AYARLARI || {};
  var birimListesi = D.birimListesiOku(BIRIM_KAYNAK.BIRIM_KURALLARI || '');

  // --- Yüklem tutarlılığı -------------------------------------------------
  // Dört yönlü ünlü uyumu: kökün son ünlüsüne göre ı, i, u, ü.
  function dortlu(kok) {
    var m = kok.toLocaleLowerCase('tr-TR').match(/[aeıioöuü](?=[^aeıioöuü]*$)/);
    return { a: 'ı', ı: 'ı', o: 'u', u: 'u', e: 'i', i: 'i', ö: 'ü', ü: 'ü' }[m ? m[0] : 'e'];
  }
  function mistir(kok) { var h = dortlu(kok); return kok + 'm' + h + 'şt' + h + 'r'; }

  // Cümle sonundaki yüklemin biçimi ve "-mıştır" önerisi.
  var YUKLEM_TURLERI = [
    { tur: 'yor', ad: '-yor', desen: /yor(du|dı|lar|dular|dılar)?$/, oneri: null },
    { tur: 'mistir', ad: '-mıştır', desen: /m[ıiuü]şt[ıiuü]r(lar|ler)?$/ },
    { tur: 'misti', ad: '-mıştı', desen: /m[ıiuü]şt[ıiuü]$/, oneri: function (w) { return w + 'r'; } },
    { tur: 'maktadir', ad: '-maktadır', desen: /m[ae]kt[ae]d[ıi]r(lar|ler)?$/,
      oneri: function (w) {
        if (/(lar|ler)$/.test(w)) return null;
        return mistir(w.replace(/m[ae]kt[ae]d[ıi]r$/, ''));
      } },
    { tur: 'mis', ad: '-mış', desen: /m[ıiuü]ş$/, oneri: function (w) { return w + 't' + dortlu(w) + 'r'; } },
    { tur: 'di', ad: '-dı', desen: /[dt][ıiuü](lar|ler)?$/,
      oneri: function (w) { return /(lar|ler)$/.test(w) ? null : mistir(w.slice(0, -2)); } }
  ];
  // Cümle sonunda geçebilen, "-dı" ile biten ama fiil olmayan sözcükler.
  var DI_ISTISNA = ['kredi', 'yedi', 'kadı', 'ordu', 'hindi', 'kendi', 'şimdi', 'toplantı', 'kesinti', 'sıkıntı', 'bağlantı',
    'uzantı', 'belirti', 'birikinti', 'çalkantı', 'kalıntı', 'parti'];

  function yuklemTuru(sozcuk) {
    var w = sozcuk.toLocaleLowerCase('tr-TR');
    if (w.length < 4) return null;
    for (var i = 0; i < YUKLEM_TURLERI.length; i++) {
      var t = YUKLEM_TURLERI[i];
      if (t.desen.test(w)) {
        if (t.tur === 'di' && DI_ISTISNA.indexOf(w) >= 0) return null;
        return t;
      }
    }
    return null;
  }

  var yuklemKurali = D.belgeKurali({
    id: 'yuklem-tutarliligi',
    kategori: 'Birim',
    seviye: 'kontrol',
    aciklama: 'Notta yüklemlerin çoğu "-mıştır" biçimindeyse (görülmüştür, değerlendirilmiştir) diğer yüklemler de bu biçimde olmalı.',
    ornek: 'arttı → artmıştır, görülmektedir → görülmüştür',
    belge: function (paragraflar) {
      var adaylar = [];
      paragraflar.forEach(function (p, pi) {
        var metin = typeof p === 'string' ? p : p.metin;
        if (!metin || p.tablo) return;
        // Cümle sonu: sözcük + (kapanış tırnak/parantez) + . ! ? ve ardından boşluk ya da paragraf sonu
        var r = /(\p{L}+)["”’')\]]*[.!?…](?=\s|$)/gu;
        var m;
        while ((m = r.exec(metin)) !== null) {
          var t = yuklemTuru(m[1]);
          if (t) adaylar.push({ paragraf: pi, bas: m.index, son: m.index + m[1].length, sozcuk: m[1], tur: t });
        }
      });
      var toplam = adaylar.length;
      var mistirSayisi = adaylar.filter(function (a) { return a.tur.tur === 'mistir'; }).length;
      var oran = AYAR.yuklemCogunlukOrani == null ? 0.5 : AYAR.yuklemCogunlukOrani;
      var enAz = AYAR.yuklemEnAzSayi == null ? 3 : AYAR.yuklemEnAzSayi;
      if (toplam < enAz || mistirSayisi / toplam <= oran) return [];
      return adaylar.filter(function (a) { return a.tur.tur !== 'mistir'; }).map(function (a) {
        var oneri = a.tur.oneri ? a.tur.oneri(a.sozcuk) : null;
        return {
          paragraf: a.paragraf, bas: a.bas, son: a.son, oneri: oneri,
          aciklama: 'Notta ' + toplam + ' fiil yüklemin ' + mistirSayisi + ' tanesi "-mıştır" biçiminde; bu yüklem "' +
            a.tur.ad + '" biçiminde.' + (oneri ? '' : ' Otomatik öneri üretilemedi, elle düzeltin.')
        };
      });
    }
  });

  var BIRIM = birimListesi.kurallar.concat([
    kural({
      id: 'gsyh',
      kategori: 'Birim',
      aciklama: '"GSYİH" yerine "GSYH" yazılır; ekler H\'nin "ha" okunuşuna göre kalın ünlüyle gelir.',
      ornek: "GSYİH'nin → GSYH'nın",
      desen: new RegExp('(?<![\\p{L}\\p{N}])GSY[İI]H(?:(' + KESME + ')(\\p{L}+))?(?![\\p{L}\\p{N}])'),
      oneri: function (m) { return 'GSYH' + (m[1] ? m[1] + kisaltmaEki('GSYH', m[2]) : ''); }
    }),
    kural({
      id: 'yuzde-isareti',
      kategori: 'Birim',
      aciklama: 'Notlarda yüzde işareti yerine "yüzde" sözcüğü yazılır. (TDK\'ye göre işaret kullanılırsa sayıdan önce gelir: %25.)',
      ornek: "%25 → yüzde 25, 25% → yüzde 25",
      desen: /%[  ]?(\d+(?:[.,]\d+)*)|(?<![\d.,])(\d+(?:[.,]\d+)*)[  ]?%/,
      oneri: function (m) { return 'yüzde ' + (m[1] || m[2]); }
    })
  ]);
  if (AYAR.yuklemTutarliligi !== false) BIRIM.push(yuklemKurali);

  // --- Sayı yazımı: sınıra kadar rakamla, üstü yazıyla -------------------
  var BIRLER = ['', 'bir', 'iki', 'üç', 'dört', 'beş', 'altı', 'yedi', 'sekiz', 'dokuz'];
  var ONLAR = ['', 'on', 'yirmi', 'otuz', 'kırk', 'elli', 'altmış', 'yetmiş', 'seksen', 'doksan'];
  function sayiYazi(n) {
    var s = [];
    var bin = Math.floor(n / 1000), yuz = Math.floor((n % 1000) / 100), on = Math.floor((n % 100) / 10), bir = n % 10;
    if (bin) { if (bin > 1) s.push(sayiYazi(bin)); s.push('bin'); }
    if (yuz) { if (yuz > 1) s.push(BIRLER[yuz]); s.push('yüz'); }
    if (on) s.push(ONLAR[on]);
    if (bir) s.push(BIRLER[bir]);
    return s.join(' ');
  }
  var SAYI = AYAR.sayiYazimi || {};
  if (SAYI.etkin !== false) {
    // enBuyukYazi'ya kadar olan sayılar yazıyla, daha büyükleri rakamla.
    var esik = SAYI.enBuyukYazi == null ? 9 : SAYI.enBuyukYazi;
    var birimDeseni = (SAYI.birimler || ['ay', 'hafta', 'gün', 'yıl']).map(D.ifadeDeseni).join('|');
    var istisnalar = (SAYI.istisnalar || []).map(function (s) { return new RegExp('^' + D.ifadeDeseni(s.trim()), 'u'); });
    var istisnaMi = function (p, bas) {
      var kalan = p.slice(bas);
      return istisnalar.some(function (r) { return r.test(kalan); });
    };
    var BIRIM_ONU = '(?=\\s+(?:' + birimDeseni + '))';

    // Küçük sayılar yazıya: ilk 4 ay → ilk dört ay
    BIRIM.push(kural({
      id: 'sayi-yaziyla',
      kategori: 'Birim',
      aciklama: (esik + 1) + '\'dan küçük sayılar (süre ve sayım ifadelerinde) yazıyla yazılır.',
      ornek: 'ilk 4 ayda → ilk dört ayda',
      desen: new RegExp('(?<![\\p{L}\\p{N}.,])(\\d{1,3})' + BIRIM_ONU),
      kosul: function (m, p, paragraf) {
        if (paragraf && paragraf.tablo) return false; // tablolar denetlenmez
        var n = parseInt(m[1], 10);
        return n >= 1 && n <= esik && !istisnaMi(p, m.index);
      },
      oneri: function (m, p) {
        var yazi = sayiYazi(parseInt(m[1], 10));
        // Cümle başındaysa büyük harfle başlar.
        return /(^|[.!?]\s+)$/.test(p.slice(0, m.index)) ? buyukIlk(yazi) : yazi;
      }
    }));

    // Büyük sayılar rakamla: ilk on bir ay → ilk 11 ay
    var buyukler = [];
    for (var n = esik + 1; n <= 999; n++) buyukler.push({ yazi: sayiYazi(n), sayi: n });
    buyukler.sort(function (a, b) { return b.yazi.length - a.yazi.length; });
    var yaziToSayi = {};
    buyukler.forEach(function (k) { yaziToSayi[k.yazi] = k.sayi; });
    BIRIM.push(kural({
      id: 'sayi-rakamla',
      kategori: 'Birim',
      aciklama: (esik + 1) + ' ve daha büyük sayılar (süre ve sayım ifadelerinde) rakamla yazılır.',
      ornek: 'ilk on bir ay → ilk 11 ay',
      desen: new RegExp('(?<![\\p{L}])(' +
        buyukler.map(function (k) { return D.ifadeDeseni(k.yazi); }).join('|') + ')' + BIRIM_ONU),
      kosul: function (m, p, paragraf) { return !(paragraf && paragraf.tablo) && !istisnaMi(p, m.index); },
      oneri: function (m) {
        return String(yaziToSayi[m[1].toLocaleLowerCase('tr-TR').replace(/\s+/g, ' ')]);
      }
    }));
  }

  // --- Baz puan -----------------------------------------------------------
  // "puan" kalın ünlülü ve ünsüzle biten bir sözcük: bp'nin → baz puanın, bp'ye → baz puana
  function puanEki(ek) {
    var e = ek.toLocaleLowerCase('tr-TR');
    if (/^n[ıiuü]n/.test(e)) e = e.slice(1);               // nin → ın
    else if (/^y[aeıiuü]/.test(e)) e = e.slice(1);          // ye/yi → e/i
    e = e.replace(/^t/, 'd');                               // te/ten → da/dan
    return e.replace(/[eiüö]/g, function (c) { return { e: 'a', i: 'ı', ü: 'ı', ö: 'a' }[c]; })
      .replace(/u/g, 'ı');
  }
  if (AYAR.bazPuan !== false) {
    BIRIM.push(kural({
      id: 'baz-puan',
      kategori: 'Birim',
      aciklama: '"bp" kısaltması kullanılmaz; "baz puan" yazılır. (Büyük harfli "BP" şirket adı olabileceği için denetlenmez.)',
      ornek: "50 bp → 50 baz puan, 25 bp'lik → 25 baz puanlık",
      desen: new RegExp('(?<![\\p{L}])([bB]ps?)(?:' + KESME + '(\\p{L}+))?(?![\\p{L}\\p{N}])'),
      oneri: function (m, p) {
        var bitisik = m.index > 0 && /\d/.test(p.charAt(m.index - 1)); // 25bp → 25 baz puan
        return (bitisik ? ' ' : '') + 'baz puan' + (m[2] ? puanEki(m[2]) : '');
      }
    }));
  }

  var KURALLAR = [].concat(TDK_SOZCUK, TDK_KURAL, BICIM, BIRIM);
  var KURAL_SURUMU = '2026-10-14d';

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { KURALLAR: KURALLAR, KURAL_SURUMU: KURAL_SURUMU, AYAR: AYAR, KURAL_HATALARI: birimListesi.hatalar };
  } else {
    kok.KURALLAR = KURALLAR;
    kok.KURAL_SURUMU = KURAL_SURUMU;
    kok.BIRIM_AYAR = AYAR;
    kok.KURAL_HATALARI = birimListesi.hatalar;
  }
})(typeof window !== 'undefined' ? window : this);

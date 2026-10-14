/*
 * Denetim motoru
 * --------------
 * Kuralları metne uygular. Kural tanımları tdkkuralları.js dosyasındadır;
 * bu dosyada değişiklik yapmanız gerekmez.
 *
 * Tarayıcıda window.Denetleyici, Node'da module.exports olarak kullanılır.
 */
(function (kok) {
  'use strict';

  var KATEGORILER = ['TDK', 'Biçim', 'Birim'];
  var SEVIYELER = ['hata', 'kontrol'];

  // --- Türkçe büyük/küçük harf yardımcıları -------------------------------

  function kucuk(s) { return s.toLocaleLowerCase('tr-TR'); }
  function buyuk(s) { return s.toLocaleUpperCase('tr-TR'); }

  function kacis(s) { return s.replace(/[.*+?^${}()|[\]\\\/]/g, '\\$&'); }

  // "itibariyle" -> [iİ][tT][iİ]... (Türkçe i/İ, ı/I eşleşmesini doğru yapar)
  function harfSinifi(c) {
    var k = kucuk(c);
    var b = buyuk(c);
    if (k === b) return kacis(c);
    return '[' + k + b + ']';
  }

  function ifadeDeseni(ifade) {
    var parcalar = [];
    for (var i = 0; i < ifade.length; i++) {
      var c = ifade[i];
      parcalar.push(c === ' ' ? '\\s+' : harfSinifi(c));
    }
    return parcalar.join('');
  }

  // Bulunan ifadenin büyük/küçük harf durumunu öneriye taşır.
  function harfDurumunuKoru(bulunan, oneri) {
    var harfler = bulunan.replace(/[^\p{L}]/gu, '');
    if (harfler.length > 1 && harfler === buyuk(harfler)) return buyuk(oneri);
    var ilk = bulunan.charAt(0);
    if (ilk !== kucuk(ilk)) return buyuk(oneri.charAt(0)) + oneri.slice(1);
    return oneri;
  }

  var SOL_SINIR = '(?<![\\p{L}\\p{N}])';
  var SAG_SINIR = '(?![\\p{L}\\p{N}])';

  // --- Kural tanımlama yardımcıları -------------------------------------

  function dogrula(k) {
    if (KATEGORILER.indexOf(k.kategori) < 0) {
      throw new Error('Geçersiz kategori "' + k.kategori + '" (' + k.id + '). Kullanılabilenler: ' + KATEGORILER.join(', '));
    }
    if (SEVIYELER.indexOf(k.seviye) < 0) {
      throw new Error('Geçersiz seviye "' + k.seviye + '" (' + k.id + '). Kullanılabilenler: hata, kontrol');
    }
    return k;
  }

  /**
   * Basit sözcük kuralı: yanlış yazımı doğrusuyla eşleştirir.
   *   kelime('itibariyle', 'itibarıyla', 'Açıklama')
   * Seçenekler:
   *   kategori: 'TDK' | 'Biçim' | 'Birim'   (varsayılan TDK)
   *   seviye:   'hata' | 'kontrol'          (varsayılan hata)
   *   ekli:     true -> sözcüğe ek gelmiş halleri de yakalar
   *             (ör. 'yurtdışı' ile 'yurtdışından' da bulunur)
   */
  function kelime(yanlis, dogru, aciklama, secenek) {
    secenek = secenek || {};
    var govde = ifadeDeseni(yanlis);
    var desen = secenek.ekli
      ? SOL_SINIR + '(' + govde + ')(\\p{L}*)'
      : SOL_SINIR + '(' + govde + ')()' + SAG_SINIR;
    return dogrula({
      id: secenek.id || 'kelime: ' + yanlis,
      kategori: secenek.kategori || 'TDK',
      seviye: secenek.seviye || 'hata',
      aciklama: aciklama || ('"' + yanlis + '" yerine "' + dogru + '" yazılır.'),
      ornek: yanlis + ' → ' + dogru,
      desen: new RegExp(desen, 'gu'),
      oneri: function (m) { return harfDurumunuKoru(m[1], dogru) + m[2]; }
    });
  }

  /**
   * Serbest kural (düzenli ifade ile):
   *   kural({ id, kategori, seviye, aciklama, ornek,
   *           desen: /.../  veya  'metin olarak desen',
   *           oneri: 'sabit metin' veya function(eslesme, paragraf) {...},
   *           kosul: function(eslesme, paragraf) { return true/false; } })
   */
  function kural(t) {
    var desen = t.desen;
    if (typeof desen === 'string') desen = new RegExp(desen, 'gu');
    else {
      var bayrak = desen.flags;
      if (bayrak.indexOf('g') < 0) bayrak += 'g';
      if (bayrak.indexOf('u') < 0) bayrak += 'u';
      desen = new RegExp(desen.source, bayrak);
    }
    return dogrula({
      id: t.id,
      kategori: t.kategori || 'TDK',
      seviye: t.seviye || 'hata',
      aciklama: t.aciklama || '',
      ornek: t.ornek || '',
      desen: desen,
      oneri: t.oneri,
      kosul: t.kosul
    });
  }

  /**
   * Belge düzeyinde kural: tüm paragraflara birlikte bakar.
   *   belgeKurali({ id, kategori, seviye, aciklama, ornek,
   *                 belge: function (paragraflar) { return [{ paragraf, bas, son, oneri, aciklama }] } })
   * oneri null olabilir; bu durumda bulgu yalnızca işaretlenir.
   */
  function belgeKurali(t) {
    return dogrula({
      id: t.id,
      kategori: t.kategori || 'TDK',
      seviye: t.seviye || 'kontrol',
      aciklama: t.aciklama || '',
      ornek: t.ornek || '',
      belge: t.belge
    });
  }

  /**
   * "yanlış => doğru  # açıklama" satırlarından oluşan listeyi kurallara çevirir.
   * Dönüş: { kurallar: [...], hatalar: ['3. satır: ...'] }
   */
  function birimListesiOku(metin, varsayilan) {
    varsayilan = varsayilan || {};
    var kurallar = [], hatalar = [];
    String(metin || '').split(/\r?\n/).forEach(function (satir, i) {
      var s = satir.trim();
      if (!s || s.charAt(0) === '#') return;
      var seviye = 'hata';
      if (s.charAt(0) === '?') { seviye = 'kontrol'; s = s.slice(1).trim(); }
      var aciklama = '';
      var diyez = s.indexOf('#');
      if (diyez >= 0) { aciklama = s.slice(diyez + 1).trim(); s = s.slice(0, diyez).trim(); }
      var parca = s.split('=>');
      if (parca.length !== 2 || !parca[0].trim() || !parca[1].trim()) {
        hatalar.push((i + 1) + '. satır anlaşılamadı: "' + satir.trim() + '" (biçim: yanlış => doğru)');
        return;
      }
      var yanlis = parca[0].trim().replace(/\s+/g, ' ');
      var dogru = parca[1].trim().replace(/\s+/g, ' ');
      var ekli = false;
      if (yanlis.slice(-1) === '*') { ekli = true; yanlis = yanlis.slice(0, -1).trim(); }
      try {
        kurallar.push(kelime(yanlis, dogru, aciklama || ('"' + dogru + '" biçiminde yazılır.'), {
          kategori: varsayilan.kategori || 'Birim',
          seviye: seviye,
          ekli: ekli,
          id: 'birim: ' + yanlis
        }));
      } catch (e) {
        hatalar.push((i + 1) + '. satır: ' + e.message);
      }
    });
    return { kurallar: kurallar, hatalar: hatalar };
  }

  // --- Denetim ----------------------------------------------------------

  /**
   * paragraflar: [{ metin: '...', tablo: false }, ...] ya da düz metin dizisi
   * Dönüş: bulgu listesi (paragraf sırasına ve konuma göre sıralı)
   */
  function denetle(paragraflar, kurallar) {
    var bulgular = [];
    var hatalar = [];
    paragraflar.forEach(function (p, pi) {
      var metin = typeof p === 'string' ? p : p.metin;
      if (!metin) return;
      kurallar.forEach(function (k) {
        if (k.belge) return;
        var r = new RegExp(k.desen.source, k.desen.flags);
        var m;
        try {
          while ((m = r.exec(metin)) !== null) {
            if (m[0].length === 0) { r.lastIndex++; continue; }
            if (k.kosul && !k.kosul(m, metin, typeof p === 'string' ? null : p)) continue;
            var oneri = typeof k.oneri === 'function' ? k.oneri(m, metin) : k.oneri;
            if (oneri === m[0]) continue;
            bulgular.push({
              paragraf: pi,
              bas: m.index,
              son: m.index + m[0].length,
              bulunan: m[0],
              oneri: oneri,
              kural: k
            });
          }
        } catch (e) {
          hatalar.push(k.id + ': ' + e.message);
        }
      });
    });
    kurallar.forEach(function (k) {
      if (!k.belge) return;
      try {
        k.belge(paragraflar).forEach(function (s) {
          var p = paragraflar[s.paragraf];
          var metin = typeof p === 'string' ? p : p.metin;
          var bulunan = metin.slice(s.bas, s.son);
          if (s.oneri === bulunan) return;
          bulgular.push({
            paragraf: s.paragraf, bas: s.bas, son: s.son, bulunan: bulunan,
            oneri: s.oneri == null ? null : s.oneri, aciklama: s.aciklama, kural: k
          });
        });
      } catch (e) {
        hatalar.push(k.id + ': ' + e.message);
      }
    });
    bulgular.sort(function (a, b) {
      return a.paragraf - b.paragraf || a.bas - b.bas || a.son - b.son;
    });
    return { bulgular: bulgular, hatalar: hatalar };
  }


  // --- Düzeltmelerin seçimi ve düz metne uygulanması ---------------------

  /**
   * Aynı yeri değiştiren düzeltmelerden yalnızca ilki tutulur.
   * duzeltmeler: [{ paragraf, bas, son, bulunan, oneri, ... }]
   */
  function cakismalariAyikla(duzeltmeler) {
    var sirali = duzeltmeler.slice().sort(function (a, b) {
      return a.paragraf - b.paragraf || a.bas - b.bas || a.son - b.son;
    });
    var kabul = [], cakisan = [];
    var onceki = null;
    sirali.forEach(function (d) {
      if (d.oneri == null) return;                       // önerisi olmayan bulgu uygulanamaz
      if (d.tur === 'bicim') { kabul.push(d); return; }  // paragraf biçimi metinle çakışmaz
      if (onceki && onceki.paragraf === d.paragraf && d.bas < onceki.son) cakisan.push(d);
      else { kabul.push(d); onceki = d; }
    });
    return { kabul: kabul, cakisan: cakisan };
  }

  // Bir paragrafın düz metnine düzeltmeleri uygular (sondan başa doğru).
  function metneUygula(metin, duzeltmeler) {
    var sirali = duzeltmeler.filter(function (d) { return d.tur !== 'bicim' && d.oneri != null; })
      .sort(function (a, b) { return b.bas - a.bas; });
    sirali.forEach(function (d) {
      if (metin.slice(d.bas, d.son) === d.bulunan) metin = metin.slice(0, d.bas) + d.oneri + metin.slice(d.son);
    });
    return metin;
  }

  // Değişikliği en küçük haline indirir: yalnızca ekleme ya da yalnızca silme
  // söz konusuysa (ör. kesme işaretinin silinmesi, boşluk eklenmesi) sadece o
  // karakter işaretlenir; aksi halde bulunan ifadenin tamamı değiştirilir.
  function kirp(eski, yeni) {
    var on = 0;
    while (on < eski.length && on < yeni.length && eski[on] === yeni[on]) on++;
    var arka = 0;
    while (arka < eski.length - on && arka < yeni.length - on &&
      eski[eski.length - 1 - arka] === yeni[yeni.length - 1 - arka]) arka++;
    var eskiOrta = eski.slice(on, eski.length - arka);
    var yeniOrta = yeni.slice(on, yeni.length - arka);
    if (eskiOrta === '' || yeniOrta === '') return { on: on, arka: arka, yeni: yeniOrta };
    return { on: 0, arka: 0, yeni: yeni };
  }

  // --- Word (.docx) okuma ----------------------------------------------

  var W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
  var XMLNS = 'http://www.w3.org/XML/1998/namespace';

  // Metni taranmayan öğeler: silinmiş metin, alan kodları, biçim tanımları.
  var ATLANAN = { del: 1, delText: 1, instrText: 1, moveFrom: 1, rPr: 1, pPr: 1, sectPr: 1 };

  function elemanCocuklari(d) {
    var c = [];
    for (var i = 0; i < d.childNodes.length; i++) if (d.childNodes[i].nodeType === 1) c.push(d.childNodes[i]);
    return c;
  }

  function ayristir(xml, secenek) {
    var Ayristirici = (secenek && secenek.DOMParser) || DOMParser;
    return new Ayristirici().parseFromString(xml, 'application/xml');
  }

  // Denetlenecek paragraflar. mc:Fallback içindekiler (metin kutularının eski
  // biçimdeki kopyaları) iki kez sayılmasın diye atlanır.
  function paragrafElemanlari(belge) {
    var pler = belge.getElementsByTagNameNS(W, 'p');
    var sonuc = [];
    for (var i = 0; i < pler.length; i++) {
      var atla = false;
      for (var a = pler[i].parentNode; a; a = a.parentNode) {
        if (a.localName === 'Fallback') { atla = true; break; }
      }
      if (!atla) sonuc.push(pler[i]);
    }
    return sonuc;
  }

  // Paragrafı metin parçalarına böler: her w:t öğesi ve sekme/satır sonu gibi atomlar.
  function segmentler(p) {
    var seg = [];
    var konum = 0;
    function ekle(tur, el, metin) {
      seg.push({ tur: tur, el: el, bas: konum, son: konum + metin.length, metin: metin });
      konum += metin.length;
    }
    (function gez(d) {
      elemanCocuklari(d).forEach(function (c) {
        if (c.localName === 'Fallback') return;
        if (c.namespaceURI === W) {
          if (c.localName === 'p' && c !== p) return;
          if (ATLANAN[c.localName]) return;
          if (c.localName === 't') { ekle('t', c, c.textContent); return; }
          if (c.localName === 'tab') { ekle('atom', c, '\t'); return; }
          if (c.localName === 'br' || c.localName === 'cr') { ekle('atom', c, '\n'); return; }
          if (c.localName === 'noBreakHyphen') { ekle('atom', c, '-'); return; }
        }
        gez(c);
      });
    })(p);
    return seg;
  }

  function tabloIcinde(p) {
    for (var a = p.parentNode; a; a = a.parentNode) {
      if (a.localName === 'tbl' && a.namespaceURI === W) return true;
    }
    return false;
  }

  // Bir XML parçasından (document.xml, footnotes.xml) paragraf metinlerini çıkarır.
  function docxParagraflari(xml, secenek) {
    if (typeof secenek === 'function') secenek = { DOMParser: secenek };
    var belge = ayristir(xml, secenek);
    return paragrafElemanlari(belge).map(function (p, i) {
      return {
        metin: segmentler(p).map(function (s) { return s.metin; }).join(''),
        tablo: tabloIcinde(p),
        pIndeks: i
      };
    });
  }

  // --- Değişiklikleri izle (w:ins / w:del) ile düzeltme ----------------

  function duzenlenebilir(tEl, p) {
    var run = tEl.parentNode;
    if (!run || run.namespaceURI !== W || run.localName !== 'r') return false;
    for (var a = run.parentNode; a && a !== p; a = a.parentNode) {
      if (a.namespaceURI === W && /^(ins|del|moveTo|moveFrom|fldSimple)$/.test(a.localName)) return false;
    }
    return true;
  }

  function rPrAl(run) {
    var c = elemanCocuklari(run);
    for (var i = 0; i < c.length; i++) if (c[i].namespaceURI === W && c[i].localName === 'rPr') return c[i];
    return null;
  }

  function tYap(belge, metin, ad) {
    var t = belge.createElementNS(W, 'w:' + (ad || 't'));
    t.setAttributeNS(XMLNS, 'xml:space', 'preserve');
    t.appendChild(belge.createTextNode(metin));
    return t;
  }

  function sonrayaEkle(yeni, referans) {
    referans.parentNode.insertBefore(yeni, referans.nextSibling);
  }

  function yeniRun(belge, kalip, rPr, dugumler) {
    var r = kalip.cloneNode(false);
    if (rPr) r.appendChild(rPr.cloneNode(true));
    dugumler.forEach(function (d) { r.appendChild(d); });
    return r;
  }

  // Bir w:t öğesinin bulunduğu run'ı [0,a) [a,b) [b,son) olarak üçe böler.
  // Özgün run ilk parçayı tutar; böylece öncesindeki konumlar değişmez.
  function bol(belge, tEl, a, b) {
    var run = tEl.parentNode;
    var metin = tEl.textContent;
    var rPr = rPrAl(run);
    var sonrakiler = [];
    var gecti = false;
    elemanCocuklari(run).forEach(function (c) {
      if (c === tEl) { gecti = true; return; }
      if (gecti) sonrakiler.push(c);
    });
    var on = metin.slice(0, a), orta = metin.slice(a, b), arka = metin.slice(b);
    if (on) {
      while (tEl.firstChild) tEl.removeChild(tEl.firstChild);
      tEl.appendChild(belge.createTextNode(on));
      tEl.setAttributeNS(XMLNS, 'xml:space', 'preserve');
    } else {
      run.removeChild(tEl);
    }
    var konum = run, ortaRun = null;
    if (orta) {
      ortaRun = yeniRun(belge, run, rPr, [tYap(belge, orta)]);
      sonrayaEkle(ortaRun, konum);
      konum = ortaRun;
    }
    if (arka || sonrakiler.length) {
      var dugumler = arka ? [tYap(belge, arka)] : [];
      sonrakiler.forEach(function (c) { run.removeChild(c); dugumler.push(c); });
      sonrayaEkle(yeniRun(belge, run, rPr, dugumler), konum);
    }
    return { onceki: run, orta: ortaRun, rPr: rPr };
  }

  function izlemeOzellikleri(el, ctx) {
    el.setAttributeNS(W, 'w:id', String(ctx.id++));
    el.setAttributeNS(W, 'w:author', ctx.yazar);
    el.setAttributeNS(W, 'w:date', ctx.tarih);
  }

  function silmeyeSar(belge, run, ctx) {
    var del = belge.createElementNS(W, 'w:del');
    izlemeOzellikleri(del, ctx);
    run.parentNode.insertBefore(del, run);
    del.appendChild(run);
    elemanCocuklari(run).forEach(function (c) {
      if (c.namespaceURI === W && c.localName === 't') run.replaceChild(tYap(belge, c.textContent, 'delText'), c);
    });
    return del;
  }

  function eklemeYap(belge, metin, rPr, ctx) {
    var ins = belge.createElementNS(W, 'w:ins');
    izlemeOzellikleri(ins, ctx);
    var r = belge.createElementNS(W, 'w:r');
    if (rPr) r.appendChild(rPr.cloneNode(true));
    r.appendChild(tYap(belge, metin));
    ins.appendChild(r);
    return ins;
  }

  // Tek bir düzeltmeyi paragrafa işler. Başarısızsa nedenini döndürür.
  function duzeltmeIsle(belge, p, d, ctx) {
    var segs = segmentler(p);
    var metin = segs.map(function (s) { return s.metin; }).join('');
    if (metin.slice(d.bas, d.son) !== d.bulunan) return 'metin eşleşmedi';
    var k = kirp(d.bulunan, d.oneri);
    var bas = d.bas + k.on, son = d.son - k.arka, yeni = k.yeni;
    var capa, rPr;

    if (bas < son) {
      var ilgili = segs.filter(function (s) { return s.bas < son && s.son > bas; });
      for (var i = 0; i < ilgili.length; i++) {
        if (ilgili[i].tur !== 't' || !duzenlenebilir(ilgili[i].el, p)) return 'özel biçimli alanda (alan kodu, sekme ya da önceden izlenen değişiklik)';
      }
      rPr = null;
      var sonSilme = null;
      for (var j = ilgili.length - 1; j >= 0; j--) {
        var g = ilgili[j];
        var parca = bol(belge, g.el, Math.max(bas, g.bas) - g.bas, Math.min(son, g.son) - g.bas);
        if (j === 0) rPr = parca.rPr;
        var del = silmeyeSar(belge, parca.orta, ctx);
        if (!sonSilme) sonSilme = del;
      }
      capa = sonSilme;
    } else {
      var hedef = null;
      for (var m = 0; m < segs.length; m++) {
        var s = segs[m];
        if (s.tur === 't' && s.bas < bas && bas <= s.son) { hedef = s; break; }
      }
      if (!hedef) {
        for (var n = 0; n < segs.length; n++) {
          if (segs[n].tur === 't' && segs[n].bas === bas) { hedef = segs[n]; break; }
        }
      }
      if (!hedef || !duzenlenebilir(hedef.el, p)) return 'özel biçimli alanda (alan kodu, sekme ya da önceden izlenen değişiklik)';
      var p2 = bol(belge, hedef.el, bas - hedef.bas, bas - hedef.bas);
      capa = p2.onceki;
      rPr = p2.rPr;
    }
    if (yeni) sonrayaEkle(eklemeYap(belge, yeni, rPr, ctx), capa);
    return null;
  }

  function enBuyukId(belge) {
    var enBuyuk = 0;
    var hepsi = belge.getElementsByTagName('*');
    for (var i = 0; i < hepsi.length; i++) {
      var v = parseInt(hepsi[i].getAttributeNS(W, 'id'), 10);
      if (!isNaN(v) && v > enBuyuk) enBuyuk = v;
    }
    return enBuyuk;
  }

  // --- Paragraf aralığı (Önce / Sonra boşluğu) -------------------------

  function ilkCocuk(el, ad) {
    if (!el) return null;
    var c = elemanCocuklari(el);
    for (var i = 0; i < c.length; i++) if (c[i].namespaceURI === W && c[i].localName === ad) return c[i];
    return null;
  }
  function ozellikVar(el, ad) {
    if (el.hasAttributeNS) return el.hasAttributeNS(W, ad);
    var v = el.getAttributeNS(W, ad);
    return v !== null && v !== '';
  }
  function ozellik(el, ad) { return ozellikVar(el, ad) ? el.getAttributeNS(W, ad) : null; }

  // w:spacing öğesinden 'before' ya da 'after' değeri: sayı (twip), 'otomatik',
  // { satir: n } ya da tanımsız.
  function aralikDegeri(sp, yon) {
    if (!sp) return undefined;
    var oto = ozellik(sp, yon + 'Autospacing');
    if (oto === '1' || oto === 'true' || oto === 'on') return 'otomatik';
    var satir = ozellik(sp, yon + 'Lines');
    if (satir !== null && parseInt(satir, 10) !== 0) return { satir: parseInt(satir, 10) };
    var v = ozellik(sp, yon);
    if (v !== null) return parseInt(v, 10);
    return undefined;
  }

  // styles.xml'e bakarak paragrafın etkin aralığını hesaplar
  // (doğrudan biçim → paragraf stili ve dayandığı stiller → belge varsayılanı).
  function stilCozucu(stilXml, secenek) {
    var stiller = {}, varsayilanStil = null, belgeVarsayilani = null;
    if (stilXml) {
      var b = ayristir(stilXml, secenek);
      var liste = b.getElementsByTagNameNS(W, 'style');
      for (var i = 0; i < liste.length; i++) {
        var s = liste[i];
        if (ozellik(s, 'type') !== 'paragraph') continue;
        stiller[ozellik(s, 'styleId')] = s;
        var vars = ozellik(s, 'default');
        if (vars === '1' || vars === 'true' || vars === 'on') varsayilanStil = ozellik(s, 'styleId');
      }
      var pd = b.getElementsByTagNameNS(W, 'pPrDefault')[0];
      belgeVarsayilani = ilkCocuk(ilkCocuk(pd, 'pPr'), 'spacing');
    }
    return function (p, yon) {
      var pPr = ilkCocuk(p, 'pPr');
      var v = aralikDegeri(ilkCocuk(pPr, 'spacing'), yon);
      if (v !== undefined) return v;
      var ps = ilkCocuk(pPr, 'pStyle');
      var id = ps ? ozellik(ps, 'val') : varsayilanStil;
      for (var adim = 0; id && stiller[id] && adim < 20; adim++) {
        var st = stiller[id];
        v = aralikDegeri(ilkCocuk(ilkCocuk(st, 'pPr'), 'spacing'), yon);
        if (v !== undefined) return v;
        var dayanak = ilkCocuk(st, 'basedOn');
        id = dayanak ? ozellik(dayanak, 'val') : null;
      }
      v = aralikDegeri(belgeVarsayilani, yon);
      return v !== undefined ? v : 0;
    };
  }

  function aralikYazi(v) {
    if (v === 'otomatik') return 'otomatik';
    if (typeof v === 'object') return (v.satir / 100).toLocaleString('tr-TR') + ' satır';
    var nk = v / 20;
    return (Math.round(nk * 10) / 10).toLocaleString('tr-TR') + ' nk';
  }

  /**
   * Künye satırlarının "Sonra" ve başlığın "Önce" boşluğunu denetler.
   * ayar: BIRIM_AYARLARI (kunye, baslik)
   * Dönüş: { bulgular: [{ pIndeks, tur: 'bicim', yon, hedef, bulunan, oneri, aciklama }],
   *          kunye: [pIndeks...], baslik: pIndeks | null }
   */
  function docxBicimDenetle(xml, stilXml, ayar, secenek) {
    ayar = ayar || {};
    var kunyeAyar = ayar.kunye || {}, baslikAyar = ayar.baslik || {};
    var sonuc = { bulgular: [], kunye: [], baslik: null };
    if (kunyeAyar.etkin === false && baslikAyar.etkin === false) return sonuc;

    var belge = ayristir(xml, secenek);
    var pler = paragrafElemanlari(belge);
    var etkin = stilCozucu(stilXml, secenek);
    var metinler = pler.map(function (p) { return segmentler(p).map(function (s) { return s.metin; }).join(''); });

    var etiketler = (kunyeAyar.etiketler || []).map(function (e) { return ifadeDeseni(e.trim()); });
    var etiketDeseni = etiketler.length
      ? new RegExp('^\\s*(' + etiketler.join('|') + ')(?![\\p{L}])', 'u') : null;
    var genelDesen = /^\s*\p{L}[\p{L}\p{N} .\/()&-]{0,40}:\s*\S/u;

    var i = 0;
    while (i < pler.length && !metinler[i].trim()) i++;
    while (i < pler.length) {
      var t = metinler[i];
      if (!t.trim()) { i++; continue; }
      if (genelDesen.test(t) || (etiketDeseni && etiketDeseni.test(t))) { sonuc.kunye.push(i); i++; continue; }
      break;
    }
    if (sonuc.kunye.length && i < pler.length) sonuc.baslik = i;

    var hedefKunye = Math.round((kunyeAyar.satirSonrasiBosluk || 0) * 20);
    var hedefBaslik = Math.round((baslikAyar.oncesiBosluk == null ? 12 : baslikAyar.oncesiBosluk) * 20);

    if (kunyeAyar.etkin !== false) {
      sonuc.kunye.forEach(function (pi) {
        var v = etkin(pler[pi], 'after');
        if (v !== hedefKunye) {
          sonuc.bulgular.push({
            pIndeks: pi, tur: 'bicim', yon: 'after', hedef: hedefKunye,
            bulunan: 'Sonra boşluğu: ' + aralikYazi(v), oneri: 'Sonra boşluğu: ' + aralikYazi(hedefKunye),
            aciklama: 'Künye satırlarında paragraf sonrası boşluk ' + aralikYazi(hedefKunye) + ' olmalı.'
          });
        }
      });
    }
    if (baslikAyar.etkin !== false && sonuc.baslik !== null) {
      var vb = etkin(pler[sonuc.baslik], 'before');
      if (vb !== hedefBaslik) {
        sonuc.bulgular.push({
          pIndeks: sonuc.baslik, tur: 'bicim', yon: 'before', hedef: hedefBaslik,
          bulunan: 'Önce boşluğu: ' + aralikYazi(vb), oneri: 'Önce boşluğu: ' + aralikYazi(hedefBaslik),
          aciklama: 'Künyeden sonraki başlıkta paragraf öncesi boşluk ' + aralikYazi(hedefBaslik) + ' olmalı.'
        });
      }
    }
    return sonuc;
  }

  // w:pPr içindeki öğelerin şemadaki sırası (Word sıraya duyarlıdır).
  var PPR_SIRASI = ['pStyle', 'keepNext', 'keepLines', 'pageBreakBefore', 'framePr', 'widowControl', 'numPr',
    'suppressLineNumbers', 'pBdr', 'shd', 'tabs', 'suppressAutoHyphens', 'kinsoku', 'wordWrap', 'overflowPunct',
    'topLinePunct', 'autoSpaceDE', 'autoSpaceDN', 'bidi', 'adjustRightInd', 'snapToGrid', 'spacing', 'ind',
    'contextualSpacing', 'mirrorIndents', 'suppressOverlap', 'jc', 'textDirection', 'textAlignment',
    'textboxTightWrap', 'outlineLvl', 'divId', 'cnfStyle', 'rPr', 'sectPr', 'pPrChange'];

  function siraliEkle(pPr, el) {
    var sira = PPR_SIRASI.indexOf(el.localName);
    var c = elemanCocuklari(pPr);
    for (var i = 0; i < c.length; i++) {
      if (PPR_SIRASI.indexOf(c[i].localName) > sira) { pPr.insertBefore(el, c[i]); return; }
    }
    pPr.appendChild(el);
  }

  // Paragraf aralığını izlenen biçim değişikliği (w:pPrChange) olarak değiştirir.
  function bicimIsle(belge, p, d, ctx) {
    var pPr = ilkCocuk(p, 'pPr');
    if (!pPr) {
      pPr = belge.createElementNS(W, 'w:pPr');
      p.insertBefore(pPr, p.firstChild);
    }
    var degisim = ilkCocuk(pPr, 'pPrChange');
    if (!degisim) {
      // Değişiklikten önceki biçim (rPr, sectPr dışındaki her şey) saklanır.
      var eski = belge.createElementNS(W, 'w:pPr');
      elemanCocuklari(pPr).forEach(function (c) {
        if (!(c.namespaceURI === W && /^(rPr|sectPr|pPrChange)$/.test(c.localName))) eski.appendChild(c.cloneNode(true));
      });
      degisim = belge.createElementNS(W, 'w:pPrChange');
      izlemeOzellikleri(degisim, ctx);
      degisim.appendChild(eski);
    } else if (ozellik(degisim, 'author') !== ctx.yazar || ozellik(degisim, 'date') !== ctx.tarih) {
      return 'paragrafta önceden izlenen biçim değişikliği var';
    }
    var sp = ilkCocuk(pPr, 'spacing');
    if (!sp) { sp = belge.createElementNS(W, 'w:spacing'); siraliEkle(pPr, sp); }
    [d.yon + 'Autospacing', d.yon + 'Lines'].forEach(function (a) {
      if (ozellikVar(sp, a)) sp.removeAttributeNS(W, a);
    });
    sp.setAttributeNS(W, 'w:' + d.yon, String(d.hedef));
    if (!degisim.parentNode) pPr.appendChild(degisim);
    return null;
  }

  /**
   * Bir XML parçasına düzeltmeleri izlenen değişiklik olarak işler.
   * duzeltmeler: [{ pIndeks, bas, son, bulunan, oneri }]
   * secenek: { yazar, tarih, idBaslangic, DOMParser, XMLSerializer }
   * Dönüş: { xml, uygulanan: [...], atlanan: [{ d, neden }], sonId }
   */
  function docxDuzelt(xml, duzeltmeler, secenek) {
    secenek = secenek || {};
    var belge = ayristir(xml, secenek);
    var pler = paragrafElemanlari(belge);
    var ctx = {
      id: Math.max(enBuyukId(belge) + 1, secenek.idBaslangic || 0),
      yazar: secenek.yazar || 'ÖD Robotu',
      tarih: secenek.tarih || new Date().toISOString().replace(/\.\d+Z$/, 'Z')
    };
    var uygulanan = [], atlanan = [];
    // Sondan başa işlenir; böylece öndeki konumlar kaymaz.
    duzeltmeler.slice().sort(function (a, b) {
      return b.pIndeks - a.pIndeks || b.bas - a.bas;
    }).forEach(function (d) {
      var p = pler[d.pIndeks];
      var neden = !p ? 'paragraf bulunamadı'
        : d.tur === 'bicim' ? bicimIsle(belge, p, d, ctx)
        : duzeltmeIsle(belge, p, d, ctx);
      if (neden) atlanan.push({ d: d, neden: neden });
      else uygulanan.push(d);
    });
    var Serilestirici = secenek.XMLSerializer || XMLSerializer;
    var cikti = new Serilestirici().serializeToString(belge);
    if (!/^<\?xml/.test(cikti)) cikti = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\r\n' + cikti;
    return { xml: cikti, uygulanan: uygulanan, atlanan: atlanan, sonId: ctx.id };
  }

  var api = {
    kelime: kelime,
    kural: kural,
    belgeKurali: belgeKurali,
    ifadeDeseni: ifadeDeseni,
    birimListesiOku: birimListesiOku,
    docxBicimDenetle: docxBicimDenetle,
    denetle: denetle,
    cakismalariAyikla: cakismalariAyikla,
    metneUygula: metneUygula,
    docxParagraflari: docxParagraflari,
    docxDuzelt: docxDuzelt,
    harfDurumunuKoru: harfDurumunuKoru,
    KATEGORILER: KATEGORILER
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else kok.Denetleyici = api;
})(typeof window !== 'undefined' ? window : this);

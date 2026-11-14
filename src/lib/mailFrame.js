/**
 * Postanın HTML gövdesini taşıyan çerçevenin belgesi — Keşfet'in okuma bölmesi, çentiğin posta
 * kartı ve büyük posta okuyucusu aynı belgeyi çizer (postanın kendi tasarımı, beyaz kâğıt).
 *
 * Güvenlik reçetesi (çağıran iframe'e `sandbox="allow-popups allow-popups-to-escape-sandbox"`
 * verir: script, form ve same-origin KAPALI, yalnız `target="_blank"` çalışır; telefon okuyucusunun
 * içeriği kadar uzayan çerçevesi boyu okumak için yalnız `allow-same-origin` ekler — `FitFrame`):
 *   `img-src data:`     → uzak görsel yüklenmez; bültenlerin takip pikselleri istek çıkarmaz
 *   `style-src 'unsafe-inline'` → postanın kendi satır içi stili geçer
 *   `base target=_blank`→ bağlantılar yeni sekmede, çerçeve içinde değil
 *
 * Gerçek görseller yine görünür: gömülü (`cid:`) ekler indirilip `data:` URL'e çevrilir
 * (`lib/mailImages.js` › `fetchInlineImages` + `lib/mailHtml.js` › `inlineCidImages`). Uzakta
 * barındırılan görsel mühürlü bir kutu olur ve dipnotta söylenir.
 *
 * Koyu temada da BEYAZ: postanın kurumsal tasarımı açık zemine göre kurulu. Kâğıdı koyu
 * kabuktan ayıran kenar boşluğu çağıranda (`components/common/mail/ReaderBody`).
 * Ayrıntı: `docs/features/kesfet.md`, `docs/features/sag-centik.md`.
 */
/** Dipnot METİNDİR; çerçeveye HTML olarak sızmaması için kaçırılır. */
function escapeText(value) {
  return String(value).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`)
}

/** Çerçevenin içerik politikası — OneNote okuyucusu da aynısını kullanır (`lib/onenote/onenoteFrame`). */
export const FRAME_CSP =
  "default-src 'none'; img-src data:; style-src 'unsafe-inline'; font-src data:; base-uri 'none'; form-action 'none'"

export function readerFrameDoc(html, { note } = {}) {
  // ⚠️ Renkler TOKEN DEĞİL, SABİT. Çerçeve AYRI bir belge: `var(--foreground)`
  // orada tanımsız ve metin siyaha düşerdi.
  const bg = "#ffffff"
  const fg = "#1f2328"
  const quote = "#6b7280"
  const rule = "#e5e7eb"
  const link = "#0b5cab"
  return `<!doctype html><html><head><meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="${FRAME_CSP}">
<base target="_blank">
<style>
  html{-webkit-text-size-adjust:100%}
  html,body{margin:0;background:${bg}}
  /* Outlook'un okuma bölmesi gibi kenar boşluklu; yazı tipi önce Segoe UI. Satır aralığı
     postanın kendisinin (birimsiz 1.6 yazmayan her öğeye miras kalıp satırları açıyordu). */
  body{padding:20px 24px 32px;color:${fg};
    font:14.5px/normal "Segoe UI",-apple-system,BlinkMacSystemFont,Roboto,"Helvetica Neue",Arial,sans-serif;
    overflow-wrap:break-word;word-break:normal}
  @media (max-width:480px){body{padding:16px 16px 24px}}
  /* Geniş bölmede postanın genişlikleri ve ortalaması KORUNUR (Outlook gibi): yalnız taşmaya
     karşı sıfır özgüllüklü, !important'sız sınır — postanın kendi max-width'i kazanır.
     Eskiden her tabloya width:auto!important veriliyordu: ortalı 600-640 px sütunlar boydan
     boya yayılıyordu (kök neden, ölçüldü). */
  :where(body *){max-width:100%}
  /* Dar çerçevede (telefon) sabit genişlikli bülten tabloları sığsın: akışkan geçersiz kılmalar
     yalnız burada. */
  @media (max-width:700px){
    body *{max-width:100%!important}
    table{border-collapse:collapse!important}
    table,thead,tbody,tfoot,tr,td,th,col,colgroup{width:auto!important;min-width:0!important;height:auto!important}
  }
  /* Yerleşim tablosunda blok içerik taşıyan th bir başlık değil: kalın çizilmez (Outlook'un
     yalnız kendi motoruna yazılmış th sıfırlamasının karşılığı). Gerçek başlık th'leri kalın. */
  :where(table[role="presentation" i],table[role="none" i]) > * > tr > th:where(:has(> div, > p, > table)){font-weight:inherit}
  img{max-width:100%!important;height:auto!important;border:0}
  /* MÜHÜRLENMİŞ uzak görsel (lib/mailHtml.js > sealUnloadableImages). Boyutu bilinmiyorsa
     yer tutucu 1×1 piksel ve height:auto onu kareye çevirirdi: sabit bant. UYARI: bu blok bir
     şablon dizesinin İÇİNDE -- ters tırnak yazmak dizeyi kapatır. */
  img[data-sealed]{background:#f4f5f7 url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='28' fill='none' stroke='%239aa3ad' stroke-width='1.6' viewBox='0 0 24 24'%3E%3Crect x='3' y='4' width='18' height='16' rx='3'/%3E%3Ccircle cx='9' cy='10' r='2'/%3E%3Cpath d='m21 16-5-5-9 9'/%3E%3C/svg%3E") center/28px no-repeat;
    border:1px dashed #d7dbe0;min-width:64px!important;height:88px!important}
  /* Boyutu yazılı olmayan uzak görsel (bültenlerde CSS ile boyutlanır): tam genişlik kutu. */
  img[data-sealed="wide"]{display:block;width:100%!important;max-width:560px;
    height:140px!important;margin:0 auto}
  /* Genişliği ve yüksekliği bildirilen uzak görsel: yer tutucu o oranda bir SVG, kutu postanın
     kendi ölçüsünde (logo 142×38 kalır, 88 px'lik banda dönmez). */
  img[data-sealed="box"]{height:auto!important;min-width:0!important;border:0;
    outline:1px solid #e3e6ea;outline-offset:-1px;background-size:20px}
  .tyro-sealed-note{margin:1.25em 0 0;padding:9px 12px;border-radius:10px;
    background:#f4f5f7;color:${quote};font-size:12.5px;line-height:1.5}
  a{color:${link};word-break:break-word}
  blockquote{margin:0 0 0 8px;padding-left:12px;border-left:2px solid ${rule};color:${quote}}
  hr{border:0;border-top:1px solid ${rule};margin:1.2em 0}
  pre{white-space:pre-wrap}
</style></head><body>${html}${
    // ⚠️ DİPNOT ÇEVİRİYİ ÇAĞIRANDAN ALIR. Çerçeve AYRI bir belge: `useLocale`
    // oraya ulaşmıyor ve metni burada yazmak dört sözlük kuralını delerdi.
    note ? `<p class="tyro-sealed-note">${escapeText(note)}</p>` : ""
  }</body></html>`
}

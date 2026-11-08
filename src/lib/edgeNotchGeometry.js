/**
 * ═══════════════════════════════════════════════════════════════════════
 *  ÇENTİĞİN GEOMETRİSİ — ray, Tercihler önizlemesi ve dikey konum
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Neden ayrı dosya: kabuk sınıfı `EdgeNotch` ile `EdgeNotchDesignPicker`da
 * BİREBİR KOPYAYDI ve önizlemenin "seçilen şey tam olarak görülecek şey"
 * sözü kopyanın güncellenmesine bağlıydı. Bir de bileşen dosyasından sabit
 * ihraç etmek fast refresh'i bozuyor (deponun kuralı).
 *
 * ⚠️ **ÖLÇÜLER REM, PX DEĞİL — ÖLÇÜLMÜŞ HATA** (2026-09-21, sahada
 * bildirildi: *"MacBook'ta şöyle duran çentik Dell'de böyle duruyor, her
 * PC'de Mac'teki gibi dursun"*). Çentik baştan px yazılmıştı; oysa
 * `index.css` alçak pencerede kök yazıyı 16 → 12,8px'e indiriyor ve
 * uygulamanın geri kalanı (419 literal, 77 dosya) o yüzden rem. Sonuç
 * ölçüldü:
 *
 *   MacBook 1651×921  → kök 15,85px · ray 298px = 18,8rem eşdeğeri
 *   Dell    1518×718  → kök 12,80px · ray 298px = 23,3rem eşdeğeri
 *
 * Yani ray, ÇEVRESİNDEKİ arayüze göre Dell'de %24 büyük duruyordu. Ölçüler
 * rem olunca iki makinede de 18,625rem: aynı ekran, aynı oran.
 *
 * ⚠️ **KAPALI HÂLİN KAYMASI YÜZDE, PİKSEL DEĞİL.** Eski yorum px'i
 * "kapalı hâlin kayması px, rem'e çevrilirse şerit hesabı kayar" diye
 * savunuyordu ve o gerekçe gerçekti — ama çare rem'den kaçmak değil,
 * kaymayı rayın KENDİ genişliğinin yüzdesi olarak yazmak: motion `x`i
 * elemanın kendi kutusuna göre çözer, yani birim ne olursa olsun şerit
 * tam `NOTCH_HANDLE_STRIP_REM` kadar kalır.
 */

/** Rayın genişliği (referansın 90px'i). */
export const NOTCH_RAIL_REM = 5.625
/**
 * Daraltılmış hâlde ekranda kalan şerit — tutamak burada yaşıyor.
 * 22px @16: 16'lık şerit kenarda bir gölge gibi duruyordu, çentiği
 * daraltan kullanıcı onu bir daha nasıl açacağını bulamıyordu.
 */
export const NOTCH_HANDLE_STRIP_REM = 1.375
/** Silüetin gövdenin üstüne/altına taşan omuz payı (referansın 52px'i). */
export const NOTCH_BLEED_REM = 3.25

/** Rayın dolu yüksekliği: 2×py + 2×gap + 3×düğme. */
export const NOTCH_RAIL_H_REM = 2 * 1.5625 + 2 * 0.625 + 3 * 4.75 // 18.625

/**
 * Kapalıyken `translateX` — rayın KENDİ genişliğinin yüzdesi (yukarıdaki
 * not). Açılış animasyonu da yüzde: motion px ile % arasında birim
 * dönüşümü yapmak zorunda kalmasın.
 */
export const NOTCH_COLLAPSED_X = `${(((NOTCH_RAIL_REM - NOTCH_HANDLE_STRIP_REM) / NOTCH_RAIL_REM) * 100).toFixed(4)}%`
export const NOTCH_ENTER_X = "40%"

/**
 * DİKEY KONUM — sayfa alanında ORTALI (ürün sahibi: *"kenarda daha ortala sayfaya"*).
 *
 * Çerçeve `top` = header'ın altındaki alanın ortası, `translateY(-50%)` ile rayın kendi
 * yüksekliği düşülür (`EdgeNotchFrame`): yuva sayısı (1–3) değişse de ray ortada kalır.
 * `2rem` = header (3,5rem) + içerik kartının üst payının yarısı. Eski kural (orb için taban,
 * Akışım'da yardım kartına hiza) rayı ortanın 50–70 px altına itiyordu — `docs/features/sag-centik.md`.
 * REM: kök yazı görüntü alanıyla ölçekleniyor, header da rem.
 */
export const NOTCH_TOP = "calc(50% + 2rem)"

/**
 * Kabuğun yerleşim sınıfı — ray ve Tercihler önizlemesi AYNI dizeyi
 * kullanır. Genişliği çağıran verir (ray `w-full`, önizleme sabit).
 */
export const NOTCH_SHELL_CLASS =
  "flex flex-col items-center gap-[0.625rem] px-[0.5625rem] py-[1.5625rem] text-[var(--notch-ink)]"

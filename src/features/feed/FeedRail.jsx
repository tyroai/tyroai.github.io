import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import Award01Icon from "@hugeicons/core-free-icons/Award01Icon"
import BirthdayCakeIcon from "@hugeicons/core-free-icons/BirthdayCakeIcon"
import UserAdd01Icon from "@hugeicons/core-free-icons/UserAdd01Icon"
import { PersonAvatar } from "@/components/common/PersonAvatar"
import { PersonPopover } from "@/components/common/PersonPopover"
import ArrowUpRight01Icon from "@hugeicons/core-free-icons/ArrowUpRight01Icon"
import { Skeleton } from "@/components/ui/skeleton"
import { useLocale } from "@/hooks/useLocale"
import { usePeoplePhotos } from "@/hooks/usePeoplePhotos"
import { usePeopleTitles } from "@/features/feed/hooks/usePeopleTitles"
import { useMyIdentity } from "@/hooks/useMyCelebration"
import { isMine } from "@/lib/myCelebration"
import { formatAgo } from "@/lib/date"
import { deriveHighlights, peopleRows } from "@/lib/feed"
import { cn } from "@/lib/utils"
import { celebrationWhen } from "./feedText"

/**
 * Sağ ray kartları: ortak kart kabuğu (`RailSection`) ve akıştan türeyen iki kişi paneli.
 * Trendler kartı `rail/FeedTrends`te.
 *
 * ⚠️ **KİŞİ PANELLERİ DİZİNDEN OKUMUYOR.** `/users` sorgusu `User.Read.All`
 * isterdi; bu depo yönetici onaylı kapsamları `loginRequest`e KOYMUYOR, çünkü
 * onaysız tek bir kapsam bütün girişi "Approval required" duvarına çeviriyor
 * (msal.js'te yazılı). Üstelik `birthday` alanı Exchange'de çoğu hesapta boş.
 * Paneller bu yüzden AKIŞIN KENDİSİNE bakan bir mercek.
 *
 * ⚠️ **KALIP TUTMAZSA PANEL ÇİZİLMEZ** — "yeni katılan yok" demek,
 * duyurunun nasıl yazıldığını bilmediğimiz hâlde kimsenin katılmadığını
 * iddia etmek olurdu ("soramadık ≠ veri yok").
 *
 * ⚠️ Ray GÖRÜNTÜ ALANI kırılımıyla değil KAPSAYICI sorgusuyla açılıyor
 * (`@[64rem]/feed`): sohbet rıhtımı sayfayı 340px'e kadar daraltabiliyor.
 */

/**
 * Postadan türeyen kişi listesinin HAM tavanı — bir affordans değil, bir
 * emniyet supabı. Görünen tavan üçtür ve gerisi düğmeyle açılır.
 */
const MAX_PEOPLE_ROWS = 50

export function RailSection({ title, icon, meta, children, accentTop }) {
  const { locale } = useLocale()
  return (
    <section className="ms-surface relative overflow-hidden rounded-[1.5rem] p-4">
      {/* Marka saç çizgisi: rayı sayfadan ayıran ve paleti buraya taşıyan
          tek işaret. İkon karesi DEĞİL — Güvenlik sayfasında ölçülmüştü,
          tekrar eden marka karesi hiyerarşiyi düzlüyor. */}
      {accentTop && (
        <span
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-brand-from via-brand-via to-brand-to opacity-70"
        />
      )}
      <div className="flex items-center justify-between gap-2">
        <h2
          lang={locale}
          className="flex min-w-0 items-center gap-2 text-[0.9375rem] font-bold tracking-[-0.01em] text-foreground"
        >
          {icon && (
            <HugeiconsIcon
              icon={icon}
              className="size-4 shrink-0 text-muted-foreground"
              strokeWidth={1.9}
            />
          )}
          <span className="truncate">{title}</span>
        </h2>
        {meta != null && (
          <span className="shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[0.6875rem] font-semibold tabular-nums text-foreground/70">
            {meta}
          </span>
        )}
      </div>
      <div className="mt-3">{children}</div>
    </section>
  )
}

/**
 * "Aramıza yeni katılanlar" / "Doğum günleri".
 *
 * ⚠️ **AD VARSA KİŞİ, YOKSA KONU** (`peopleRows`). Konudan ad ayıklamak uzun
 * süre reddedilmişti; kalıp 2026-09-20'de ÖLÇÜLDÜ ve ayıklama
 * HEPSİ-YA-DA-HİÇBİRİ kuralına bağlandı (`namesFromSubject`). Kalıp
 * tutmayan duyuru eskisi gibi kendi cümlesiyle çiziliyor — bu
 * zenginleştirme hiçbir hâlde bilgi UYDURMUYOR.
 *
 * ⚠️ Avatar tonu `PersonAvatar`ın SABİT paletinden, markadan DEĞİL: aynı
 * kişi palet değişince renk değiştirirse avatar kimlik ipucu olmaktan çıkar.
 */
export function FeedPeople({ kind, posts, now, onOpen }) {
  const { t, locale } = useLocale()
  const [expanded, setExpanded] = useState(false)
  // ⚠️ `now` PROP: `deriveHighlights`in varsayılanı `Date.now()` ve render'da
  // okumak bu depoda yasak (gerekçe FeedPage'te).
  const items = deriveHighlights(posts, kind, now)
  /**
   * ⚠️ **TAVAN `FEED.people.limit` (6) DEĞİL ARTIK** (istek, 2026-09-22:
   * *"aramıza yeni katılanları da ilk 3'ü göster diğer kartlar gibi"*).
   * Kart üç satır gösterip gerisini düğmeyle açıyor, yani altıda kesmenin
   * bir sebebi kalmadı — 6'da kesmek, açılan listeyi de altıyla sınırlardı.
   * `MAX_PEOPLE_ROWS` yalnızca patolojik bir duyuru yığınına karşı tavan.
   * ⚠️ `FEED.people.limit` DOKUNULMADI: `FeedPage`in "hiç kart var mı"
   * kapısı hâlâ onu okuyor ve orada anlamı farklı.
   */
  const all = peopleRows(items, MAX_PEOPLE_ROWS)
  const rows = expanded ? all : all.slice(0, 3)
  const hidden = all.length - rows.length
  // ⚠️ Kanca KOŞULSUZ çağrılır — `rows` boşken de. Erken dönüşün ardına
  // konan bir hook, kural gereği (ve pratikte: liste dolunca sıra
  // değişiyor) React'i düşürürdü.
  // ⚠️ Ünvan yalnız GÖRÜNEN satırlar için sorulur: kapalı kartta altı kişinin
  // dizin sorgusunu ödemenin karşılığı yok.
  const titles = usePeopleTitles(rows.filter((r) => r.isPerson).map((r) => r.label))
  // ⚠️ Boşken HİÇ çizilmez. "Tebrikler" sekmesinde İKİ blok yan yana
  // yaşıyor ve ikisi de boş olabiliyor; orada TEK bir boş durum kartı
  // çağıranda çiziliyor — blok başına bir kart, aynı cümleyi iki kez
  // yazmak olurdu.
  if (!all.length) return null
  const birthday = kind === "birthday"
  return (
    <RailSection
      title={t(birthday ? "feed.birthdays" : "feed.joiners")}
      icon={birthday ? BirthdayCakeIcon : UserAdd01Icon}
      meta={all.length}
    >
      <ul className={cn("flex flex-col gap-0.5", expanded && "max-h-[20rem] overflow-y-auto")}>
        {rows.map((row) => (
          <li key={row.key}>
            {/* ⚠️ KİŞİ SATIRI KİŞİ KARTINI AÇAR, DUYURUYU DEĞİL (2026-10-02,
                istek: *"kişiye tıkladığımızda kişi kartını görelim"*).
                Duyuru kaybolmadı: kartın altındaki "Duyuruyu aç" düğmesi.
                Konu satırı (kişi adı ayıklanamayan duyuru) eskisi gibi
                duyuruyu açar. Adres YOK — kart kişiyi dizinde ADLA arar ve
                tek bir kayda inmezse ayrıntı göstermez. */}
            <PersonPopover
              person={{ name: row.label }}
              side="left"
              context={
                row.isPerson
                  ? {
                      kind: birthday ? "birthday" : "joiner",
                      text: t("person.announced", { when: formatAgo(row.received, locale) }),
                    }
                  : undefined
              }
              extraAction={{
                label: t("person.openPost"),
                icon: ArrowUpRight01Icon,
                onClick: () => onOpen(row.postId),
              }}
            >
              {(trigger) => (
                <button
                  {...(row.isPerson
                    ? trigger
                    : { type: "button", onClick: () => onOpen(row.postId) })}
                  className="flex w-full items-center gap-2.5 rounded-xl px-2 py-1.5 text-left transition hover:bg-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 aria-expanded:bg-accent/60 [@media(pointer:coarse)]:min-h-11"
                >
                  {/* ⚠️ HALKA YOK. `ring-2` buraya konunca KARE çiziliyordu:
                      `PersonAvatar`ın kökü rozeti konumlandırmak için
                      `relative inline-block` ve yuvarlaklık İÇTEKİ elemanda —
                      yani halka avatarın değil o kutunun kenarını takip ediyordu
                      (sahada görüldü). Yuvarlak avatar zaten yeterli. */}
                  {row.isPerson && (
                    <PersonAvatar name={row.label} className="size-8 shrink-0 text-[0.6875rem]" />
                  )}
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span
                      lang={locale}
                      className={cn(
                        "text-[0.75rem] leading-snug text-foreground/90",
                        row.isPerson
                          ? "truncate font-semibold tracking-[-0.01em]"
                          : "font-medium [overflow-wrap:anywhere]",
                      )}
                    >
                      {row.label || t("feed.noSubject")}
                    </span>
                    {/* ⚠️ ÜNVAN VARSA TARİHİN YERİNE GEÇMEZ, ÜSTÜNE gelir ve
                        tarih bir kademe geriye düşer: "ne iş yapıyor" ile "ne
                        zaman katıldı" iki ayrı soru. Ünvan gelmediyse (kapsam
                        onaylı değil, ad dizinde eşleşmedi) satır bugünküyle
                        birebir aynı kalır. */}
                    {titles.get(row.label) && (
                      <span className="truncate text-[0.6875rem] leading-snug text-muted-foreground">
                        {titles.get(row.label)}
                      </span>
                    )}
                    <span className="text-[0.6875rem] text-muted-foreground">
                      {formatAgo(row.received, locale)}
                    </span>
                  </span>
                </button>
              )}
            </PersonPopover>
          </li>
        ))}
      </ul>
      {(hidden > 0 || expanded) && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          lang={locale}
          className="mt-1 w-full rounded-lg px-2 py-1.5 text-[0.6875rem] font-medium text-muted-foreground transition hover:bg-accent/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 [@media(pointer:coarse)]:min-h-9"
        >
          {expanded ? t("feed.cel.showLess") : t("feed.cel.showMore", { count: hidden })}
        </button>
      )}
    </RailSection>
  )
}

/**
 * "Doğum günleri" / "Aramıza yeni katılanlar" — İK ENTITYSİNDEN.
 *
 * ⚠️ **`FeedPeople` İLE AYNI GÖRSEL DİL, AYRI KAYNAK.** Öteki bileşen
 * postaların KONUSUNDAN ad ayıklıyor (bir tahmin); bu, İKnın kendi
 * kütüğünden okuyor (bir olgu). İkisi aynı anda çizilmez — çağıran, veri
 * gelmişse bunu, gelmemişse ötekini gösterir. İkinci bir satır tasarımı
 * yazmak, aynı çekmecede iki görsel dil olurdu.
 *
 * ⚠️ **SATIR KİŞİ KARTINI AÇAR** (2026-10-02). Bir tur "açılacak posta yok,
 * tıklanmaz" diye düz bırakılmıştı; açılacak şey artık kişinin kendisi
 * (`PersonPopover` — ünvan, iletişim, yönetici, Teams'te hazır kutlama).
 *
 * ⚠️ **DOĞUM YILI YOK** — veri katmanı zaten taşımıyor (gerekçe orada).
 */
export function CelebrationPeople({ kind, people }) {
  const { t, locale } = useLocale()
  const [expanded, setExpanded] = useState(false)
  // Gerçek yüzler: görünen satırların fotoğrafı (kişi kartının küçük fotoğrafıyla
  // aynı önbellek). Kanca erken dönüşten ÖNCE — kural gereği.
  const shown = expanded ? (people ?? []) : (people ?? []).slice(0, 3)
  const photos = usePeoplePhotos(shown.map((p) => p.mail).filter(Boolean))
  const photoOf = (mail) => (mail ? photos.get(String(mail).toLowerCase()) : undefined)
  const ids = useMyIdentity()
  if (!people?.length) return null
  const birthday = kind === "birthday"
  const anniversary = kind === "anniversary"
  /**
   * ⚠️ **ÖNCE ÜÇ SATIR, GERİSİ DÜĞMEYLE** (istek, 2026-09-22). Ölçülen
   * pencerede 25 doğum günü olabiliyor; üç kart alt alta durduğu için
   * tamamını açık çizmek ekranı tek karta veriyordu.
   *
   * ⚠️ **DÜĞME İKİNCİ BİR İSTEK ATMAZ — ÖLÇÜLDÜ.** "Önce azını çek, sonra
   * gerisini" denendi ve YANLIŞLANDI: aynı filtreyle 3 günlük pencere
   * 5.396 ms, 14 günlük pencere 5.112 ms — yani maliyet dönen SATIRDA
   * değil, sorgunun 55 yıl-aralığı koşulunda. İkinci bir çekim ikinci bir
   * ~3 saniye olurdu. Veri zaten elde; düğme yalnızca GÖSTERİYOR.
   */
  const rows = expanded ? people : people.slice(0, 3)
  const hidden = people.length - rows.length
  return (
    <RailSection
      title={t(anniversary ? "feed.anniversaries" : birthday ? "feed.birthdays" : "feed.joiners")}
      icon={anniversary ? Award01Icon : birthday ? BirthdayCakeIcon : UserAdd01Icon}
      meta={people.length}
    >
      {/* ⚠️ Tavan YALNIZ açıkken: kapalıyken üç satır zaten kısa, orada bir
          tavan yalnız gereksiz kaydırma çubuğu üretirdi (bir kez ölçüldü).
          ⚠️ `overscroll-contain` YOK — dibe gelince sayfa devam etmeli. */}
      <ul className={cn("flex flex-col gap-0.5", expanded && "max-h-[20rem] overflow-y-auto")}>
        {rows.map((person) => (
          <li key={person.key} className="shrink-0">
            {/* ⚠️ SATIR ARTIK TIKLANIR — kişi kartını açar (2026-10-02). Eski
                "açılacak bir şey yok, tıklanmaz" kuralının gerekçesi kalktı:
                açılacak şey kişinin kendisi. Kart adresle (İK kütüğünün
                `mserp_mail`i) dizine sorar ve kutlama düğmesi bağlamdan gelir. */}
            <PersonPopover
              person={{ name: person.name, address: person.mail, title: person.title }}
              side="left"
              context={{ kind, text: celebrationWhen(t, person, kind), years: person.years }}
            >
              {(trigger) => (
                <button
                  {...trigger}
                  className="flex w-full items-center gap-2.5 rounded-xl px-2 py-1.5 text-left transition hover:bg-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 aria-expanded:bg-accent/60 [@media(pointer:coarse)]:min-h-11"
                >
                  <PersonAvatar
                    name={person.name}
                    photo={photoOf(person.mail)}
                    className="size-8 shrink-0 text-[0.6875rem]"
                  />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="flex min-w-0 items-center gap-1.5">
                      <span
                        lang="tr"
                        className="truncate text-[0.75rem] font-semibold leading-snug tracking-[-0.01em] text-foreground/90"
                      >
                        {person.name}
                      </span>
                      {/* Kişinin KENDİSİ (2026-10-02): kartında "Kutla" yerine
                          "Senin günün" yazar — bkz. `PersonCard`. */}
                      {isMine(ids, person.mail) && (
                        <span
                          lang={locale}
                          className="shrink-0 rounded-full bg-brand/[0.1] px-1.5 py-px text-[0.5625rem] font-semibold uppercase tracking-[0.04em] text-brand-text"
                        >
                          {t("person.you")}
                        </span>
                      )}
                    </span>
                    {person.title && (
                      <span
                        lang="tr"
                        className="truncate text-[0.6875rem] leading-snug text-muted-foreground"
                      >
                        {person.title}
                      </span>
                    )}
                    <span lang={locale} className="text-[0.6875rem] text-muted-foreground">
                      {isMine(ids, person.mail) && person.inDays === 0 && kind !== "joiner"
                        ? kind === "anniversary"
                          ? `${t("feed.cel.years", { count: person.years })} · ${t("person.selfDay")}`
                          : t("person.selfDay")
                        : celebrationWhen(t, person, kind)}
                    </span>
                  </span>
                </button>
              )}
            </PersonPopover>
          </li>
        ))}
      </ul>
      {(hidden > 0 || expanded) && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          lang={locale}
          className="mt-1 w-full rounded-lg px-2 py-1.5 text-[0.6875rem] font-medium text-muted-foreground transition hover:bg-accent/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 [@media(pointer:coarse)]:min-h-9"
        >
          {expanded ? t("feed.cel.showLess") : t("feed.cel.showMore", { count: hidden })}
        </button>
      )}
    </RailSection>
  )
}

/**
 * Tebrikler kartlarının YÜKLENİYOR hâli.
 *
 * ⚠️ **NEDEN VAR — ÖLÇÜLMÜŞ SÜRE.** İK sanal entity'si 530 satırı ~12
 * saniyede döndürüyor (ilk koşuda ~171). O süre boyunca kart HİÇ
 * çizilmiyordu ve veri gelince ekran birden değişiyordu: kullanıcının
 * gördüğü "çok geç geliyor" tam olarak bu sessiz bekleme.
 *
 * ⚠️ **İSKELET, POSTADAN TÜRETİLEN LİSTE DEĞİL.** Yedek liste yalnız yetki
 * REDDEDİLDİĞİNDE çiziliyor; yüklenirken onu gösterip sonra İK listesiyle
 * DEĞİŞTİRMEK, aynı kartta iki farklı kişi kümesi göstermek olurdu.
 *
 * ⚠️ İskelet `aria-hidden`: ekran okuyucuya boş satır saydırmanın anlamı
 * yok, durumu çağıranın `aria-live` bölgesi söylüyor.
 */
export function CelebrationSkeleton({ kind }) {
  const { t } = useLocale()
  const anniversary = kind === "anniversary"
  const birthday = kind === "birthday"
  return (
    <RailSection
      title={t(anniversary ? "feed.anniversaries" : birthday ? "feed.birthdays" : "feed.joiners")}
      icon={anniversary ? Award01Icon : birthday ? BirthdayCakeIcon : UserAdd01Icon}
    >
      <div className="flex flex-col gap-0.5" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center gap-2.5 px-2 py-1.5">
            <Skeleton className="size-8 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1 space-y-1.5">
              <Skeleton className="h-2.5 w-28" />
              <Skeleton className="h-2 w-20" />
            </div>
          </div>
        ))}
      </div>
    </RailSection>
  )
}

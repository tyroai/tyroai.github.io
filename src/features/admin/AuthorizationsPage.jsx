import { HugeiconsIcon } from "@hugeicons/react"
import InboxIcon from "@hugeicons/core-free-icons/InboxIcon"
import CheckmarkCircle02Icon from "@hugeicons/core-free-icons/CheckmarkCircle02Icon"
import Clock01Icon from "@hugeicons/core-free-icons/Clock01Icon"
import PencilEdit01Icon from "@hugeicons/core-free-icons/PencilEdit01Icon"
import Tick02Icon from "@hugeicons/core-free-icons/Tick02Icon"
import Cancel01Icon from "@hugeicons/core-free-icons/Cancel01Icon"
import ArrowDown01Icon from "@hugeicons/core-free-icons/ArrowDown01Icon"
import Delete02Icon from "@hugeicons/core-free-icons/Delete02Icon"
import Alert02Icon from "@hugeicons/core-free-icons/Alert02Icon"
import UserAdd01Icon from "@hugeicons/core-free-icons/UserAdd01Icon"
import GridIcon from "@hugeicons/core-free-icons/GridIcon"
import Mail01Icon from "@hugeicons/core-free-icons/Mail01Icon"
import {
  CountChip,
  Eyebrow,
  FilterSegment,
  IdentityCell,
  PanelToolbar,
  SearchInput,
} from "@/features/security/primitives"
import { fold } from "@/lib/fold"
import { RAIL, railBase } from "@/features/security/rail"
import { BrandDialog, DestructiveDialog } from "@/features/security/dialogs"
import { APP_LOCK } from "@/lib/appLockPolicy"
import { useEffect, useMemo, useRef, useState } from "react"
import { useLocale } from "@/hooks/useLocale"
import { UpnField } from "./UpnField"
import { AppChecklist } from "./authz/AppChecklist"
import { AdminToggle } from "./authz/AdminToggle"
import { GateError } from "./authz/GateError"
import { ErrorCause } from "@/components/common/ErrorCause"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { daysSince, formatAgo, formatStamp } from "@/lib/date"
import { cn } from "@/lib/utils"

/**
 * ═══════════════════════════════════════════════════════════════════════
 *  YETKİLER (`/authorizations`) — yönetim ekranı
 * ═══════════════════════════════════════════════════════════════════════
 *
 * İki Dataverse tablosu yan yana: kimin neye yetkisi var
 * (`tyro_authorizedapp`) ve kim ne talep etmiş (`tyro_requestapp`).
 *
 * ⚠️ **APP SEÇİMİ KATALOGDAN, DEĞER İSİM.** Seçenekler `tyro_launcherapp`ten
 * CANLI geliyor (ConfigProvider zaten yüklü — ikinci bir sorgu yok), yani
 * katalogda yeni bir app açıldığında listede kendiliğinden beliriyor.
 * Kaydedilen şey GUID değil ADdır (`TYRO Trader;Power BI`): Dataverse'te
 * gerçek bir lookup değeri GUID tutardı ve hem ızgarada hem dışa aktarımda
 * okunamaz olurdu. Ayrıca bu depoda katalog GUID'i ortamlar arasında
 * değişiyor — asistanlar da aynı sebeple ADla eşleşiyor.
 *
 * ⚠️ **İSMİN BEDELİ GÖRÜNÜR KILINDI.** Bağ metinsel olduğu için katalogda
 * bir app yeniden adlandırılırsa o satırdaki ad boşa düşer. Sessiz kalmak
 * yerine, katalogda karşılığı OLMAYAN her ad uyarı renginde ve bir not ile
 * çiziliyor — yetkinin neden işlemediği ekrandan okunabilsin.
 *
 * ⚠️ **KAPI `useIsAppAdmin`** — Entra grubu DEĞİL, tablonun kendi
 * `tyro_isadmin` bayrağı. Gerekçesi `hooks/useAuthorizations.js` başında.
 *
 * ⚠️ **Yönetici olmayana sayfa AÇILIR ama içerik yerine sebep yazılır.**
 * Sessizce başka bir yere atmak, yer imi koymuş kullanıcıya uygulamayı
 * bozuk gösterirdi — `/security`de verilen kararın aynısı.
 */

/* Tarih biçimi `lib/date.js#formatStamp`ten geliyor: aynı damgayı kilitli
   kartın talep dökümü de gösteriyor ve iki ekranın aynı satırı farklı
   yazması "bu o talep mi" sorusunu doğururdu. */

function Section({ icon, title, hint, count, action, footer, children }) {
  const { locale } = useLocale()
  return (
    <section className="rounded-2xl border border-border bg-card">
      {/* ⚠️ Marka tonlu ikon karesi KALDIRILDI — bu sayfadaki yedi
          tekrardan biriydi (gerekçe `SecurityPage`in başlığında yazılı).
          İkon satır içinde, sessiz ve başlığın hizmetinde. */}
      <header className="flex items-start gap-2.5 border-b border-border/70 px-4 py-3">
        <HugeiconsIcon
          icon={icon}
          aria-hidden="true"
          className="mt-px size-4 shrink-0 text-muted-foreground/70"
          strokeWidth={1.8}
        />
        <div className="min-w-0 flex-1">
          <h2
            lang={locale}
            className="text-[0.9375rem] font-semibold leading-tight tracking-[-0.01em]"
          >
            {title}
          </h2>
          <p className="text-[0.75rem] leading-snug text-muted-foreground">{hint}</p>
        </div>
        <span className="flex shrink-0 items-center gap-2">
          {action}
          <CountChip>{count}</CountChip>
        </span>
      </header>
      {children}
      {footer}
    </section>
  )
}

function Empty({ children }) {
  return <p className="px-4 py-8 text-center text-[0.8125rem] text-muted-foreground">{children}</p>
}

/** Salt okunur app çipleri. Katalogda karşılığı olmayan ad UYARI renginde:
 *  yeniden adlandırma sessizce yetki düşürmesin. */

function StatusPill({ done, doneLabel, pendingLabel }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[0.75rem] font-medium",
        done
          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          : "bg-amber-500/10 text-amber-600 dark:text-amber-400",
      )}
    >
      <HugeiconsIcon
        icon={done ? CheckmarkCircle02Icon : Clock01Icon}
        className="size-3.5"
        strokeWidth={2}
      />
      {done ? doneLabel : pendingLabel}
    </span>
  )
}

/** Küçük, ikonlu satır eylemi. */
function RowButton({ icon, onClick, disabled, children, tone, title }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        "inline-flex items-center gap-1 rounded-lg border px-2 [min-height:max(1.75rem,28px)] text-[0.75rem] font-medium transition-colors disabled:opacity-60",
        tone === "primary"
          ? "border-transparent bg-brand-fill-deep text-brand-on-brand"
          : tone === "brand"
            ? "border-brand/30 bg-brand-soft/50 text-brand hover:bg-brand-soft/80"
            : "border-border bg-background text-foreground/[0.78] hover:bg-foreground/[0.04]",
      )}
    >
      <HugeiconsIcon icon={icon} className="size-3.5" strokeWidth={2} />
      {children}
    </button>
  )
}

/** Kapı + hata şeridi — iki panelin ortak kabuğu. */
export function Gate({ ctx, children }) {
  const { t, allowed, gateKey, error } = ctx
  if (!allowed) {
    return (
      <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-[0.8125rem] text-muted-foreground">
        {t(gateKey)}
      </p>
    )
  }
  return (
    <div className="flex flex-col gap-4">
      {error && <GateError ctx={ctx} />}
      {children}
      {ctx.fetchedAt ? (
        <p className="text-[0.75rem] text-muted-foreground">
          {t("authz.updated")} {formatStamp(new Date(ctx.fetchedAt).toISOString())}
        </p>
      ) : null}
    </div>
  )
}

/** ── Sekme 1: kimin neye yetkisi var ─────────────────────────────── */
/**
 * Yeni yetki satırı kutusu.
 *
 * ⚠️ **GİRİŞ ADRESİ (UPN), POSTA ADRESİ DEĞİL** — ve bu alanın altında
 * yazıyor. Ölçüldü (2026-09-17, TYRO dizini): 801 aktif kullanıcının
 * 237'sinde ikisi farklı. Posta adresiyle açılan bir satır o kişiyi
 * SESSİZCE yetkisiz yapar: hata çıkmaz, kullanıcı yalnız hiçbir şey
 * göremez. Bu, ekranın önleyebileceği en pahalı hata.
 *
 * App seçimi ZORUNLU DEĞİL: yetkisi olmayan ama yönetici olan bir kayıt
 * anlamlı (yetkileri yöneten kişi app'leri kendi kullanmıyor olabilir).
 */
export function NewAuthorizationDialog({ ctx }) {
  const { t, newRow, setNewRow, saveNewRow, busyId, writeError, writeErrorKey, authorizations } =
    ctx
  const busy = busyId === "new"
  const upn = newRow?.upn ?? ""
  const trimmed = upn.trim()

  // ⚠️ İSTEMCİ KONTROLÜ SUNUCUNUN YERİNE GEÇMEZ, ONDAN ÖNCE GELİR.
  // Tekilliğin otoritesi `tyro_useremail` alternate key'i (iki istemci aynı
  // anda yazarsa istemci kontrolü zaten geç kalır). Buradaki kontrolün işi
  // farklı: ağ turunu beklemeden, kutuyu kapatmadan söylemek.
  const duplicate = useMemo(() => {
    const k = trimmed.toLowerCase()
    if (!k) return null
    return authorizations.find((r) => r.upn.trim().toLowerCase() === k) ?? null
  }, [authorizations, trimmed])

  // Biçim kontrolü KASITLI OLARAK GEVŞEK: tek bir `@` ve iki yanında birer
  // karakter. Sıkı bir e-posta regex'i burada yanlış olurdu — bu bir posta
  // adresi değil bir GİRİŞ adresi ve UPN'ler posta kurallarına uymak
  // zorunda değil.
  // Ad yazıp öneri arayan kişiye biçim uyarısı erken: yalnız `@` yazıldıysa ya da alandan çıkınca.
  const [typing, setTyping] = useState(false)
  const malformed =
    trimmed.length > 0 && (!typing || trimmed.includes("@")) && !/^[^\s@]+@[^\s@]+$/.test(trimmed)
  // Önerilerde "kaydı var" işareti için: kayıtlı giriş adresleri.
  const taken = useMemo(
    () => new Set(authorizations.map((r) => r.upn.trim().toLowerCase())),
    [authorizations],
  )
  return (
    <BrandDialog
      open={!!newRow}
      onOpenChange={(o) => !o && !busy && setNewRow(null)}
      title={t("authz.new.title")}
      description={t("authz.new.body")}
      busy={busy}
      // Yatay ve geniş: solda kişi ve rol, sağda uygulamalar (dikey uzun kutu yerine).
      className="sm:max-w-5xl"
      plain
      footer={
        <>
          <Button variant="outline" onClick={() => setNewRow(null)} disabled={busy}>
            {t("authz.cancel")}
          </Button>
          <Button
            onClick={saveNewRow}
            disabled={busy || !trimmed || !!duplicate}
            className="gap-1.5 bg-brand-fill-deep text-brand-on-brand hover:bg-brand-fill-deep"
          >
            <HugeiconsIcon icon={UserAdd01Icon} className="size-3.5" strokeWidth={2} />
            {t("authz.new.save")}
          </Button>
        </>
      }
    >
      <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)]">
        <div className="flex min-w-0 flex-col gap-4">
          <Field
            htmlFor="authz-new-upn"
            icon={Mail01Icon}
            label={t("authz.col.user")}
            hint={t("authz.new.upnHint")}
          >
            <UpnField
              id="authz-new-upn"
              value={upn}
              onChange={(v) => setNewRow({ ...newRow, upn: v })}
              onFocusChange={setTyping}
              disabled={busy}
              warn={!!duplicate}
              taken={taken}
              placeholder={t("authz.new.placeholder")}
            />
            {/* Geri bildirim SIRAYLA: önce engelleyen şey (aynı kayıt var),
            sonra biçim uyarısı. Her ikisi de yoksa alanın kendi dersi
            (`hint`) kalıyor — üçünü birden yazmak kutuyu uyarı duvarına
            çevirirdi. */}
            {duplicate ? (
              <Note tone="amber" icon={Alert02Icon}>
                {t("authz.new.duplicate")}
              </Note>
            ) : malformed ? (
              <Note tone="muted">{t("authz.new.malformed")}</Note>
            ) : null}
          </Field>

          {/* ⚠️ YÖNETİCİ SEÇENEĞİ APP SEÇİCİNİN ÜSTÜNDE, ve bu sıra bilinçli:
          işaretlendiği an aşağısı gereksizleşiyor. Altta dursaydı kişi
          önce on app seçip sonra hepsinin boşa gittiğini öğrenirdi. */}
          <AdminToggle
            checked={!!newRow?.isAdmin}
            onChange={(v) => setNewRow({ ...newRow, isAdmin: v })}
            disabled={busy}
          />
        </div>
        <div className="min-w-0">
          {newRow?.isAdmin && APP_LOCK.adminBypass ? (
            <Note tone="emerald" icon={CheckmarkCircle02Icon}>
              {t("authz.apps.adminNote")}
            </Note>
          ) : (
            <Field icon={GridIcon} label={t("authz.col.apps")}>
              <AppChecklist
                value={newRow?.apps ?? []}
                onChange={(apps) => setNewRow({ ...newRow, apps })}
                disabled={busy}
              />
            </Field>
          )}
        </div>
      </div>

      {writeError && (
        <>
          <Note tone="amber" icon={Alert02Icon}>
            {t(writeErrorKey)}
          </Note>
          <ErrorCause detail={ctx.writeDetail} tone="warn" className="mt-1.5" />
        </>
      )}
    </BrandDialog>
  )
}

/** Kutu içindeki alan: ikonlu etiket + kontrol + isteğe bağlı ders. */
function Field({ htmlFor, icon, label, hint, children }) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={htmlFor}
        className="flex items-center gap-1.5 text-[0.75rem] font-medium text-foreground/[0.78]"
      >
        <HugeiconsIcon
          icon={icon}
          aria-hidden="true"
          className="size-3.5 shrink-0 text-muted-foreground/70"
          strokeWidth={1.8}
        />
        {label}
      </label>
      {children}
      {hint ? <p className="text-[0.6875rem] leading-snug text-muted-foreground">{hint}</p> : null}
    </div>
  )
}

/** Kutu içi not — üç ton, hepsi aynı ölçüde. */
function Note({ tone = "muted", icon, children }) {
  return (
    <p
      className={cn(
        "flex items-start gap-1.5 rounded-lg px-2.5 py-2 text-[0.6875rem] leading-snug",
        tone === "amber" &&
          "border border-amber-500/30 bg-amber-500/[0.07] text-amber-800 dark:text-amber-300",
        tone === "emerald" && "border border-emerald-500/25 bg-emerald-500/[0.07] text-foreground",
        tone === "muted" && "text-muted-foreground",
      )}
    >
      {icon ? (
        <HugeiconsIcon icon={icon} className="mt-px size-3 shrink-0" strokeWidth={2} />
      ) : null}
      {children}
    </p>
  )
}

/**
 * ── Sekme 1: kimin neye yetkisi var ───────────────────────────────────
 *
 * ⚠️ **TABLO GİTTİ, LİSTE GELDİ.** `<table>` + `overflow-x-auto`, sohbet
 * dock'unun yarıya indirebildiği bir kolonun içinde yapılabilecek en kötü
 * şeydi: dört sütunluk bir tabloyu 380px'lik bir telefonda yatay kaydırma
 * arkasına koymak duyarlılık değil tuzak. Artık tek ağaç var — geniş
 * ekranda tek satıra açılan, dar ekranda iki satıra inen bir liste
 * öğesi. "Genişte tablo, darda kart" ikilisi iki ayrı ağaç demekti ve
 * ikisi zamanla birbirinden ayrı düşerdi.
 *
 * ⚠️ **YÖNETİCİ HÜCRESİ ARTIK YALNIZ DURUM.** Eskiden aynı hücre kimi
 * satırda "Yönetici" (bir DURUM), kiminde "Yönetici yap" (bir KOMUT)
 * yazıyordu — sütunun taranamamasının sebebi tam olarak buydu. Göz bir
 * sütunda tek tür şey arar. Durum hücrede kaldı, fiil satır menüsüne
 * taşındı.
 *
 * ⚠️ **KORUMALI EYLEMLER `disabled` DEĞİL.** `disabled` bir düğme
 * işaretçi olaylarını yutuyor, yani `title` balonu KABA İŞARETÇİDE hiç
 * açılmıyor: dokunmatikte kural sessiz bir duvara dönüşüyordu. Bu deponun
 * kendi doktrini (bkz. TYRO Trader kilidi / `showAgentNoAccess`): tıklama
 * KABUL EDİLİR, kural elde reddedilir ve sebebi SÖYLENİR. Metinler zaten
 * dört sözlükte hazırdı.
 */
/**
 * Bu satırın app listesi erişimi BELİRLİYOR MU?
 *
 * ⚠️ Soru `row.isAdmin` DEĞİL. Yöneticinin listesi ancak `adminBypass`
 * açıkken anlamsız; şalter kapatılırsa (politikada tek satır) yönetici de
 * kendi listesiyle sınırlanır ve o hâlde listeyi gizlemek ekranın TERS
 * yönde yalan söylemesi olurdu. Kapı tek yerde: `lib/appLockPolicy.js`.
 */

/**
 * ── Sekme 2: kim ne talep etmiş ───────────────────────────────────────
 *
 * ⚠️ **TABLO DEĞİL KART, ve bunun sebebi notlar.** Talep satırı artık iki
 * serbest metin taşıyor (kullanıcının gerekçesi, yöneticinin cevabı); bunlar
 * bir hücreye sığmıyor ve kırpılmış bir gerekçe, okunmamış bir gerekçedir.
 * Kullanıcı yetkileri sekmesi tablo olarak KALDI — orada her alan kısa.
 */
function RequestCard({ ctx, row }) {
  const {
    t,
    locale,
    busyId,
    noteDraft,
    setNoteDraft,
    saveAdminNote,
    approve,
    toggleCompleted,
    setConfirmDelete,
  } = ctx
  const busy = busyId === row.id
  const editingNote = noteDraft.id === row.id

  const waiting = !row.isCompleted ? daysSince(row.createdOn) : 0
  return (
    <article
      className={cn(
        railBase,
        row.isCompleted ? RAIL.done : RAIL.pending,
        "border-b border-border/50 px-4 py-3.5 last:border-b-0",
        // Biten iş GERİ ÇEKİLİR ama okunmaz olmaz: üstüne gelince tam
        // mürekkebe dönüyor, çünkü denetim için bakılan şey de bu.
        row.isCompleted && "opacity-[0.72] transition-opacity hover:opacity-100",
      )}
    >
      <header className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1.5">
        <div className="min-w-0">
          <p className="truncate text-[0.875rem] font-semibold leading-tight">{row.app || "—"}</p>
          <IdentityCell upn={row.upn} size="sm" className="mt-0.5" />
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <StatusPill
            done={row.isCompleted}
            doneLabel={t("authz.req.done")}
            pendingLabel={t("authz.req.pending")}
          />
          {/* ⚠️ KUYRUKTA OKUNMASI GEREKEN ŞEY "ne kadar bekledi"dir.
              Kesin damga denetim bilgisi ve balonda duruyor. Üç günü
              geçen bekleme kehribara dönüyor — KIRMIZI DEĞİL: geciken bir
              talep bir hata değil, bir hatırlatma. */}
          <span
            title={formatStamp(row.createdOn)}
            className={cn(
              "text-[0.75rem] tabular-nums",
              waiting >= 3
                ? "font-medium text-amber-700 dark:text-amber-400"
                : "text-muted-foreground",
            )}
          >
            {formatAgo(row.createdOn, locale)}
          </span>
        </div>
      </header>

      {/* Kullanıcının gerekçesi SALT OKUNUR — yöneticinin düzeltebildiği
          bir gerekçe, değerlendirilen şeyin kendisini değiştirirdi. */}
      {row.userNote ? (
        <div className="mt-2.5 rounded-lg border border-border/70 bg-foreground/[0.025] px-3 py-2">
          <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.13em] text-muted-foreground">
            {t("authz.req.userNote")}
          </p>
          <p className="mt-0.5 whitespace-pre-wrap break-words text-[0.8125rem] leading-relaxed text-foreground">
            {row.userNote}
          </p>
        </div>
      ) : null}

      {/* ⚠️ YÖNETİCİ NOTUNU KULLANICI OKUR. Bu bir iç yorum alanı değil:
          aynı metin talep edenin kilitli kartındaki döküm kutusunda
          görünüyor. Kutunun altındaki satır bunu açıkça yazıyor, çünkü
          "sadece kendime not" sanıp yazılan bir cümle karşı tarafa
          gidiyorsa bu bir arıza olur. */}
      <div className="mt-2.5">
        {editingNote ? (
          <div className="space-y-1.5">
            <Textarea
              value={noteDraft.text}
              onChange={(e) => setNoteDraft({ id: row.id, text: e.target.value })}
              disabled={busy}
              rows={3}
              maxLength={2000}
              autoFocus
              placeholder={t("authz.req.adminNote.placeholder")}
              className="resize-none text-[0.8125rem]"
            />
            <p className="text-[0.6875rem] text-muted-foreground">
              {t("authz.req.adminNote.visible")}
            </p>
            <span className="flex gap-1.5">
              <RowButton
                icon={Tick02Icon}
                tone="brand"
                onClick={() => saveAdminNote(row)}
                disabled={busy}
              >
                {t("authz.save")}
              </RowButton>
              <RowButton
                icon={Cancel01Icon}
                onClick={() => setNoteDraft({ id: null, text: "" })}
                disabled={busy}
              >
                {t("authz.cancel")}
              </RowButton>
            </span>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setNoteDraft({ id: row.id, text: row.adminNote ?? "" })}
            className={cn(
              "group flex w-full items-start gap-2 rounded-lg border border-dashed border-border px-3 py-2 text-left",
              "transition-colors hover:border-brand/40 hover:bg-brand-soft/20",
            )}
          >
            <HugeiconsIcon
              icon={PencilEdit01Icon}
              className="mt-0.5 size-3.5 shrink-0 text-muted-foreground transition-colors group-hover:text-brand"
              strokeWidth={2}
            />
            <span className="min-w-0 flex-1">
              <span className="block text-[0.6875rem] font-semibold uppercase tracking-[0.13em] text-muted-foreground">
                {t("authz.req.adminNote")}
              </span>
              <span
                className={cn(
                  "mt-0.5 block whitespace-pre-wrap break-words text-[0.8125rem] leading-relaxed",
                  row.adminNote ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {row.adminNote || t("authz.req.adminNote.empty")}
              </span>
            </span>
          </button>
        )}
      </div>

      <footer className="mt-2.5 flex flex-wrap justify-end gap-1.5">
        {row.isCompleted ? (
          <RowButton icon={Cancel01Icon} onClick={() => toggleCompleted(row)} disabled={busy}>
            {t("authz.req.reopen")}
          </RowButton>
        ) : (
          /* ONAYLA app'i kisinin listesine EKLER ve talebi kapatir - iki
             adimi ayirmak yoneticiyi "once yetkiyi ver, sonra talebi
             isaretle" diye gereksiz bir siraya sokardi. */
          /* ⚠️ ONAYLA BU SEKMENİN BİRİNCİL EYLEMİ ve öyle görünmeli.
             Eskiden silmeyle aynı ağırlıktaydı; yapılacak iş ile
             temizlenecek kayıt aynı görünüyordu. */
          <RowButton icon={Tick02Icon} tone="primary" onClick={() => approve(row)} disabled={busy}>
            {t("authz.req.approve")}
          </RowButton>
        )}
        <RowButton icon={Delete02Icon} onClick={() => setConfirmDelete(row)} disabled={busy}>
          {t("authz.req.delete")}
        </RowButton>
      </footer>
    </article>
  )
}

export function AuthorizationsRequestsPanel({ ctx }) {
  const { t, status, requests, busyId, confirmDelete, setConfirmDelete, removeRequest } = ctx
  // ⚠️ Bu oturumda bir kart tamamlananlara GEÇTİYSE grup açık kalır:
  // yoksa "onayladım, nereye gitti?" anı yaratırdı. Katlama bir gizleme
  // değil, yoldan çekme.
  const [showDone, setShowDone] = useState(false)
  const doneCount = requests.filter((r) => r.isCompleted).length
  const prevDone = useRef(doneCount)
  useEffect(() => {
    if (doneCount > prevDone.current) setShowDone(true)
    prevDone.current = doneCount
  }, [doneCount])

  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState("pending")

  // ⚠️ VARSAYILAN "Bekleyen", "Tümü" DEĞİL. Bu sekmenin varlık sebebi
  // cevap bekleyen talepler; arşiv ikinci sorudur. Varsayılanı "tümü"
  // yapmak, her açılışta yöneticiye yapılacak işi kendi eliyle
  // ayıklatmak olurdu.
  const matched = useMemo(() => {
    const needle = fold(query)
    return requests.filter((r) => {
      if (filter === "pending" && r.isCompleted) return false
      if (filter === "done" && !r.isCompleted) return false
      if (!needle) return true
      // Notlar da taranıyor: "lisans" diye arayan yönetici, o gerekçeyle
      // gelen bütün talepleri bir arada görmek istiyor.
      return fold(`${r.upn} ${r.app} ${r.userNote} ${r.adminNote}`).includes(needle)
    })
  }, [requests, query, filter])

  const pending = matched.filter((r) => !r.isCompleted)
  const done = matched.filter((r) => r.isCompleted)
  const totalPending = requests.filter((r) => !r.isCompleted).length
  const totalDone = requests.length - totalPending

  return (
    <Gate ctx={ctx}>
      <PanelToolbar className="mb-3">
        <SearchInput value={query} onChange={setQuery} placeholder={t("authz.search.requests")} />
        <FilterSegment
          value={filter}
          onChange={setFilter}
          ariaLabel={t("authz.filter.label")}
          options={[
            { value: "pending", label: t("authz.filter.pending"), count: totalPending },
            { value: "done", label: t("authz.filter.done"), count: totalDone },
            { value: "all", label: t("authz.filter.all") },
          ]}
        />
      </PanelToolbar>

      <Section
        icon={InboxIcon}
        title={t("authz.req.title")}
        hint={t("authz.req.hint")}
        count={pending.length}
      >
        {requests.length === 0 ? (
          <Empty>{status === "loading" ? t("authz.loading") : t("authz.req.empty")}</Empty>
        ) : matched.length === 0 ? (
          <Empty>{t("authz.search.empty")}</Empty>
        ) : (
          <>
            {/* ⚠️ **KUYRUK ARŞİVDEN AYRILDI.** Sorgu `createdon desc` ile
                düz geliyor, yani yöneticinin yapacağı iş denetim geçmişinin
                arasına serpiliyordu ve "hangisi beni bekliyor" sorusunun
                cevabı ancak her rozeti okuyarak bulunuyordu. Bekleyenler
                üstte ve her zaman açık; tamamlananlar bir açılır satırın
                arkasında — silinmiyor, yalnız yoldan çekiliyor. */}
            {filter === "done" ? (
              done.map((row) => <RequestCard key={row.id} ctx={ctx} row={row} />)
            ) : pending.length > 0 ? (
              pending.map((row) => <RequestCard key={row.id} ctx={ctx} row={row} />)
            ) : (
              <Empty>{t("authz.req.allDone")}</Empty>
            )}

            {done.length > 0 && filter !== "done" && (
              <div className="border-t border-border/60">
                <button
                  type="button"
                  onClick={() => setShowDone((v) => !v)}
                  aria-expanded={showDone}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-left transition-colors hover:bg-foreground/[0.03] [@media(pointer:coarse)]:min-h-11"
                >
                  <HugeiconsIcon
                    icon={ArrowDown01Icon}
                    className={cn(
                      "size-3.5 shrink-0 text-muted-foreground transition-transform duration-200",
                      showDone && "rotate-180",
                    )}
                    strokeWidth={2}
                  />
                  <Eyebrow>{t("authz.req.doneGroup")}</Eyebrow>
                  <CountChip className="ml-auto">{done.length}</CountChip>
                </button>
                {showDone && done.map((row) => <RequestCard key={row.id} ctx={ctx} row={row} />)}
              </div>
            )}
          </>
        )}
      </Section>

      {/* ⚠️ SİLMEK ile ONAYLAMAK ayrı: onaylamak yetki verir ve izi
          bırakır, silmek yalnız kaydı kaldırır. Kutu bu farkı yazıyor,
          çünkü yanlış düğmeye basan kişi geri alamıyor. */}
      <DestructiveDialog
        open={!!confirmDelete}
        onOpenChange={(o) => !o && setConfirmDelete(null)}
        icon={Delete02Icon}
        title={t("authz.req.delete.title")}
        description={t("authz.req.delete.body.short")}
        subject={confirmDelete ? `${confirmDelete.app} · ${confirmDelete.upn}` : null}
        consequences={[
          { kind: "lose", text: t("authz.req.delete.lose") },
          { kind: "keep", text: t("authz.req.delete.approveInstead") },
        ]}
        confirmLabel={t("authz.req.delete")}
        cancelLabel={t("authz.cancel")}
        onConfirm={() => removeRequest(confirmDelete)}
        busy={busyId === confirmDelete?.id}
      />
    </Gate>
  )
}

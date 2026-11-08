import { useMemo } from "react"
import CloudIcon from "@hugeicons/core-free-icons/CloudIcon"
import RefreshIcon from "@hugeicons/core-free-icons/RefreshIcon"
import SquareLock02Icon from "@hugeicons/core-free-icons/SquareLock02Icon"
import { useLocale } from "@/hooks/useLocale"
import { disambiguate, recentTypeMix } from "@/features/feed/lib/filesInsights"
import { facetFolders, groupByDay } from "@/lib/filesQuery"
import { FILES_PAGE } from "@/lib/filesPolicy"
import { STATUS } from "@/lib/graph"
import { getNumberFormat, pluralKey } from "@/lib/intl-cache"
import { FileGroup, FileRow } from "./FileRow"
import { FolderChipsSkeleton, RowsSkeleton, StateRow } from "./FilesStates"
import { TypeChips } from "./FilesTiles"
import { FolderChipsFit } from "./FolderChipsFit"
import { LoadMore } from "./FilesViews"
import { AttachmentRow } from "./AttachmentRow"
import { useHomeTimeline } from "./useHomeTimeline"

/**
 * BUL'UN AÇILIŞI (Tümü) — pano, özet kartı YOK: arama satırının hemen altında liste başlar.
 *
 *   BAŞLIK      "Son dosyaların"; yanında (darda altında) tür kapıları — "Son 29 dosyanda
 *               ● Excel 10 · ● Word 3…", sessiz bağlantılar, tek satır
 *   KLASÖRLER   sık kullandığın klasörler — tek satır yumuşak hap, sığmayanlar "+N" menüsünde
 *   LİSTE       gün grupları — dosyalar ve e-posta ekleri tek zaman çizgisinde (`mergeTimeline`)
 *
 * Ekibin satırı yok: ekip Kişiler'in açılışında ve aramada zaten ilk sırada.
 * ⚠️ Liste boşsa, izin yoksa, okunamadıysa ya da oturum yoksa sebep ve çare listenin YERİNDE
 * tek satırda (`RecentStatus`): sessiz bir boşluk değil.
 * ⚠️ Arama satırı ve şerit bu bileşenin DIŞINDA (`FeedFiles`), her görünümde aynı yerde.
 * ⚠️ Odak sırası = DOM sırası = görsel sıra (CSS `order` yok).
 */
export function FilesHome(p) {
  const { recent, now, nonce, firstDay, hrefs, onDoor, connectFiles, retry } = p
  const { rowProps, placeOf, openItem, goToFolderOf, pendingFolder, fresh, ownDriveId, mail } = p
  const { t, locale } = useLocale()
  const num = getNumberFormat(locale)
  const ready = recent.status === STATUS.ready
  const line = useHomeTimeline({ recent, mail, now, nonce })
  const loading = recent.status === "loading" || recent.status === "idle" || line.pending
  const listed = ready && !line.pending && line.items.length > 0
  const folders = useMemo(
    () => (ready ? disambiguate(facetFolders(recent.items, FILES_PAGE.homeFolders)) : []),
    [ready, recent.items],
  )
  const groups = useMemo(() => groupByDay(line.items, now, firstDay), [line.items, now, firstDay])
  const mix = ready ? recentTypeMix(recent.typeCounts) : []
  const loaded = (recent.items ?? []).length

  return (
    <section
      aria-labelledby="files-recent-title"
      aria-busy={loading || undefined}
      className="min-w-0 scroll-mt-20"
    >
      <div className="files-home-head">
        <h2 id="files-recent-title" className="text-[1.125rem] font-semibold tracking-[-0.02em]">
          {recent.oneDrive ? t("myfiles.recent.oneDriveTitle") : t("myfiles.recent.title")}
        </h2>
        {listed && mix.length > 0 && (
          <TypeChips
            lead={t(pluralKey("myfiles.mix.recent", locale, loaded), { n: num.format(loaded) })}
            mix={mix}
            onPick={(id) => onDoor({ types: [id], person: "me" })}
          />
        )}
      </div>
      {/* Yalnız açık olmayan bilgi: liste OneDrive basamağına düştüyse söylenir. */}
      {recent.oneDrive && listed && (
        <p className="mt-1 text-[0.8125rem] text-muted-foreground">
          {t("myfiles.recent.oneDriveHint")}
        </p>
      )}
      {(loading || folders.length > 1) && (
        <div role="group" aria-label={t("myfiles.home.folders")} className="mt-3 min-w-0">
          {loading ? (
            <FolderChipsSkeleton />
          ) : (
            <FolderChipsFit
              folders={folders}
              title={t("myfiles.home.folders")}
              pendingKey={pendingFolder}
              onPick={(f) => goToFolderOf(f.sample, { key: f.url })}
              nameFor={(f) => (f.parentName ? `${f.parentName} › ${f.name}` : f.name)}
              labelFor={(f) => {
                const root = placeOf(f.sample)?.label?.split(" › ")[0] ?? ""
                return root === t("myfiles.loc.onedrive") ? "" : root
              }}
              ariaFor={(f) => {
                const name = f.parentName ? `${f.parentName} › ${f.name}` : f.name
                return t(pluralKey("myfiles.folder.aria", locale, f.count), {
                  name,
                  n: num.format(f.count),
                })
              }}
            />
          )}
        </div>
      )}

      {loading ? (
        <div className="mt-5">
          <RowsSkeleton rows={6} />
          <p role="status" className="sr-only">
            {t("myfiles.loading")}
          </p>
        </div>
      ) : listed ? (
        <>
          <div className="mt-5 flex flex-col gap-6">
            {groups.map((g) => (
              <FileGroup key={g.id} label={t(`myfiles.bucket.${g.id}`)} count={g.items.length}>
                {g.items.map((it) =>
                  it.kind === "attachment" ? (
                    <AttachmentRow
                      key={it.key}
                      item={it}
                      busy={line.busyKey === it.key}
                      onDownload={line.download}
                      now={now}
                      flat
                    />
                  ) : (
                    <FileRow
                      key={it.id}
                      item={it}
                      layout="flat"
                      place={placeOf(it)}
                      onOpen={openItem}
                      hideSelf
                      fresh={fresh.has(`${it.driveId}::${it.itemId ?? it.id}`)}
                      ownDriveId={ownDriveId}
                      {...rowProps}
                    />
                  ),
                )}
              </FileGroup>
            ))}
            <LoadMore
              hasMore={line.hasMore}
              loading={line.loadingMore}
              onMore={line.loadMore}
              capLine={
                recent.capReached ? t("myfiles.results.cap", { count: recent.items.length }) : ""
              }
            />
            <p className="px-1 text-[0.6875rem] text-muted-foreground">
              {t("myfiles.notice.indexLag")}
            </p>
          </div>
        </>
      ) : (
        <div className="mt-3">
          <RecentStatus
            recent={recent}
            // Sonuç hangi yenilemeden (`nonce`): eskisiyse yeni deneme yolda — düğme döner.
            retrying={recent.nonce !== nonce}
            oneDriveHref={hrefs.onedrive}
            onConnect={connectFiles}
            onRetry={retry}
          />
        </div>
      )}
    </section>
  )
}

/**
 * Listenin çizilemediği hâl, listenin yerinde. "Soramadık ≠ dosya yok": boş
 * liste OneDrive'a yol gösterir; izin yoksa "Bağlan", okuma düştüyse "Tekrar
 * dene" — izin penceresi açmaz (D-1); oturum yoksa basılacak bir şey yok.
 */
function RecentStatus({ recent, retrying, oneDriveHref, onConnect, onRetry }) {
  const { t } = useLocale()
  const { status, httpStatus, code, detail } = recent
  if (status === STATUS.ready)
    return (
      <StateRow
        icon={CloudIcon}
        tone="brand"
        title={t("myfiles.recent.empty")}
        body={t("myfiles.recent.emptyBody")}
        action={t("myfiles.loc.onedrive")}
        to={oneDriveHref}
      />
    )
  if (status === STATUS.denied)
    return (
      <StateRow
        icon={SquareLock02Icon}
        tone="warn"
        title={t("files.permissionTitle")}
        body={t("files.permissionBody")}
        cause={detail}
        action={t("files.connect")}
        actionTone="connect"
        onAction={onConnect}
      />
    )
  if (status === STATUS.error) {
    // Neden kodu (`detail`) ErrorCause'ta; yoksa eski HTTP satırı kalır.
    const line = [httpStatus && `HTTP ${httpStatus}`, code].filter(Boolean).join(" · ")
    // 429'da tekrar denemeler de tıkandı: sorun bizde değil, "yoğun, biraz sonra".
    const throttled = httpStatus === 429
    return (
      <StateRow
        tone="warn"
        title={throttled ? t("myfiles.state.throttled") : t("myfiles.state.error")}
        body={throttled ? null : t("files.errorBody")}
        detail={!detail && line ? t("myfiles.state.detail", { detail: line }) : null}
        cause={detail}
        action={t("files.retry")}
        actionIcon={RefreshIcon}
        onAction={onRetry}
        busy={retrying}
      />
    )
  }
  if (status === STATUS.unauthenticated) return <StateRow title={t("files.signedOut")} />
  return null
}

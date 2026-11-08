import { useEffect, useRef } from "react"
import { ActionButton } from "@/components/common/ActionButton"
import { useSlow } from "@/components/onenote/useSlow"
import { useLocale } from "@/hooks/useLocale"

/** Yükleme uzayınca iskeletin altında bir satır ipucu (`useSlow`). */
export function SlowHint() {
  const { t } = useLocale()
  const slow = useSlow()
  if (!slow) return null
  return (
    <p role="status" className="px-1 pt-3 text-center text-[0.75rem] text-muted-foreground">
      {t("onenote.slow")}
    </p>
  )
}

/**
 * Listenin sonu: büyük hesapta notlar PARÇA PARÇA gelir (`useOneNotePages`). Satır görünür olunca
 * (kaydırınca, ya da liste ekranı doldurmuyorsa hemen) sıradaki parçayı ister; düğme klavye ve
 * gözlemcisiz tarayıcı için aynı işi yapar. `auto` kapalıyken (aramada, boş listede) kendiliğinden
 * istemez: eşleşmeyen bir arama milyon notu sırayla çekmesin, düğme elle sürdürür. Gözlemci her
 * parçadan sonra yeniden kurulur (`count`): yeni parçadan sonra da görünür kalıyorsa gözlemci tek
 * başına bir daha tetiklenmezdi. Hata varsa kendiliğinden denenmez (istek yağmuru olmasın).
 */
export function OneNoteMore({ hasMore, loading, error, count, auto, onMore }) {
  const { t } = useLocale()
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!auto || !hasMore || loading || error || !el || typeof IntersectionObserver === "undefined")
      return undefined
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) onMore()
      },
      { rootMargin: "240px" },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [auto, hasMore, loading, error, count, onMore])
  return (
    <div
      ref={ref}
      className="flex flex-col items-center gap-2 px-1 py-4 text-[0.75rem] text-muted-foreground"
    >
      {loading ? (
        <p role="status">{t("onenote.more.loading")}</p>
      ) : error ? (
        <>
          <p role="status">{t("onenote.more.error")}</p>
          <ActionButton tone="soft" size="inline" onClick={onMore}>
            {t("onenote.retry")}
          </ActionButton>
        </>
      ) : (
        <ActionButton tone="soft" size="inline" onClick={onMore}>
          {t("onenote.more")}
        </ActionButton>
      )}
    </div>
  )
}

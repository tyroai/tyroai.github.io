import { useMemo } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import Folder01Icon from "@hugeicons/core-free-icons/Folder01Icon"
import { useLocale } from "@/hooks/useLocale"
import { useRecentFiles } from "@/hooks/useRecentFiles"
import { recentRows } from "@/features/widgets/lib/widgetSources"
import { cn } from "@/lib/utils"
import { FILE_KIND, FILE_OTHER } from "./fileKinds"
import { ago } from "./format"
import { WidgetBody } from "./WidgetBody"
import { WidgetEmpty } from "./WidgetEmpty"
import { WidgetFrame } from "./WidgetFrame"
import { PageBody, Pager } from "./paging/Pager"
import { usePager } from "./paging/usePager"

/**
 * Kaldığın yerden devam — son çalıştığın belgeler (OneDrive · SharePoint · Teams): oluşturduğun
 * ya da son değiştirdiğin, Dosyalarım'ın "son çalıştıkların" araması (`useRecentFiles`, aynı
 * önbellek); satıra basınca belge tarayıcıda açılır.
 */
export function RecentFilesWidget({ className }) {
  const { t, locale } = useLocale()
  const res = useRecentFiles({ enabled: true })
  const files = useMemo(() => recentRows(res.items), [res.items])
  const pager = usePager(files, 3)
  return (
    <WidgetFrame
      id="recent-files"
      title={t("widgets.files.title")}
      shortTitle={t("widgets.files.titleShort")}
      icon={Folder01Icon}
      busy={res.status === "loading"}
      className={className}
      pager={<Pager pager={pager} label={t("widgets.files.title")} />}
    >
      <WidgetBody status={res.status} rows={4}>
        {files.length ? (
          <PageBody pager={pager} className="mt-3">
            {pager.items.map((f) => {
              const [icon, tone] = FILE_KIND[f.type] ?? FILE_OTHER
              return (
                <li key={f.id}>
                  <a
                    href={f.webUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={f.title}
                    className="-mx-2 flex min-h-11 items-center gap-2.5 rounded-xl px-2 transition hover:bg-accent/60"
                  >
                    <span
                      className={cn("grid size-8 shrink-0 place-items-center rounded-lg", tone)}
                    >
                      <HugeiconsIcon icon={icon} className="size-4" strokeWidth={1.8} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[0.8125rem] font-medium">{f.title}</span>
                      <span className="block truncate text-[0.6875rem] text-muted-foreground">
                        {[f.container, ago(f.at, locale)].filter(Boolean).join(" · ")}
                      </span>
                    </span>
                  </a>
                </li>
              )
            })}
          </PageBody>
        ) : (
          <WidgetEmpty icon={Folder01Icon}>{t("widgets.files.empty")}</WidgetEmpty>
        )}
      </WidgetBody>
    </WidgetFrame>
  )
}

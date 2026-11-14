import { SkelLine } from "@/components/common/bento"
import { useLocale } from "@/hooks/useLocale"
import "./foryou.css"

/**
 * SANA ÖZEL İSKELETİ — listenin GERÇEK kabuklarıyla: liste başı, iki raf kartı, üç satır. Üstteki
 * özet kartı istek üzerine kalktı; iskelet de onu çizmez (yüklenince yer değişmesin).
 * İki iş görüyor: tembel parça inerken `Suspense` yedeği (`FeedPage`) ve panonun yükleme hâli.
 */
export function ForYouSkeleton() {
  const { t } = useLocale()
  return (
    <div className="@container/foryou min-w-0" aria-busy="true">
      <div className="pb-20">
        <p role="status" className="sr-only">
          {t("myspace.loading")}
        </p>
        <section aria-hidden="true">
          <p className="text-[1.25rem] font-semibold tracking-[-0.02em] @[34rem]/foryou:text-[1.375rem]">
            {t("feed.important.list.title")}
          </p>
          <SkelLine text="mt-1 text-[0.8125rem] leading-snug" width="w-2/3 max-w-[72ch]" />
          <div className="mt-5 space-y-7">
            <ul className="grid grid-cols-1 gap-3 @[30rem]/foryou:grid-cols-2 @[30rem]/foryou:gap-4">
              {[0, 1].map((i) => (
                <li key={i} className="ms-surface flex flex-col rounded-[1.5rem] p-4">
                  <span className="flex items-start gap-2.5">
                    <span className="ms-skeleton size-8 shrink-0 rounded-full" />
                    <span className="min-w-0 flex-1">
                      <SkelLine text="text-[0.8125rem]" width="w-28" />
                      <SkelLine text="mt-0.5 text-[0.6875rem]" width="w-16" />
                    </span>
                  </span>
                  <SkelLine text="mt-3 text-[0.9375rem] leading-snug" width="w-4/5" />
                  <SkelLine text="mt-1 text-[0.8125rem] leading-relaxed" width="w-full" />
                  <SkelLine text="text-[0.8125rem] leading-relaxed" width="w-2/3" />
                  <span className="ms-skeleton mt-4 block h-8 w-28 rounded-full" />
                </li>
              ))}
            </ul>
            <div>
              <span className="ms-skeleton mb-2 ml-3 block h-3 w-28 rounded-full" />
              <ul className="ms-surface rounded-[1.5rem] p-1.5">
                {["w-3/5", "w-1/2", "w-2/3"].map((w) => (
                  <li key={w} className="flex items-start gap-3 rounded-[1.125rem] px-3 py-3">
                    <span className="ms-skeleton mt-0.5 size-9 shrink-0 rounded-full" />
                    <span className="min-w-0 flex-1">
                      <SkelLine text="text-[0.8125rem]" width="w-32" />
                      <SkelLine text="mt-1 text-[0.875rem] leading-snug" width={w} />
                      <SkelLine text="mt-0.5 text-[0.8125rem]" width="w-4/5" />
                    </span>
                    <span className="ms-skeleton h-8 w-20 shrink-0 self-center rounded-full" />
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

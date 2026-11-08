import { PageHeading } from "@/components/common/SectionHeading"
import { HugeiconsIcon } from "@hugeicons/react"
import UserAdd01Icon from "@hugeicons/core-free-icons/UserAdd01Icon"
import { ActionButton } from "@/components/common/ActionButton"
import { RefreshButton } from "@/components/common/RefreshButton"
import { useLocale } from "@/hooks/useLocale"
import { cn } from "@/lib/utils"

/**
 * Sayfa başı: başlık + tek satır; sağda ortak Yenile (`RefreshButton`) ve tek birincil eylem
 * ("Kişi ekle"), araç çubuğu standardında (`docs/design-system.md` › Araç çubuğu standardı).
 * Telefonda birincil eylem başparmak bölgesindeki yüzen düğmede (`AddPersonFab`), burada yok.
 */
export function PageHead({ ctx, phone, onAdd, showActions }) {
  const { t } = useLocale()
  const loading = ctx.status === "loading"
  return (
    <PageHeading
      eyebrow={t("security.eyebrow")}
      title={t("security.title")}
      description={t("security.page.subtitle")}
      actions={
        showActions && (
          // Telefonda 44 px düğmenin ortası başlık satırının ortasında dursun.
          <div className={cn("flex shrink-0 items-center gap-controls", phone && "-mt-2")}>
            <RefreshButton
              iconOnly={phone}
              label={t("authz.reload")}
              busy={loading}
              onRefresh={ctx.reload}
            />
            {!phone && (
              <ActionButton tone="prominent" size="toolbar" onClick={onAdd}>
                <HugeiconsIcon icon={UserAdd01Icon} strokeWidth={1.9} />
                {t("security.add")}
              </ActionButton>
            )}
          </div>
        )
      }
    />
  )
}

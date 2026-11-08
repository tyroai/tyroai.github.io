import { useEffect, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import Settings02Icon from "@hugeicons/core-free-icons/Settings02Icon"
import { Button } from "@/components/ui/button"
import { useLocale } from "@/hooks/useLocale"
import { notify } from "@/lib/notify"
import { requestNotificationPermission, showNotification } from "@/lib/notify/browserNotify"
import { osNotificationSettings } from "@/lib/notify/osSettings"
import { Group, Row, StatusChip } from "./rows"
import { permissionLabel, permissionState } from "./status"

const TONE = { granted: "success", denied: "danger", default: "muted", unsupported: "muted" }

/**
 * Bildirimler — tek durum satırı + doğru sonraki eylem. "Hiç bildirim gelmiyor" üç arızanın
 * ortak görüntüsü (izin yok · tarayıcı engelledi · işletim sistemi kapattı); test düğmesi sohbetin
 * koşullarını atlayıp doğrudan gösterir. `shown:true` yalnız "tarayıcı kabul etti" demek —
 * OS'in yutup yutmadığı JS'ten okunmaz, o yüzden cevap kullanıcıdan alınır.
 */
export function NotificationsSection() {
  const { t } = useLocale()
  const [permission, setPermission] = useState(permissionState)
  const [testing, setTesting] = useState(false)
  // null → sorulmadı · "ask" → "göründü mü?" · "help" → görünmedi, tarif göster
  const [verify, setVerify] = useState(null)
  const osTarget = osNotificationSettings()

  // İzin adres çubuğundaki kilitten ya da OS ayarından değişir: sekmeye dönünce yeniden okunur,
  // yoksa "Tarayıcı engelledi" çipi izin açıldıktan sonra da kalırdı.
  useEffect(() => {
    const reread = () => {
      if (document.visibilityState === "visible") setPermission(permissionState())
    }
    document.addEventListener("visibilitychange", reread)
    window.addEventListener("focus", reread)
    return () => {
      document.removeEventListener("visibilitychange", reread)
      window.removeEventListener("focus", reread)
    }
  }, [])

  async function allow() {
    const next = await requestNotificationPermission()
    setPermission(next)
    if (next === "granted") notify.success(t("chat.notify.enabled"))
  }

  async function test() {
    setTesting(true)
    setVerify(null)
    try {
      const shown = await showNotification({
        title: t("settings.notify.testTitle"),
        body: t("settings.notify.testBody"),
        tag: "tyro-notify-test",
        urgent: true,
      })
      setVerify(shown ? "ask" : "help")
      if (!shown) notify.error(t("settings.notify.testFailed"))
    } finally {
      setTesting(false)
    }
  }

  const osHelp = (
    <div className="space-y-2 px-4 py-3">
      <p className="text-xs leading-relaxed text-muted-foreground">
        {t(osTarget.hintKey, t("settings.notify.osHint", ""))}
      </p>
      {osTarget.url ? (
        // Şema resmî belgeli değil ve tarayıcı onay ister: yazılı tarif üstte, düğme tek yol değil.
        <a
          href={osTarget.url}
          className="inline-flex min-h-9 items-center gap-1.5 text-xs font-medium text-foreground underline-offset-4 hover:underline pointer-coarse:min-h-11"
        >
          <HugeiconsIcon icon={Settings02Icon} className="size-3.5" strokeWidth={2} />
          {t("chat.notify.help.open")}
        </a>
      ) : null}
    </div>
  )

  return (
    <div className="space-y-8">
      <Group footer={t("profile.notify.scopeNote")}>
        <Row label={t("settings.notify.rowTitle")}>
          <StatusChip tone={TONE[permission] ?? "muted"}>
            {permissionLabel(permission, t)}
          </StatusChip>
        </Row>

        {permission === "default" ? (
          <Row label={t("profile.notify.allowHint")}>
            <Button
              type="button"
              size="sm"
              className="bg-brand-fill-deep text-brand-on-brand hover:bg-brand-fill-deep hover:brightness-110 pointer-coarse:h-11"
              onClick={allow}
            >
              {t("chat.notify.allow")}
            </Button>
          </Row>
        ) : null}

        {permission === "granted" ? (
          <Row label={t("profile.notify.testHint")}>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="pointer-coarse:h-11"
              disabled={testing}
              onClick={test}
            >
              {t("settings.notify.test")}
            </Button>
          </Row>
        ) : null}

        {permission === "denied" ? (
          <div className="px-4 py-3 text-xs leading-relaxed text-foreground/85">
            {t("settings.notify.deniedHelp")}
          </div>
        ) : null}

        {verify === "ask" ? (
          <div className="flex flex-wrap items-center gap-2 px-4 py-3">
            <span className="min-w-0 flex-1 basis-48 text-sm">{t("chat.notify.verify.q")}</span>
            <Button
              type="button"
              size="sm"
              className="bg-brand-fill-deep text-brand-on-brand hover:bg-brand-fill-deep hover:brightness-110 pointer-coarse:h-11"
              onClick={() => {
                setVerify(null)
                notify.success(t("chat.notify.enabled"))
              }}
            >
              {t("chat.notify.verify.yes")}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="pointer-coarse:h-11"
              onClick={() => setVerify("help")}
            >
              {t("chat.notify.verify.no")}
            </Button>
          </div>
        ) : null}

        {verify === "help" || permission === "denied" ? osHelp : null}
      </Group>

      {verify !== "help" && permission !== "denied" ? (
        <Group label={t("profile.notify.osTitle")}>{osHelp}</Group>
      ) : null}
    </div>
  )
}

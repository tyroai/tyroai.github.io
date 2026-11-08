import { useCallback, useMemo, useState } from "react"
import { recordQuestion } from "@/features/selfservice/recordText"
import { useNewRecordWatch } from "@/features/selfservice/useNewRecordWatch"
import { useRequestOpener } from "@/features/selfservice/useRequestOpener"
import { useLocale } from "@/hooks/useLocale"
import { useSelfServiceProfile } from "@/hooks/useSelfServiceProfile"
import { leavePreview, openedRecord } from "@/features/calendar/lib/leaveDesk"
import { requestOpenChat, setPendingAsk, setPendingFiles } from "@/lib/chatBus"
import { startOfDay } from "@/lib/leaveDays"
import { notify } from "@/lib/notify"

// Self Servis soruları birincil asistana (İK araçları onda); fareli cihazda imleç sohbete geçer.
const HR_AGENT = "tyroOffice"
const finePointer = () => Boolean(window.matchMedia?.("(pointer: fine)").matches)
// Gönderilen formun odağı açan öğeye dönmez; ERP yolunda sohbet de açılmaz: odak Yeni düğmesine
// (`HeaderTools › NewButton`) bırakılır, body'ye düşmez.
const focusNew = () =>
  requestAnimationFrame(() =>
    document.querySelector('[data-tour="cal-new"]')?.focus({ preventScroll: true }),
  )

/**
 * Takvimin İZİN MASASI: Self Servis'in iki yüzeyi takvimin üstünde, sayfadan ayrılmadan — izin
 * talebi formu (`LazyRequestDialog`, gün dolu) ve kaydın ayrıntısı (`RecordSheet`: pencere ya da
 * telefonda çekmece, Yazdır · İmzala & Mail · TYRO · Bağlantı dahil). Veri `LeaveSource`un
 * (`useSelfService`, Self Servis'le AYNI önbellek); talep gidince yeni kayıt gelene dek gözcü
 * yoklar (`useNewRecordWatch`) ve takvim kendiliğinden tazelenir.
 *
 * Dönen: `value` (bağlam: `newLeave(gün, açanÖğe)`, `openLeave(kayıt)`, `person`, `openId`,
 * `newKeys`), `request` ve `sheet` (pencerelerin özellikleri).
 */
export function useLeaveDeskState(leave) {
  const { t, locale } = useLocale()
  const { form, setForm, onNew } = useRequestOpener()
  // { id } (listeden ya da çipten) · { preview } ("Kaydı göster": yazılan kayıt, listeye gelene dek).
  const [open, setOpen] = useState(null)
  const data = leave.data
  const worker = data?.worker ?? null
  // Yazdırılan forma ve izin formuna giren kişi bilgisi (Graph birincil; Self Servis'le aynı kanca).
  const profile = useSelfServiceProfile(worker, { erpLoading: leave.status === "loading" })
  const balance = data?.balance ?? null
  const person = useMemo(() => ({ profile, worker, balance }), [profile, worker, balance])
  const watch = useNewRecordWatch({ data, refresh: leave.poll })
  const record = openedRecord(open, data?.leaves, watch.arrived)

  // "TYRO'ya gönder": talep sohbete gider, rıhtım açılır; kayıt ERP'ye yansıyana dek yoklanır.
  const onSubmit = (kind, { text, files, card }) => {
    setPendingFiles(files)
    setPendingAsk({ question: text, agent: HR_AGENT, card })
    setForm(null)
    requestOpenChat({ focusComposer: finePointer() })
    watch.start(kind)
  }
  // "Gönder"in ERP yolu: kayıt ERP'de, sohbet açılmaz; "Kaydı göster" ayrıntıyı hemen açar.
  const onErpDone = (kind, result) => {
    setForm(null)
    watch.start(kind)
    setTimeout(leave.poll, 1500)
    if (result.show) setOpen({ preview: leavePreview(result.preview) })
    else focusNew()
    notify.success(t("selfService.erp.toast.leave"))
  }
  const ask = useCallback(
    (r) => {
      setPendingAsk({ question: recordQuestion(r, t, locale), agent: HR_AGENT })
      requestOpenChat({ focusComposer: finePointer() })
    },
    [t, locale],
  )

  // `preset`: Anlat'ın okuduğu (`{ values, text }`, Self Servis'in Anlat'ıyla aynı değerler): formun başında
  // yazılan cümle görünür; yazılmayan alan basılan günle açılır.
  const newLeave = useCallback(
    (day, from = null, preset = null) => {
      const on = startOfDay(day)
      // Sanal nokta (boş saate basış) odağa dönülecek bir öğe değil.
      const opener = from instanceof HTMLElement ? from : null
      const values = { start: on, end: on, ...preset?.values }
      onNew("leave", opener, { values, text: preset?.text })
    },
    [onNew],
  )
  const openLeave = useCallback((r) => setOpen({ id: r.id }), [])
  const openId = record?.id ?? null
  const newKeys = watch.newKeys
  const value = useMemo(
    () => ({ person, openId, newKeys, newLeave, openLeave, ask }),
    [person, openId, newKeys, newLeave, openLeave, ask],
  )

  const request = {
    request: form,
    onClose: () => setForm(null),
    onSubmit,
    balance: data?.balance ?? null,
    leaves: data?.leaves ?? null,
    teamEnabled: (profile.team?.size ?? 0) > 0,
    advances: data?.advances ?? null,
    expenses: data?.expenses ?? null,
    company: profile.company ?? null,
    me: { name: profile.name, companyCode: profile.companyCode },
    erp: {
      alias: worker?.alias ?? null,
      uploader: profile.name ?? worker?.name ?? "",
      onDone: onErpDone,
      person,
    },
  }
  const sheet = { record, person, onOpenChange: (o) => !o && setOpen(null), onAsk: ask }
  return { value, request, sheet }
}

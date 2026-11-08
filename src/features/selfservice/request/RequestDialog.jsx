import "@/lib/i18n/selfService"
import { useId, useMemo, useRef, useState } from "react"
import { useIsMobile } from "@/hooks/use-mobile"
import { useLocale } from "@/hooks/useLocale"
import { expenseFormProgress, formProgress } from "@/features/selfservice/lib/formProgress"
import { leaveChecks } from "@/lib/leaveImpact"
import { FORM_TEMPLATE } from "@/lib/requestForm"
import { clearDraft } from "@/lib/requestDrafts"
import { CoachTour } from "@/components/tour/CoachTour"
import { tabOf } from "../kinds"
import { FormNarrate } from "../narrate/FormNarrate"
import { PastAdvances } from "./advance/PastAdvances"
import { useAdvanceDesk } from "./advance/useAdvanceDesk"
import { DiscardConfirm } from "./DiscardConfirm"
import { useErpDirect } from "./erp/useErpDirect"
import { ExpenseMeta } from "./expense/head/ExpenseMeta"
import { focusFirstEmpty } from "./expense/summary/focusField"
import { useExpenseFlow } from "./expense/useExpenseFlow"
import { useGridRoom } from "./expense/useGridRoom"
import { footerSlots } from "./footerSlots"
import { RequestBody } from "./RequestBody"
import { RequestFooter } from "./RequestChrome"
import { RequestSheet } from "./RequestSheet"
import { discardSummary, expenseContext, requestContext } from "./requestText"
import { RequestWindow } from "./RequestWindow"
import { SentCheck } from "./SentCheck"
import { TyroSendButton } from "./TyroSendButton"
import { useDraftAutosave } from "./useDraftAutosave"
import { useExpenseColumns } from "./useExpenseColumns"
import { useExpenseOwners } from "./useExpenseOwners"
import { useFitHeight } from "./useFitHeight"
import { useFormKeys } from "./useFormKeys"
import { usePhoneSteps } from "./usePhoneSteps"
import { useRequestClose } from "./useRequestClose"
import { useRequestForm } from "./useRequestForm"
import { useRequestSubmit } from "./useRequestSubmit"
import "./requestForm.css"

/**
 * YENİ TALEP FORMU — izin, masraf (çok kalemli, fiş görselli), iş avansı. Masaüstünde ortada
 * geniş pencere (`RequestWindow`; masrafta kalem tablosu ve özet paneli), telefonda tam boy alt
 * çekmece (`RequestSheet`; kalemler kart kart, izin ve avans iki adım). Alanlar sohbetin alanlı
 * şablonundan üretilir; "TYRO'ya gönder" toplanan veriyi şablonun cümlesiyle İK asistanına yollar
 * (`onSubmit`, önce kısa bir ✓). `leaves`, `advances`, `expenses` (ERP kayıtları) formun derin
 * parçalarına `requestData` bağlamıyla gider; `teamEnabled` (Ekibim'i görebilen) izin formuna.
 * `request`: `{ kind, seq, from, initial?, origin? }` ya da `null` — `initial` taslaktan ya da
 * sohbetteki karttan dönen form, `origin` formun başındaki not (`RequestNote`). Kapanış animasyonu
 * süresince son form çizilir, her açılış taze bir formla başlar (`seq`); kapanınca odak açan öğeye
 * (`from`) döner. Yazılanlar taslak olarak saklanır (`useDraftAutosave`); dolu form sormadan
 * kapanmaz: "Girdiklerin ne olsun?" (`DiscardConfirm`) — taslak olarak sakla · forma dön · sil.
 * `erp`: `{ alias, uploader, onDone }` — "ERP'ye gönder" yolu (politikadaki kişide, `erp/`).
 * `me`: `{ name, companyCode }` (Self Servis profili) — masrafta "Kendim" yerine ad, açıklamada ad
 * ve şirket İK kaydındaki şirketle listeden seçili açılır (`useExpenseOwners`).
 */
export function RequestDialog({
  request,
  onClose,
  onSubmit,
  balance,
  company,
  leaves,
  teamEnabled,
  advances,
  expenses = null,
  erp = null,
  me = null,
}) {
  const [src, setSrc] = useState(request)
  const [last, setLast] = useState(request)
  if (request && request !== src) {
    setSrc(request)
    setLast(request)
  }
  if (!last) return null
  // "Yeni başla": taslak silinir, form boş açılır (yeni anahtar: durum sıfırdan).
  const restart = () => {
    clearDraft(last.kind)
    setLast({ ...last, seq: `${last.seq}+`, initial: null, origin: null })
  }
  return (
    <RequestPanel
      key={last.seq}
      kind={last.kind}
      from={last.from}
      initial={last.initial ?? null}
      origin={last.origin ?? null}
      onRestart={restart}
      open={Boolean(request)}
      onClose={onClose}
      onSubmit={onSubmit}
      balance={balance}
      company={company}
      leaves={leaves}
      teamEnabled={teamEnabled}
      advances={advances}
      expenses={expenses}
      erp={erp}
      me={me}
    />
  )
}

function RequestPanel({
  kind,
  from,
  initial,
  origin,
  onRestart,
  open,
  onClose,
  onSubmit,
  balance,
  company,
  leaves,
  teamEnabled,
  advances,
  expenses,
  erp,
  me,
}) {
  const { t, locale } = useLocale()
  const mobile = useIsMobile()
  const expense = kind === "expense"
  const leave = kind === "leave"
  // Kimin adına listesi ve sütun düzeni: masrafın başlığı ve tablosu (`ExpenseHead`, `ColumnMenu`).
  const owners = useExpenseOwners(expense, me)
  const columns = useExpenseColumns()
  // Masraf ızgarası ancak en dar hâli ekrana sığınca; sığmayan aralıkta kalemler kart kart.
  const roomy = useGridRoom(columns.fitRem)
  const form = useRequestForm(kind, {
    owners: owners.owners,
    selfName: owners.name,
    ownCompany: owners.company,
    columns: columns.visible,
    check: leave ? (v) => leaveChecks(leaves, v) : null,
    initial,
    // Kaynağı olmayan başlangıç (seçilen gün) hazır gelen değerdir, kişinin girdiği değil.
    preset: origin == null,
  })
  const idBase = useId().replace(/:/g, "")
  // Avansın önerileri: telefonda çekmecenin üst satırında, masaüstünde alanların başında.
  const desk = useAdvanceDesk({ form, advances, enabled: kind === "advance" })
  // Masrafta gönderimden önce gözden geçirme (`expense/useExpenseFlow`).
  const flow = useExpenseFlow({ form, kind, idBase })
  // Başlıktaki doluluk halkası (zorunlu alanlar).
  const rows = form.expense?.rows
  const progress = useMemo(
    () => (expense ? expenseFormProgress(rows) : formProgress(FORM_TEMPLATE[kind], form.values)),
    [expense, rows, kind, form.values],
  )
  // Geniş masaüstünde masraf penceresi baştan geniş (kalemler + özet paneli); kalemler tabloda.
  const wide = expense && roomy && !mobile
  const table = wide
  const formId = `${idBase}-form`
  const bodyRef = useRef(null)
  const steps = usePhoneSteps({ kind, mobile, bodyRef })
  const sub = useRequestSubmit({
    kind,
    form,
    flow,
    owners: owners.owners,
    me: owners,
    balance,
    onSubmit,
    bodyRef,
    steps,
  })
  const flush = useDraftAutosave({ kind, form, active: open && !sub.done, sent: sub.sent })
  // "Gönder"in ERP yolu (izin, masraf — `features/selfservice/lib/erpDirectPolicy.js`). ERP "yetkin yok" derse talep
  // sessizce TYRO'ya gider: bildirim yok, kişi normal bir TYRO gönderimi görür.
  const direct = useErpDirect({
    kind,
    erp,
    form,
    flow,
    owners: owners.owners,
    tyro: sub,
    bodyRef,
  })
  const keys = useFormKeys(bodyRef)
  // Geniş masraf penceresi tam ekrana alınabilir (imzala & gönder penceresi gibi).
  const [full, setFull] = useState(false)
  // İlk açılışta pencere içeriğin doğal boyuyla ortalanır (tam ekranda gerek yok).
  const fitRef = useFitHeight(open && !mobile && !(wide && full))
  const tab = tabOf(kind)
  const title = t(`selfService.form.title.${kind}`)
  const description = t(`selfService.new.desc.${kind}`)

  const { back, confirm, setConfirm, close, requestClose, onOpenChange, onCloseAutoFocus } =
    useRequestClose({ open, onClose, from, form, sub, steps })
  // Formun ilk alanı (masrafta açık kalemin ilk alanı; başlıktaki × ya da kopyala değil). Yedek:
  // görünen ilk düğme — CSS'le gizlenmiş bir düğme odağı yutmasın.
  const firstField = () =>
    bodyRef.current?.querySelector("[data-row-start] button") ??
    [...(bodyRef.current?.querySelectorAll("button:not([data-info-tip])") ?? [])].find(
      (b) => b.checkVisibility?.() ?? b.offsetParent !== null,
    )
  // Başlığın ikinci satırı: masrafta akış ya da kalem sayısı (başkası adınaysa önce kimin adına),
  // izinde kalan izin, avansta şirket. Telefonda kalemler yazılırken çip yok, şirket hiç yok.
  const editing = expense && !flow.review
  const context = expense
    ? mobile && editing
      ? null
      : expenseContext(t, locale, { form, flow, owners: owners.owners })
    : requestContext(t, locale, kind, { balance, company: mobile ? null : company })
  // Formun derin parçalarının okuduğu ERP kayıtları (`requestData`).
  const records = useMemo(() => ({ leaves, expenses, advances }), [leaves, expenses, advances])
  // Dolu formda dışarı dokunuş yok sayılır (sorulmaz da: çoğu kez kazara ya da klavyeyi kapatmak için).
  const keepOutside = (e) => form.dirty && e.preventDefault()
  const step = steps.step && (steps.first ? "form" : "summary")

  const body = (
    <RequestBody
      kind={kind}
      form={form}
      flow={flow}
      idBase={idBase}
      formRef={bodyRef}
      formId={formId}
      title={title}
      onSubmit={sub.submit}
      onKeyDown={mobile ? keys.onKeyDown : undefined}
      records={records}
      desk={desk}
      origin={origin}
      onRestart={onRestart}
      step={step}
      owners={owners}
      columns={columns}
      table={table}
      balance={balance}
      teamEnabled={teamEnabled}
      via={direct.footer ? "erp" : "chat"}
    />
  )

  // Birincil düğmenin başka adı: telefonda ilk adım "Devam", masrafta "Gözden geçir" (henüz göndermez).
  const submitLabel = steps.first
    ? t("selfService.form.continue")
    : flow.reviewing && !flow.review
      ? t("selfService.expense.review")
      : null
  // "Gönder" ERP'ye yazıyorsa yönetici talebi eskisi gibi TYRO'ya da yollayabilir — yalnız
  // birincil düğme gerçekten gönderirken (Devam / Gözden geçir adımında değil).
  const tyroSend =
    direct.footer && direct.isAppAdmin && !submitLabel
      ? (placement) => (
          <TyroSendButton
            placement={placement}
            busy={sub.busy || direct.footer.busy}
            onClick={() => sub.submit()}
          />
        )
      : null
  const footer = (
    <RequestFooter
      form={form}
      kind={kind}
      mobile={mobile}
      busy={sub.busy}
      formId={formId}
      onCancel={requestClose}
      submitLabel={submitLabel}
      onBack={step === "summary" ? steps.back : flow.review ? () => flow.edit(null) : null}
      erp={direct.footer}
      tyro={mobile && tyroSend ? tyroSend("footer") : null}
      {...footerSlots({
        kind,
        mobile,
        editing,
        table,
        review: flow.review,
        form,
        idBase,
        balance,
        owners: owners.owners,
        expenses: records.expenses,
        via: direct.footer ? "erp" : "chat",
      })}
    />
  )

  const discard = (
    <DiscardConfirm
      open={open && confirm}
      onKeep={() => setConfirm(false)}
      onKeepDraft={() => {
        flush()
        close()
      }}
      onDiscard={() => {
        clearDraft(kind)
        close()
      }}
      // Dokunuşla açılan onayda odak sayfadaydı: forma dönünce ilk alana.
      fallback={firstField}
      icon={tab.cta}
      summary={confirm ? discardSummary(t, locale, kind, form) : null}
    />
  )
  const check = (
    <>
      <SentCheck show={sub.done} />
      {direct.dialog}
      <CoachTour id={`request-${kind}`} when={open} />
    </>
  )
  // "Anlat": bir cümleyle doldurma — masaüstünde pencerenin başlığında, telefonda alt şeritte.
  // Yöneticinin "TYRO'ya gönder" simgesi masaüstünde onun solunda.
  const tool = (
    <>
      {tyroSend?.("header")}
      <FormNarrate kind={kind} form={form} />
    </>
  )
  if (mobile) {
    return (
      <RequestSheet
        open={open}
        onOpenChange={onOpenChange}
        title={title}
        icon={tab.cta}
        progress={progress}
        description={description}
        context={context}
        footer={footer}
        keepOutside={keepOutside}
        from={from}
        sent={sub.sent}
        step={steps.stepped ? (steps.first ? 1 : 2) : null}
        lead={
          kind === "advance" && steps.first && desk.available ? (
            <PastAdvances {...desk.suggest} />
          ) : null
        }
      >
        {body}
        {discard}
        {check}
      </RequestSheet>
    )
  }
  return (
    <RequestWindow
      open={open}
      onOpenChange={onOpenChange}
      kind={kind}
      tool={tool}
      frame={{ kind, wide, full, minRem: columns.minRem }}
      header={{
        icon: tab.cta,
        progress,
        title,
        description,
        context,
        // Masrafın başlık bilgileri başlıkta hap hap: gövde kalemlerin (gözden geçirmede bağlam).
        meta: editing ? (
          <ExpenseMeta
            head={form.head}
            setHead={form.setHead}
            defaultTitle={form.defaultTitle}
            idBase={idBase}
            owners={owners}
          />
        ) : null,
        onClose: requestClose,
        full: wide ? full : null,
        onToggleFull: wide ? () => setFull((v) => !v) : null,
      }}
      keys={keys}
      review={flow.reviewing}
      fitRef={fitRef}
      table={table}
      keepOutside={keepOutside}
      // İlk odak ilk alanda (başlığın × düğmesinde değil); masrafta ilk kalemin ilk boş alanı.
      onOpenAutoFocus={(e) => {
        back.onOpenAutoFocus()
        e.preventDefault()
        if (expense) focusFirstEmpty(idBase, form.expense.rows[0])
        else firstField()?.focus()
      }}
      onCloseAutoFocus={onCloseAutoFocus}
      footer={footer}
      extra={
        <>
          {discard}
          {check}
        </>
      }
    >
      {body}
    </RequestWindow>
  )
}

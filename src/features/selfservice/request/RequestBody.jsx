import { MotionConfig } from "motion/react"
import { AdvanceForm } from "./advance/AdvanceForm"
import { ExpenseBody } from "./expense/ExpenseBody"
import { LeaveForm } from "./LeaveForm"
import { RequestDataContext } from "./requestData"
import { RequestNote } from "./RequestNote"

/**
 * Talep formunun gövdesi (pencerede ve çekmecede aynı): başında taslak ya da düzenleme notu
 * (`RequestNote`; telefonun özet adımında yok), türün girişleri. ERP kayıtları (`records`) formun
 * derin parçalarına bağlamla gider. `step`: telefonun iki adımı ("form" · "summary") ya da null.
 * `desk`: avans formunun önerileri ve ipuçları (`advance/useAdvanceDesk`). `via`: "Gönder"
 * nereye gider ("erp" · "chat") — masrafın gözden geçirmesi TYRO'ya gidecek mesajı yalnız sohbet
 * yolunda gösterir.
 */
export function RequestBody({
  kind,
  form,
  flow,
  idBase,
  formRef,
  formId,
  title,
  onSubmit,
  onKeyDown,
  records,
  desk,
  origin,
  onRestart,
  step,
  owners,
  columns,
  table,
  balance,
  teamEnabled,
  via = "chat",
}) {
  return (
    <MotionConfig reducedMotion="user">
      <RequestDataContext value={records}>
        <form
          id={formId}
          ref={formRef}
          noValidate
          onSubmit={onSubmit}
          onKeyDown={onKeyDown}
          aria-label={title}
          className="req-form @container/form"
        >
          {step !== "summary" && (
            <RequestNote origin={origin} onRestart={origin?.type === "draft" ? onRestart : null} />
          )}
          {kind === "expense" ? (
            <ExpenseBody
              form={form}
              flow={flow}
              idBase={idBase}
              owners={owners}
              columns={columns}
              table={table}
              via={via}
            />
          ) : kind === "leave" ? (
            <LeaveForm
              form={form}
              idBase={idBase}
              balance={balance}
              leaves={records.leaves}
              teamEnabled={teamEnabled}
              step={step && (step === "form" ? "dates" : "summary")}
            />
          ) : (
            <AdvanceForm
              form={form}
              idBase={idBase}
              desk={desk}
              step={step && (step === "form" ? "fields" : "summary")}
            />
          )}
        </form>
      </RequestDataContext>
    </MotionConfig>
  )
}

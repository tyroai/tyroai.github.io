import { useIsAppAdmin } from "@/hooks/useAuthorizations"
import { delegateFor } from "@/features/selfservice/lib/delegatePolicy"
import { ERP_DIRECT, erpDirectFor } from "@/features/selfservice/lib/erpDirectPolicy"
import { msalInstance } from "@/lib/msal"
import { ErpConfirm } from "./ErpConfirm"
import { useErpSubmit } from "./useErpSubmit"

const noop = () => {}

/**
 * Talep formunun "Gönder"inin ERP yolu, tek yerden: kişi ve form politikaya uyuyorsa birincil
 * düğmenin işi (`footer`: `{ onClick, busy }`, `RequestFooter`ın `erp`i) ve yazım/sonuç penceresi
 * (`dialog`); uymuyorsa ikisi de `null` — "Gönder" talebi TYRO'ya yollar. `isAppAdmin`: başlıktaki
 * "TYRO'ya gönder" simgesi yalnız uygulama yöneticisinde. `tyro`: formun TYRO gönderimi
 * (`useRequestSubmit`) — "gönderildi" işareti onda; ERP "yetkin yok" derse talep onunla gider.
 * `erp`: sayfanın verdiği `{ alias, uploader, onDone, person }` (kişinin ERP adresi bilinmiyorsa
 * yol kapalı).
 */
export function useErpDirect({ kind, erp, form, flow, owners, tyro, bodyRef }) {
  const account = msalInstance.getActiveAccount() ?? msalInstance.getAllAccounts()[0]
  const isAppAdmin = useIsAppAdmin()
  const on = Boolean(erp?.alias) && erpDirectFor(kind, account?.username, ERP_DIRECT, isAppAdmin)
  const sub = useErpSubmit({
    kind,
    form,
    flow,
    owners,
    alias: erp?.alias ?? null,
    uploader: erp?.uploader ?? "",
    sent: tyro.sent,
    markSent: tyro.markSent,
    onDone: erp?.onDone ?? noop,
    onDenied: () => tyro.submit(),
    bodyRef,
  })
  if (!on) return { footer: null, dialog: null, isAppAdmin }
  return {
    isAppAdmin,
    footer: { onClick: sub.prepare, busy: sub.preparing || sub.state?.phase === "writing" },
    dialog: (
      <ErpConfirm
        erp={sub}
        kind={kind}
        person={erp?.person ?? null}
        delegate={delegateFor(account?.username, isAppAdmin)}
      />
    ),
  }
}

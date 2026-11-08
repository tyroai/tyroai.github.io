import { useEffect, useMemo, useState } from "react"
import { useMsal } from "@azure/msal-react"
import { STATUS } from "@/lib/graph"
import { worstMode } from "@/dev/worstCase/mode"
import { worstOneNoteContent } from "@/dev/worstCase/onenote"
import { parseEditable } from "@/lib/onenote/onenoteEdit"
import type { EditableDoc } from "@/lib/onenote/onenoteEdit"
import { fetchEditableContent } from "@/lib/onenote/onenoteSource"

/** DEV: sahte sayfaya OneNote'un ürettiği gibi öğe kimlikleri (`?data=…`). */
function withFakeIds(raw: string): string {
  let n = 0
  return raw.replace(/<(p|h[1-6]|li)\b/gi, (m) => `${m} id="dev:{${++n}}"`)
}

interface State {
  key: string | null
  status: string
  doc: EditableDoc | null
}

/**
 * Düzenleyicinin modeli: sayfa kimlikli içerikle okunur (`includeIDs`), yazı öğeleri ve salt
 * okunur kutulara ayrılır (`lib/onenote/onenoteEdit`). Her açılışta taze okunur — önbellek yok:
 * düzenleme, sayfanın en son hâli üzerinden yapılmalı.
 */
export function useEditablePage(id: string) {
  const { instance, accounts } = useMsal()
  const account = accounts[0] ?? null
  const [state, setState] = useState<State>({ key: null, status: "loading", doc: null })
  const fake = import.meta.env.DEV && worstMode() ? worstOneNoteContent(id) : null
  const fakeDoc = useMemo(() => (fake ? parseEditable(withFakeIds(fake)) : null), [fake])

  useEffect(() => {
    if (fake) return undefined
    let live = true
    fetchEditableContent(instance, account, id).then((res) => {
      if (!live) return
      setState({
        key: id,
        status: res.status,
        doc: res.status === STATUS.ready ? parseEditable(res.raw) : null,
      })
    })
    return () => {
      live = false
    }
  }, [fake, instance, account, id])

  if (fakeDoc) return { status: STATUS.ready, doc: fakeDoc }
  return state.key === id
    ? { status: state.status, doc: state.doc }
    : { status: "loading", doc: null }
}

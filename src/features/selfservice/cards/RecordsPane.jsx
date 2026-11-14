import { useRef, useState } from "react"
import { recordKey } from "@/lib/selfServiceModel"
import { RecordList } from "../board/RecordList"
import { RecordAside } from "./RecordAside"
import "./recordsPane.css"

/**
 * Kartlar düzeninin listesi: solda düz satırlı kayıt listesi (`RecordList`, aynı veri ve davranış;
 * görünüş `recordsPane.css`), sağında seçili kaydın paneli (`RecordAside`). Geniş kapta satıra
 * basmak kaydı SEÇER (özet panelde); tam ayrıntı panelin "Formu aç" düğmesinde. Dar kapta panel
 * yok: satır her zamanki gibi kayıt penceresini açar. Panelin ekranda olup olmadığı CSS'in
 * kararından okunur (kap sorgusu). Seçim yoksa ya da seçili kayıt filtreyle listeden çıktıysa
 * listenin ilk kaydı seçilidir.
 */
export function RecordsPane({ view, person, onOpen, onAsk, ...list }) {
  const aside = useRef(null)
  const [pickedKey, setPickedKey] = useState(null)
  const records = view.shown
  const picked = records.find((r) => recordKey(r) === pickedKey) ?? records[0] ?? null
  const pick = (record) => {
    const el = aside.current
    if (el && getComputedStyle(el).display !== "none") setPickedKey(recordKey(record))
    else onOpen(record)
  }
  return (
    <div className="ssc-listwrap" data-aside={picked ? "" : undefined}>
      <div className="ssc-records">
        <RecordList
          {...list}
          view={view}
          person={person}
          onAsk={onAsk}
          onOpen={pick}
          openId={picked?.id}
        />
      </div>
      {picked && (
        <RecordAside
          key={recordKey(picked)}
          ref={aside}
          record={picked}
          person={person}
          onOpen={onOpen}
          onAsk={onAsk}
        />
      )}
    </div>
  )
}

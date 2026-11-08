import { AgentAccessOverlay } from "./AgentAccessOverlay"

/**
 * Sohbetin erişim kapısı ve panel şeridi. Hiçbir asistana yetkisi olmayan kişi sohbet ekranına
 * girebilir (kenar çubuğu satırı kilitlenmez: gideceği yeri göstermeden "olmaz" demek olurdu);
 * kapı ekranın KENDİSİNDE, çağıranlarda değil — sohbete giden yedi yol var, birini unutmak kolay.
 *
 * ⚠️ Ekran sökülmez, örtülür: arka katman bulanık ve etkileşimsiz, "erişim iste" kartı tam ortada.
 * Kart arka katmanın KARDEŞİ, çocuğu olsaydı o da bulanırdı. Arka katman üç kanalla birden kapanır:
 * `pointer-events-none` (fare), `aria-hidden` (ekran okuyucu), `inert` (sekme sırası) — `blur` tek
 * başına hiçbirini yapmaz. Güvenlik sınırı DEĞİL (bkz. `appLockPolicy.js`): gerçek sınır Copilot
 * Studio'nun Entra kapısı.
 *
 * `bar`: panelin pencere düğmeleri (`DockBar`), katmanın DIŞINDA — kilitliyken de panel kapanabilsin.
 */
export function ChatAccessFrame({ locked, bar = null, onGoToCatalogue, children }) {
  return (
    <>
      {bar}
      {locked ? (
        <div className="relative flex min-h-0 w-full flex-1 flex-col">
          <div
            aria-hidden="true"
            // React 19 `inert`i BOOLEAN basar; boş dize falsy, öznitelik hiç yazılmazdı.
            inert={true}
            className="pointer-events-none flex min-h-0 w-full flex-1 select-none flex-col opacity-70 blur-[5px]"
          >
            {children}
          </div>
          <AgentAccessOverlay onGoToCatalogue={onGoToCatalogue} />
        </div>
      ) : (
        children
      )}
    </>
  )
}

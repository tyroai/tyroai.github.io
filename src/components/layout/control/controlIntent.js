/**
 * Denetim Merkezi'nin kodu ilk niyette iner (`ControlCenterGate`): fareyle üstüne gelme, klavye
 * odağı, dokunuş, kısayol tuşu ya da uygulama açıldıktan sonra boşta. Kod inene kadar header'daki
 * düğme yer tutucudur; inince yerine panelin düğmesi gelir. Yer tutucuda olan biten (odakta
 * mıydı, açılsın mı) buradan devredilir: odak kaybolmaz, ilk dokunuş boşa gitmez.
 */
let resolve
export const intentReady = new Promise((r) => {
  resolve = r
})

// `loaded`: panelin kodu inip kuruldu mu (kurulmadıysa her istek "aç" demektir).
export const handoff = { focused: false, open: false, loaded: false }

export const markIntent = () => resolve()

/** Açılış isteği (arama komutu, kısayol tuşu): kod inmediyse inince açık gelir. */
export const CONTROL_EVENT = "tyro:control"
export function requestControl(mode = "open") {
  if (mode === "open" || !handoff.loaded) handoff.open = true
  markIntent()
  window.dispatchEvent(new CustomEvent(CONTROL_EVENT, { detail: mode }))
}

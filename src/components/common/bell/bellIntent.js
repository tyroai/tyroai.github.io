/**
 * Bildirim panelinin kodu ilk niyette iner (`BellPopover`): fareyle üstüne gelme, klavye odağı,
 * dokunuş ya da uygulama açıldıktan sonra boşta. Kod inene kadar header'daki çan yer tutucudur;
 * yer tutucuda olan biten (odakta mıydı, açılsın mı) buradan devredilir: odak kaybolmaz, ilk
 * dokunuş boşa gitmez (Denetim Merkezi'nin `controlIntent`i ile aynı kalıp).
 */
let resolve
export const bellReady = new Promise((r) => {
  resolve = r
})

export const bellHandoff = { focused: false, open: false }

export const markBellIntent = () => resolve()

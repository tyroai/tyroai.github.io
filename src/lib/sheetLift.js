/**
 * Klavye açıkken alt çekmecenin konumu (saf; kanca `hooks/useVisualViewport`, kullanan
 * `common/BottomSheet`). `position: fixed` bir çekmece DÜZEN görüntü alanının dibine oturur; iOS
 * Safari ve Android Chrome klavye açılınca o alanı küçültmez, yalnız görünen alanı
 * (`visualViewport`) kısaltır: çekmece klavyenin ALTINDA kalır, içindeki yazı kutusu hiç görünmez.
 * Çare: dibi görünen alanın dibine çekmek (`keyboardOffset`; iOS'un kaydırdığı görünüm payı da
 * içinde) ve boyunu görünen alana sığdırmak (içerik kendi içinde kayar). Alt güvenli alan payı
 * (ana ekran çubuğu) klavyenin altında kaldığı için kısılır. Klavye yoksa `undefined`: çekmece
 * kendi sınıflarıyla durur.
 */
export const KEYBOARD_GAP = 8

export function sheetLift({ keyboardUp, height, keyboardOffset }) {
  if (!keyboardUp || !(height > 0)) return undefined
  return {
    bottom: keyboardOffset,
    maxHeight: Math.max(height - KEYBOARD_GAP, 0),
    paddingBottom: "0.75rem",
  }
}

/**
 * Fişin gizli dosya girdileri: kamera (telefonda arka kamera, `capture`) ve galeri/dosya (görsel
 * ya da PDF, çoklu). Görünür düğmeler (`ref.click()`) başlığın fiş şeridinde ve ilk ekranda.
 */
export function ReceiptInputs({ cameraRef, pickRef, onChange }) {
  return (
    <>
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={onChange}
        tabIndex={-1}
        aria-hidden="true"
        className="hidden"
      />
      <input
        ref={pickRef}
        type="file"
        accept="image/*,application/pdf"
        multiple
        onChange={onChange}
        tabIndex={-1}
        aria-hidden="true"
        className="hidden"
      />
    </>
  )
}

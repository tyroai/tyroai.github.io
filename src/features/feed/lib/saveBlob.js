/** Bir blob'u verilen adla indirtir (geçici `<a download>`; adres 30 sn sonra bırakılır). */
export function saveBlob(blob, name) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = name
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 30000)
}

// tyroRM adresi ve "← TYRO" dönüş yolu: kenar çubuğu (ana paket) ile bölüm aynı anahtarı okur.
export const RM_PATH = "/rm"
export const RETURN_KEY = "tyro-rm-return"

export function isRmPath(pathname) {
  return pathname === RM_PATH || pathname.startsWith(`${RM_PATH}/`)
}

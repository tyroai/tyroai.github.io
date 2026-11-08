// Graph izin kapsamları (dosyalar · site listesi) ve satırın kimliği: yenilemede
// "yeni/değişti" ışığı aynı anahtarla eşleşir.
export const FILES = ["Files.Read.All"]
export const SITES = ["Sites.Read.All"]
export const NO_KEYS = new Set()
export const rowKey = (it) => `${it.driveId}::${it.itemId ?? it.id}`

/** Oturumdaki kişi — "Sen" süzgecinin ve satırın kimliği (`isMine`). */
export const meOf = (account) =>
  account
    ? {
        id: account.localAccountId,
        upn: account.username,
        email: account.username,
        name: account.name,
      }
    : null

/**
 * `useLocale().t`nin biçimi (`providers/LocaleProvider`): anahtar, isteğe bağlı yedek metin ya da
 * `{ad}` değişkenleri. Saf modüller `t`yi parametre olarak alır; tür burada tek yerde.
 */
export type TranslateVars = Record<string, unknown>

export type Translate = {
  (key: string, vars?: TranslateVars): string
  (key: string, fallback: string | undefined, vars?: TranslateVars): string
}

import { pickAmount, readAmounts } from "./amount"
import { looksLikeAdvance, narrateAdvance } from "./advance"
import { readDates } from "./dates"
import { narrateDelegate, saysDelegate } from "./delegate"
import { narrateExpense } from "./expense"
import { expenseCategoryOf, saysExpense } from "./expenseWords"
import { leaveKindOf, narrateLeave, saysLeave } from "./leave"
import { numberWords } from "./numbers"
import { findStem, fold, mask, words } from "./text"

/**
 * Anlat — serbest cümleden talep formu (saf, cihazda; yapay zekâ yok). Türü bulur (verilmediyse),
 * sırayla: "avans" → avans; "masraf", "harcama", "fiş", "fatura", "ödedim" → masraf; "izin" ya da
 * (tutarsız) izin türü → izin; masraf anahtarı (taksi, otel, yemek…) ve tutar → masraf; tutar ve
 * amaç ya da yer → avans; yalnız masraf anahtarı → masraf; zayıf masraf kelimesi (fuar, eğitim) ve
 * tutar → masraf; izin türü → izin; yalnız tarih → izin.
 * `delegate`: kişi temsilci atayabiliyorsa "temsilci", "vekil", "devret", "onaylarımı bırak" her
 * şeyden önce temsilcidir ("izindeyken onaylarımı Ali'ye devret" izin değil; `./delegate`).
 * Dönüş `{ kind, values, parts, warnings, text }` (masrafta ayrıca `rows` ve `head`): `parts`
 * anlaşılanların çipleri, `values`/`rows`/`head` forma yazılacaklar; hiçbir şey anlaşılmadıysa
 * `kind` null.
 */
export function narrate(text, { today, kind = null, locale = "tr", delegate = false } = {}) {
  const raw = String(text ?? "").trim()
  if (!raw) return null
  const folded = numberWords(fold(raw))
  if (kind === "delegate" || (!kind && delegate && saysDelegate(folded))) {
    const got = narrateDelegate(folded, raw, today)
    // "Temsilcim kim?" soru: hiçbir şey anlaşılmadıysa form açılmaz.
    if (!got.parts.length && /\?|\b(?:kim\w*|ne zaman|nedir|mi|mu|misin|musun)\b/.test(folded))
      return { kind: null, values: {}, parts: [], warnings: [], text: raw }
    return { kind: "delegate", ...got, text: raw }
  }
  const list = words(folded)
  const leaveKind = leaveKindOf(folded, raw)
  const dated = readDates(folded, today, { numeric: false })
  let undated = folded
  for (const [a, b] of dated.spans) undated = mask(undated, a, b)
  const hasAmount = Boolean(pickAmount(readAmounts(undated, locale))?.value)
  const expenseWord = saysExpense(folded)
  // "Avans kapama" masraftır (avansın kapanışı); yeni avans değil.
  const advanceWord =
    findStem(list, ["avans"], 5) && !/\bavans\w*\s+(?:kapa|kapat|iade)/.test(folded)
  const guess =
    kind ??
    (advanceWord
      ? "advance"
      : findStem(list, ["masraf", "harcama", "fis", "fatura", "odedim", "harcadim"], 5)
        ? "expense"
        : saysLeave(folded) || (leaveKind && !hasAmount)
          ? "leave"
          : expenseWord && hasAmount
            ? "expense"
            : looksLikeAdvance(folded, today)
              ? "advance"
              : expenseWord || (hasAmount && expenseCategoryOf(folded))
                ? "expense"
                : leaveKind || readDates(folded, today).start
                  ? "leave"
                  : null)
  const empty = { kind: null, values: {}, parts: [], warnings: [], text: raw }
  if (!guess) return empty
  if (guess === "expense") {
    const got = narrateExpense(raw, today, locale)
    return { kind: "expense", values: {}, ...got, text: raw }
  }
  const got =
    guess === "leave" ? narrateLeave(folded, today, raw) : narrateAdvance(folded, today, locale)
  // Hiçbir alan anlaşılmadıysa: açık niyet ("izin istiyorum", "avans istiyorum") boş formu açar;
  // soru ("Ahmet'in izni ne zaman?") anlaşılmadı sayılır.
  const intent =
    (guess === "leave" ? saysLeave(folded) : advanceWord) &&
    !/\?|\b(?:ne zaman|nedir|kac\w*|mi|mu|misin|musun)\b/.test(folded)
  if (!got.parts.length && !kind && !got.warnings.length && !intent) return empty
  return { kind: guess, ...got, text: raw }
}

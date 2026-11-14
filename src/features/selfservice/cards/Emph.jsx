/**
 * Sözlük metnindeki `**vurgu**` parçalarını vurgulu yazar (`<mark>`; prototipteki renkli hap).
 * HTML basılmaz: metin düz kalır.
 */
export function Emph({ text }) {
  return String(text)
    .split("**")
    .map((part, i) => (i % 2 ? <mark key={i}>{part}</mark> : part))
}

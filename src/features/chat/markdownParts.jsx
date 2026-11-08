/* eslint-disable react-refresh/only-export-components */
import { useState } from "react"

// Botun cevabındaki linkler YENİ SEKMEDE açılır.
//
// Bu bir SPA: varsayılan <a> davranışı sayfayı linkin üstüne götürüyor, yani
// kullanıcı sohbetten çıkıyor ve geri döndüğünde konuşma gitmiş oluyor. Ajanın
// verdiği linkler ise (fatura/belge görüntüleri) yanına dönülecek şeyler.
// Copilot Studio'nun kendi arayüzü bunu zaten yeni sekmede açıyor; burada da
// aynı davranış.
export const MARKDOWN_COMPONENTS = {
  a: (props) => {
    // `node` react-markdown'ın AST düğümü; bir DOM özniteliği değil.
    const { node, ...rest } = props
    void node
    return <a {...rest} target="_blank" rel="noopener noreferrer" />
  },
  // Kod bloğunun içindeki `code` satır içi kod rengini (açık zemin) taşımasın: koyu `pre`nin
  // üstünde açık yazı okunmuyordu.
  code: ({ node, className, style, ...rest }) => {
    void node
    const block = /language-/.test(className ?? "") || /\n/.test(String(rest.children ?? ""))
    return (
      <code
        {...rest}
        className={className}
        style={block ? { ...style, background: "transparent", padding: 0 } : style}
      />
    )
  },
  img: (props) => {
    const { node, ...rest } = props
    void node
    return <BotMarkdownImage {...rest} />
  },
}

/**
 * Ajanın metnine gömdüğü görsel.
 *
 * Yüklenemezse HİÇBİR ŞEY çizilmez. Copilot Studio cevaplarında zaman zaman
 * kaynağı bizim sayfadan çekilemeyen bir görsel geliyor (oturuma bağlı bir
 * adres, ya da yalnızca ajanın kendi arayüzünde çözülen göreli bir yol) ve
 * tarayıcının kırık resim ikonu, cevabın ortasında bir hata varmış izlenimi
 * veriyordu — oysa metin eksiksiz. Sessizce düşürmek doğru: görselin taşıdığı
 * bilgi zaten yanındaki metinde.
 */
function BotMarkdownImage({ src, alt, ...rest }) {
  const [failed, setFailed] = useState(false)
  if (failed || !src) return null
  return (
    <img
      {...rest}
      src={src}
      alt={alt ?? ""}
      onError={() => setFailed(true)}
      className="my-2 max-h-80 max-w-full rounded-lg object-contain"
    />
  )
}

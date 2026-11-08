import { useEffect, useRef, useState } from "react"

/**
 * İçeriği kadar uzayan posta çerçevesi — telefon okuyucusu TEK kaydırma ister: üst bilgi ve
 * postanın kendisi birlikte kayar. Sabit boylu çerçevede iki iç içe kaydırma vardı; parmak üst
 * bilgiyi kaydırınca hareket ortada kesiliyor, gövdeye geçmek için yeniden kaydırmak gerekiyordu
 * (iOS'ta çoğu zaman hiç geçmiyordu).
 *
 * Boyu dışarıdan okumak için `allow-same-origin` AÇIK; script, form ve üst sayfayı gezdirme yine
 * KAPALI ve çerçevenin içerik politikası (`lib/mailFrame` › `FRAME_CSP`) hiçbir isteğe izin vermez.
 * Tehlikeli olan `allow-scripts` ile birlikte açmaktır (çerçeve kendi kumunu kaldırabilir);
 * script olmadan postanın HTML'i yalnız çizilir. Ölçüm çerçevenin kendi `ResizeObserver`ıyla:
 * gömülü görseller çözüldükçe boy güncellenir; en değişince (döndürme) genişlik yeniden sığdırılır.
 */
export function FitFrame({ title, html, className }) {
  const ref = useRef(null)
  const [height, setHeight] = useState(null)

  useEffect(() => {
    const frame = ref.current
    if (!frame) return undefined
    let observer = null
    let scale = 1
    let width = 0
    // Ekrandan geniş posta (bültenlerin sabit enli tabloları) ekran enine orantılı küçülür — telefon
    // posta uygulamaları gibi: tamamı görünür ve yana kaydırma çerçeveye takılmadan sonraki
    // gönderiye geçer (çerçeve yatayda kaymaz).
    const fitWidth = () => {
      const root = frame.contentDocument?.documentElement
      const body = frame.contentDocument?.body
      if (!root || !body) return
      body.style.removeProperty("width")
      body.style.removeProperty("transform")
      width = root.clientWidth
      const wide = root.scrollWidth
      scale = wide > width + 2 ? Math.max(0.25, width / wide) : 1
      // Çerçeve hiç kaymaz (boyu içerik kadar): küçültme düzendeki boyu kısaltmaz, altta kalan boş
      // alan çerçevede ikinci bir kaydırma açardı. Parmak her yönde sayfaya/sayfalayıcıya geçer.
      root.style.overflow = "hidden"
      if (scale === 1) return
      body.style.width = `${wide}px`
      body.style.transformOrigin = "0 0"
      body.style.transform = `scale(${scale})`
    }
    const measure = () => {
      const root = frame.contentDocument?.documentElement
      const body = frame.contentDocument?.body
      if (!root || !body) return
      if (root.clientWidth !== width) fitWidth()
      // Küçültülmüşse gövdenin dönüşmüş kutusu; değilse `html` öğesinin kutusu içerik boyudur
      // (`scrollHeight` çerçeve içerikten uzunken pencere boyunu döndürür ve hiç kısalmazdı).
      const box = scale === 1 ? root : body
      setHeight(Math.ceil(box.getBoundingClientRect().height))
    }
    const onLoad = () => {
      observer?.disconnect()
      fitWidth()
      measure()
      const win = frame.contentWindow
      const root = frame.contentDocument?.documentElement
      const RO = win?.ResizeObserver ?? window.ResizeObserver
      if (root && RO) {
        observer = new RO(measure)
        observer.observe(root)
      }
    }
    frame.addEventListener("load", onLoad)
    if (frame.contentDocument?.readyState === "complete" && frame.contentDocument.body?.firstChild)
      onLoad()
    return () => {
      frame.removeEventListener("load", onLoad)
      observer?.disconnect()
    }
  }, [html])

  return (
    <iframe
      ref={ref}
      title={title}
      // Bağlantılar yeni sekmede; script ve form KAPALI. `allow-same-origin` yalnız boy için (yukarıda).
      sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin"
      // Çerçeve hiç kaymaz — iOS WebKit kökteki `overflow: hidden`ı her sürümde dokunmaya uygulamıyor;
      // bu öznitelik çerçeveyi kaydırılamaz yapar ve parmak sayfaya geçer.
      scrolling="no"
      className={className}
      style={{ height: height ? `${height}px` : "70dvh" }}
      srcDoc={html}
    />
  )
}

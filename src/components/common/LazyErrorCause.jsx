import { Component, lazy, Suspense } from "react"

const Body = lazy(() => import("./ErrorCause").then((m) => ({ default: m.ErrorCause })))

// Parça inmezse (ağ yok, yeni sürüm) neden satırı sessizce yok olur; sayfa hata ekranına düşmez.
class Quiet extends Component {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    return this.state.failed ? null : this.props.children
  }
}

/**
 * `ErrorCause`un tembel sarmalı: ilk pakette duran bileşenler (üst çubuk panelleri, sohbet) neden
 * metnini ve çözücüyü pakete almasın, hata görününce insin. Tembel sayfalar `ErrorCause`u
 * doğrudan alır.
 */
export function LazyErrorCause(props) {
  if (!props.detail) return null
  return (
    <Quiet>
      <Suspense fallback={null}>
        <Body {...props} />
      </Suspense>
    </Quiet>
  )
}

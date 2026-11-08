import "./welcomeBackdrop.css"

/**
 * Çekmecenin zemini — katmanlar alttan üste: yukarıdan aşağı inen gradyan (durakları `useWelcomeInk`
 * paletin rampasından kurar: altın üst, mercan bant, koyu alt), ortalı ve yalnız dikeyde süzülen iki
 * ışık, havanın üst sıradaki hafif dokusu (gece yıldız, açık günde tepeden ışık), ince gren ve durum
 * çubuğunun altında hafif karartı. Hepsi süs: ekran okuyucuya kapalı; süzülme ve parıltı yalnız
 * `transform`/`opacity`, azaltılmış harekette durur.
 */
export function WelcomeBackdrop({ sky }) {
  return (
    <span aria-hidden="true" className="welcome-bg" data-sky={sky ?? undefined}>
      <span className="welcome-aura welcome-aura-a" />
      <span className="welcome-aura welcome-aura-b" />
      {sky && <span className="welcome-sky" />}
      <span className="welcome-grain" />
      <span className="welcome-statusbar" />
    </span>
  )
}

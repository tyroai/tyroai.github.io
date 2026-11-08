// The login page's palette is pinned to the app's default (Insta) by PaletteProvider (see
// LOGIN_PALETTE there), so this page can just read the palette tokens like
// every other screen. It used to carry the five brand-logo hex values as
// literals, which is how the logo stayed on-brand while the orb beside it
// followed whatever palette the user had chosen — two halves of one page
// disagreeing. TyroLogo already falls back to the same tokens when it is
// handed no colours, so the literals are simply gone.
//
// The gradient runs from the logo's light end (1) through its main colour (2)
// to its deepest tone (5), so it follows whichever palette the page is pinned to.
export const LOGIN_GRADIENT =
  "linear-gradient(135deg, var(--brand-logo-1) 0%, var(--brand-logo-2) 50%, var(--brand-logo-5) 100%)"

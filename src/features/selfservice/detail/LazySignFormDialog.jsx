import { lazy, Suspense } from "react"

// Kutu, imza alanı ve PDF çizici yalnız düğmeye basılınca iner (sohbetteki çipin kuralı).
const SignFormDialog = lazy(() =>
  import("@/features/chat/sign/SignFormDialog").then((m) => ({ default: m.SignFormDialog })),
)

/** Kaydın formunu imzalama / maille gönderme penceresi (tembel). */
export function LazySignFormDialog(props) {
  return (
    <Suspense fallback={null}>
      <SignFormDialog {...props} />
    </Suspense>
  )
}

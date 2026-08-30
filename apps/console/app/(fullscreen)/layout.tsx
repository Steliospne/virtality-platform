/**
 * Chrome-less authenticated surfaces (no sidebar / navbar). Used by the
 * Checkout Success Page so the celebration can own the full viewport before
 * the clinician returns to Console home.
 */
export default function FullscreenLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return <>{children}</>
}

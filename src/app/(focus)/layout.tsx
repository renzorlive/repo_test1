/**
 * Focus layout — a distraction-free, full-screen shell (no sidebar / top nav)
 * for immersive flows like the Execution Wizard. Authentication is still
 * enforced by the middleware.
 */
export default function FocusLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-screen bg-background">{children}</div>;
}

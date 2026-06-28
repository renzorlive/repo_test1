import { redirect } from "next/navigation";

/**
 * The root path always resolves into the dashboard. Unauthenticated users are
 * redirected to /login by the auth middleware before this runs.
 */
export default function RootPage() {
  redirect("/command-center");
}

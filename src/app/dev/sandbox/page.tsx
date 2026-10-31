import { redirect } from "next/navigation";

export default function DevSandboxRedirectPage() {
  redirect("/playground");
}

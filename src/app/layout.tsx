import type { Metadata } from "next";
import { AuthProvider } from "@/context/auth-context";
import { CurrencyProvider } from "@/context/currency-context";
import { SiteHeader, SiteFooter } from "@/components/forgent/site-shell";
import "./globals.css";

export const metadata: Metadata = {
  title: "Forgent — The agent layer for your application",
  description: "Discover and integrate specialized AI agents through one API.",
  icons: { icon: "/firefly.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><CurrencyProvider><AuthProvider><SiteHeader /><main>{children}</main><SiteFooter /></AuthProvider></CurrencyProvider></body></html>;
}

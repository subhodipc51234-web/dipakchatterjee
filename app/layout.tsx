// app/layout.tsx
import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  weight: ["400", "500", "600", "700"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Dipak Chatterjee — Social Worker, Educationist & Public Life",
  description:
    "Official portfolio of Dipak Chatterjee — social worker, educationist, and community leader in Chanchal, North Malda.",
};

// Runs before paint so the public site never flashes the wrong theme.
// Only affects <html data-theme>; admin pages have no dark: classes, so
// this is a no-op for them regardless of the stored preference.
const themeInitScript = `
(function () {
  try {
    var stored = localStorage.getItem("theme");
    var theme = stored === "dark" || stored === "light"
      ? stored
      : (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    document.documentElement.setAttribute("data-theme", theme);
  } catch (e) {}
})();
`;

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Set by proxy.ts on every request, alongside the matching
  // Content-Security-Policy nonce — required for this inline script to
  // run under the site's CSP (see proxy.ts for why).
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable}`} suppressHydrationWarning>
      <head>
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="antialiased bg-paper-100 text-ink font-sans">
        {children}
      </body>
    </html>
  );
}

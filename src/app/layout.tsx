import type React from "react";
import type { Metadata } from "next";
import "../index.css";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
export const metadata: Metadata = {
  title: "kitchenTop MVP",
  description: "Aplikacja do projektowania blatów kuchennych w 2D",
  generator: "v0.app",
  applicationName: "kitchenTop",
  
};

function ThemeNoFlashScript() {
  // Sets theme class before hydration to avoid FOUC and hydration mismatches
  const code = `(() => { try { const t = localStorage.getItem('theme'); const s = window.matchMedia('(prefers-color-scheme: dark)').matches; const r = t === 'dark' || (!t || t === 'system') && s ? 'dark' : 'light'; const c = document.documentElement.classList; c.remove('light','dark'); c.add(r);} catch(_){} })();`;
  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pl" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <ThemeNoFlashScript />
      </head>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}

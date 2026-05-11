import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Toaster } from "@/components/ui/toaster";
import { ThemeInitializer } from "@/components/ThemeInitializer";
import { DynamicFavicon } from "@/components/DynamicFavicon";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Numsa — Finanzas personales",
  description: "Gestiona tus finanzas personales",
};

const themeScript = `
try {
  var stored = localStorage.getItem('numsa-theme');
  if (stored) {
    var s = JSON.parse(stored).state;
    if (s && s.theme === 'dark') document.documentElement.classList.add('dark');
    if (s && s.accentColor) {
      var map = {"#16a34a":"142 76% 36%","#2563eb":"221 83% 53%","#dc2626":"0 72% 51%","#9333ea":"271 81% 56%","#ea580c":"21 90% 48%","#0891b2":"192 91% 37%","#ca8a04":"41 96% 40%","#db2777":"333 71% 51%"};
      var hsl = map[s.accentColor] || "142 76% 36%";
      document.documentElement.style.setProperty('--primary', hsl);
      document.documentElement.style.setProperty('--ring', hsl);
      document.documentElement.style.setProperty('--accent-color', s.accentColor);
    }
  }
} catch(e) {}
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={inter.className}>
        <Providers>
          <ThemeInitializer />
          <DynamicFavicon />
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { THEMES } from "@/lib/themes";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Atlas",
  description: "Atlas - panel do tworzenia lokalnych baz danych.",
  icons: {
    icon: "/logo.ico",
    shortcut: "/logo.ico",
    apple: "/logo.png",
  },
};

const THEME_SCRIPT = `
  (function() {
    try {
      var themes = ${JSON.stringify(THEMES)};
      var themeId = localStorage.getItem("localdb-panel-theme") || "dark";
      var currentTheme = themes.find(function(t) { return t.id === themeId; }) || themes[0];
      
      function hexToRgb(hex) {
        var h = hex.replace('#', '');
        if (h.length === 3) h = h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
        var r = parseInt(h.substring(0,2), 16);
        var g = parseInt(h.substring(2,4), 16);
        var b = parseInt(h.substring(4,6), 16);
        return r + ', ' + g + ', ' + b;
      }
      
      var isLight = false;
      var c = currentTheme.bgMain.replace('#', '');
      if (c.length === 3) c = c[0]+c[0]+c[1]+c[1]+c[2]+c[2];
      var r = parseInt(c.substr(0,2),16), g = parseInt(c.substr(2,2),16), b = parseInt(c.substr(4,2),16);
      if ((r*299 + g*587 + b*114)/1000 > 128) isLight = true;
      document.documentElement.classList.add(isLight ? "atlas-light" : "atlas-dark");

      var root = document.documentElement.style;
      root.setProperty('--bg-main', currentTheme.bgMain);
      root.setProperty('--bg-side', currentTheme.bgSide);
      root.setProperty('--bg-card', currentTheme.bgCard);
      root.setProperty('--border', currentTheme.border);
      root.setProperty('--text-main', currentTheme.textMain);
      root.setProperty('--text-muted', currentTheme.textMuted); // Will be fine-tuned by React
      root.setProperty('--accent', currentTheme.accent);
      root.setProperty('--accent-rgb', hexToRgb(currentTheme.accent));
      root.setProperty('--accent-text', currentTheme.accentText);
      root.setProperty('--bg-main-rgb', hexToRgb(currentTheme.bgMain));
      root.setProperty('--bg-side-rgb', hexToRgb(currentTheme.bgSide));
      root.setProperty('--bg-card-rgb', hexToRgb(currentTheme.bgCard));
      root.setProperty('--border-rgb', hexToRgb(currentTheme.border));
      root.setProperty('--success', currentTheme.success);
      root.setProperty('--success-rgb', hexToRgb(currentTheme.success));
      root.setProperty('--warning', currentTheme.warning);
      root.setProperty('--warning-rgb', hexToRgb(currentTheme.warning));
      root.setProperty('--danger', currentTheme.danger);
      root.setProperty('--danger-rgb', hexToRgb(currentTheme.danger));
      root.setProperty('--info', currentTheme.info);
      root.setProperty('--info-rgb', hexToRgb(currentTheme.info));
    } catch (e) {}
  })();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pl"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>{children}</body>
    </html>
  );
}
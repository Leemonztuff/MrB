
import type { Metadata } from 'next';
import { Toaster } from "@/components/ui/toaster"
import './globals.css';
import { cn } from '@/lib/utils';
import localFont from 'next/font/local';
import { ErrorBoundary } from '@/components/error-boundary';
import { ThemeProvider } from '@/components/theme-provider';

const centuryGothic = localFont({
  src: [
    { path: './fonts/century-gothic-paneuropean/CenturyGothicPaneuropeanThin.ttf', weight: '100', style: 'normal' },
    { path: './fonts/century-gothic-paneuropean/CenturyGothicPaneuropeanThinItalic.ttf', weight: '100', style: 'italic' },
    { path: './fonts/century-gothic-paneuropean/CenturyGothicPaneuropeanLight.ttf', weight: '300', style: 'normal' },
    { path: './fonts/century-gothic-paneuropean/CenturyGothicPaneuropeanLightItalic.ttf', weight: '300', style: 'italic' },
    { path: './fonts/century-gothic-paneuropean/CenturyGothicPaneuropeanRegular.ttf', weight: '400', style: 'normal' },
    { path: './fonts/century-gothic-paneuropean/CenturyGothicPaneuropeanItalic.ttf', weight: '400', style: 'italic' },
    { path: './fonts/century-gothic-paneuropean/CenturyGothicPaneuropeanSemiBold.ttf', weight: '600', style: 'normal' },
    { path: './fonts/century-gothic-paneuropean/CenturyGothicPaneuropeanSemiBoldItalic.ttf', weight: '600', style: 'italic' },
    { path: './fonts/century-gothic-paneuropean/CenturyGothicPaneuropeanBold.ttf', weight: '700', style: 'normal' },
    { path: './fonts/century-gothic-paneuropean/CenturyGothicPaneuropeanBoldItalic.ttf', weight: '700', style: 'italic' },
    { path: './fonts/century-gothic-paneuropean/CenturyGothicPaneuropeanExtraBold.ttf', weight: '800', style: 'normal' },
    { path: './fonts/century-gothic-paneuropean/CenturyGothicPaneuropeanExtraBoldItalic.ttf', weight: '800', style: 'italic' },
    { path: './fonts/century-gothic-paneuropean/CenturyGothicPaneuropeanBlack.ttf', weight: '900', style: 'normal' },
    { path: './fonts/century-gothic-paneuropean/CenturyGothicPaneuropeanBlackItalic.ttf', weight: '900', style: 'italic' },
  ],
  variable: '--font-century-gothic',
  display: 'swap',
  preload: true,
  fallback: ['system-ui', 'sans-serif'],
});


export const metadata: Metadata = {
  title: {
    default: 'Blonde Orders | Gestión de Pedidos',
    template: '%s | Blonde Orders',
  },
  description: 'Sistema moderno de gestión de pedidos para negocios',
  keywords: ['pedidos', 'gestión', 'negocios', 'comercio'],
  authors: [{ name: 'Mr. Blonde' }],
  creator: 'Mr. Blonde',
  openGraph: {
    type: 'website',
    locale: 'es_AR',
    title: 'Blonde Orders',
    description: 'Sistema moderno de gestión de pedidos',
    siteName: 'Blonde Orders',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Blonde Orders',
    description: 'Sistema moderno de gestión de pedidos',
  },
  icons: {
    icon: [],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={cn(
          "font-century-gothic antialiased min-h-screen bg-background",
          centuryGothic.variable
        )}
        suppressHydrationWarning={true}
      >
        <ThemeProvider>
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}

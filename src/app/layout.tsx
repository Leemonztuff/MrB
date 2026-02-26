
import type { Metadata } from 'next';
import { Toaster } from "@/components/ui/toaster"
import './globals.css';
import { cn } from '@/lib/utils';
import localFont from 'next/font/local';

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
});


export const metadata: Metadata = {
  title: 'Blonde Orders',
  description: 'Modern Order Management',
  icons: {
    icon: [], // Explicitly setting icons to an empty array
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark" style={{ colorScheme: "dark" }} suppressHydrationWarning>
      <body
        className={cn(
          "font-century-gothic antialiased min-h-screen bg-background",
          centuryGothic.variable
        )}
        suppressHydrationWarning={true}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}

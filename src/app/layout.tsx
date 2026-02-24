
import type { Metadata } from 'next';
import { Toaster } from "@/components/ui/toaster"
import './globals.css';
import { cn } from '@/lib/utils';
import { Belleza, Source_Code_Pro } from 'next/font/google';

const belleza = Belleza({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-headline',
});

const sourceCodePro = Source_Code_Pro({
  subsets: ['latin'],
  variable: '--font-body',
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
          "font-body antialiased min-h-screen bg-background",
          belleza.variable,
          sourceCodePro.variable
        )}
        suppressHydrationWarning={true}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}

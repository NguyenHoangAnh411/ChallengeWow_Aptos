import dynamic from 'next/dynamic';
import "./globals.css";
import { Metadata } from "next";

const Providers = dynamic(() => import('@/components/providers'), { ssr: false });

export const metadata: Metadata = {
  title: "Challenge Wave",
  description: "Challenge Wave Application",
};

export default function RootLayout({
  children,
}: {
  children: JSX.Element | JSX.Element[];
}) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <head>
        <link rel="icon" href="/olym3-logo.svg" type="image/svg+xml" />
      </head>
      <body suppressHydrationWarning className="min-h-screen bg-background font-sans antialiased">
        <Providers>
          <main className="relative flex min-h-screen flex-col">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
} 
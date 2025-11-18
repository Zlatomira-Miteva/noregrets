import type { Metadata } from "next";
import Script from "next/script";
import { Montserrat_Alternates } from "next/font/google";
import "./globals.css";
import AuthProvider from "@/components/AuthProvider";
import CartToast from "@/components/CartToast";
import { CartProvider } from "@/context/CartContext";

const SITE_URL = "https://noregrets.bg";

const montserrat = Montserrat_Alternates({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin", "cyrillic"],
  variable: "--font-montserrat",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "No Regrets – Сладкарско ателие в Пловдив",
    template: "%s | No Regrets",
  },
  description: "Ръчно изработени кукита, торти и сладки изкушения от сладкарско ателие No Regrets в Пловдив. Поръчки онлайн и взимане от място.",
  keywords: ["кукита", "торти", "сладкарница Пловдив", "No Regrets", "ръчно изработени десерти"],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "No Regrets – Сладкарско ателие",
    description: "Открийте любими кукита, торти и мини десерти, приготвени по поръчка в No Regrets.",
    url: SITE_URL,
    siteName: "No Regrets",
    locale: "bg_BG",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    site: "@noregretsbg",
    title: "No Regrets – Сладкарско ателие",
    description: "Ръчно изработени десерти по поръчка в Пловдив.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="bg" className={montserrat.variable}>
      <body className="antialiased">
        {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ? (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}');
              `}
            </Script>
          </>
        ) : null}
        <Script src="https://t.contentsquare.net/uxa/90c76af42dd95.js" strategy="afterInteractive" />
        <AuthProvider>
          <CartProvider>
            <CartToast />
            {children}
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

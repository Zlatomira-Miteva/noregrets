import type { Metadata } from "next";
import { Alice, Sofia_Sans } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";

const alice = Alice({
  weight: "400",
  subsets: ["latin", "cyrillic"],
  variable: "--font-alice",
  display: "swap",
});

const sofiaSans = Sofia_Sans({
  weight: ["400", "500", "600"],
  subsets: ["latin", "cyrillic"],
  variable: "--font-sofia-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "No Regrets",
  description: "Сладкарско ателие",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${alice.variable} ${sofiaSans.variable} antialiased`}>
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}

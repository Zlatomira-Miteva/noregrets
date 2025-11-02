import type { Metadata } from "next";
import { Days_One, Geologica } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";

const daysOne = Days_One({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-days-one",
  display: "swap",
});

const geologica = Geologica({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  variable: "--font-geologica",
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
      <body className={`${daysOne.variable} ${geologica.variable} antialiased`}>
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}

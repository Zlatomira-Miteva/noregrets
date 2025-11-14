import type { Metadata } from "next";
import { Montserrat_Alternates } from "next/font/google";
import "./globals.css";
import AuthProvider from "@/components/AuthProvider";
import CartToast from "@/components/CartToast";
import { CartProvider } from "@/context/CartContext";

const montserrat = Montserrat_Alternates({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin", "cyrillic"],
  variable: "--font-montserrat",
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
    <html lang="en" className={montserrat.variable}>
      <body className="antialiased">
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

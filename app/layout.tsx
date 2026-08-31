import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "Billing System",
  description: "Billing and Accounting Software",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}

        <Toaster
          position="top-right"
          richColors
          closeButton
        />
      </body>
    </html>
  );
}
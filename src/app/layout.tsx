import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Karen Ferraz • 50 anos",
  description: "Convite digital e confirmação de presença."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}

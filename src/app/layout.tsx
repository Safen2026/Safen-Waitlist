import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SAFEN | Join the waitlist",
  description: "Be among the first to experience SAFEN. Join the waitlist.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

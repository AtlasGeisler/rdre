import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RDRE | United Endodontics",
  description: "Referring Doctor Relationship Engine",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

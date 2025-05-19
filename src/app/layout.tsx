// app/layout.tsx
import type { ReactNode } from "react";
import "./globals.css";

export const metadata = {
  title: "ELSI 2025 | English Learners",
  description:
    "Hands-on internship for class 10-12 students by Maithree Roy’s English Learners.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

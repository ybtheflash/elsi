// app/layout.tsx
import type { ReactNode } from "react";
import "./globals.css";

export const metadata = {
  title: "ELSI Program | English Learners Student Internship",
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

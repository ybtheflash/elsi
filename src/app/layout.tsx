// app/layout.tsx
import type { ReactNode } from "react";
import "./globals.css";
import { Toaster } from "sonner";
import { LoadingProvider } from "@/context/LoadingContext";
import GlobalLoadingOverlay from "@/components/GlobalLoadingOverlay";

export const metadata = {
  title: "ELSI 2025 | English Learners",
  description:
    "Hands-on internship for class 10-12 students by Maithree Roy's English Learners.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <LoadingProvider>
          {children}
          <GlobalLoadingOverlay />
          <Toaster
            position="top-center"
            closeButton={false}
            richColors={true}
            theme="light"
            expand={false}
            visibleToasts={5}
            toastOptions={{
              duration: 3000,
              className: "sonner-toast",
            }}
          />
        </LoadingProvider>
      </body>
    </html>
  );
}

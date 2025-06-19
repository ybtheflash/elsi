"use client";
import { useEffect } from "react";
import Logo from "../../components/Logo";
import { Home, ExternalLink } from "lucide-react";
import Link from "next/link";

export default function SubmitPage() {  useEffect(() => {
    const script = document.createElement("script");
    script.src = "//embed.typeform.com/next/embed.js";
    script.async = true;
    
    // Handle script loading errors
    script.onerror = () => {
      console.warn("Failed to load Typeform embed script");
    };
    
    document.body.appendChild(script);
    
    return () => {
      try {
        document.body.removeChild(script);
      } catch (error) {
        // Script might have already been removed
        console.warn("Script already removed or not found");
      }
    };
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100vw",
        background: "linear-gradient(120deg, #010232 0%, #c8a2c8 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
      }}
    >
      {/* Top left: Logo */}
      <div
        style={{
          position: "fixed",
          top: 24,
          left: 24,
          zIndex: 100,
          display: "flex",
          alignItems: "center",
        }}
      >
        <a
          href="https://myenglishlearners.in"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Go to English Learners main site"
          style={{
            display: "flex",
            alignItems: "center",
            textDecoration: "none",
          }}
        >
          <Logo />
        </a>
      </div>

      {/* Top right: External link icon and Home icon */}
      <div
        style={{
          position: "fixed",
          top: 24,
          right: 24,
          zIndex: 100,
          display: "flex",
          alignItems: "center",
          gap: "0.6em",
        }}
      >
        <a
          href="https://form.typeform.com/to/EoR5TN7f"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Open Typeform Externally"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(1,2,50,0.45)",
            borderRadius: "0.7em",
            padding: "0.45em",
            boxShadow: "0 2px 10px 0 rgba(200, 162, 200, 0.13)",
            border: "1.5px solid rgba(200, 162, 200, 0.25)",
            backdropFilter: "blur(12px) saturate(160%)",
            color: "#fff",
            transition: "background 0.3s, color 0.3s",
            textDecoration: "none",
          }}
        >
          <ExternalLink size={24} />
        </a>
        <Link
          href="/"
          aria-label="Back Home"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(1,2,50,0.45)",
            borderRadius: "0.7em",
            padding: "0.45em",
            boxShadow: "0 2px 10px 0 rgba(200, 162, 200, 0.13)",
            border: "1.5px solid rgba(200, 162, 200, 0.25)",
            backdropFilter: "blur(12px) saturate(160%)",
            color: "#fff",
            transition: "background 0.3s, color 0.3s",
            textDecoration: "none",
          }}
        >
          <Home size={26} />
        </Link>
      </div>

      {/* Glass overlay for Typeform */}
      <div
        className="glass"
        style={{
          width: "100vw",
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backdropFilter: "blur(24px) saturate(160%)",
          background: "rgba(1,2,50,0.40)",
        }}
      >
        <div
          data-tf-live="01JVW2VW7G96A7WC52XEK86YN3"
          style={{
            width: "100vw",
            height: "100vh",
            maxWidth: "100vw",
            maxHeight: "100vh",
          }}
        ></div>
      </div>
    </div>
  );
}

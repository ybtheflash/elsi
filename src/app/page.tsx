"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Logo from "../components/Logo";
import { ShinyButton } from "../components/magicui/shiny-button";
import { BookOpen, Info } from "lucide-react";

export default function Home() {
  const [showInfo, setShowInfo] = useState(false);
  const router = useRouter();

  const openBrochure = () => {
    window.open("/ELSI-25.pdf", "_blank");
  };

  const navigateToDashboard = () => {
    router.push("/login");
  };  return (
    <div className="min-h-screen flex flex-col">
      {/* Brand Logo - Top Left */}
      <div className="fixed top-4 left-4 z-50">
        <Logo />
      </div>

      {/* Dashboard Button - Top Right */}
      <div className="dashboard-button">
        <ShinyButton onClick={navigateToDashboard} className="text-sm px-4 py-2">
          Dashboard
        </ShinyButton>
      </div>

      {/* Main Section */}
      <main className="flex-1 flex flex-col items-center justify-center gap-8 md:gap-12 px-4">
        <div className="text-center space-y-2 md:space-y-4">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold bg-gradient-to-r from-purple-600 via-pink-500 to-indigo-600 dark:from-purple-400 dark:via-pink-400 dark:to-indigo-400 bg-clip-text text-transparent mb-1 md:mb-2">
            ELSI 2025
          </h1>          <h2 className="text-lg md:text-2xl font-semibold text-white">
            English Learners Summer Internship
          </h2>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 md:gap-6 items-center justify-center mt-2">
          <button onClick={openBrochure} className="btn-main flex items-center gap-2">
            <BookOpen size={18} />
            Brochure
          </button>
          <button
            onClick={() => setShowInfo(true)}
            className="btn-main bg-gradient-to-r from-pink-500 to-purple-600 flex items-center gap-2"
          >
            <Info size={18} />
            More Info
          </button>
        </div>
      </main>      {/* Info Modal */}
      {showInfo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center modal-overlay p-2 md:p-4" onClick={() => setShowInfo(false)} style={{ zIndex: 99999 }}>
          <div className="glass-card rounded-3xl p-5 md:p-8 max-w-lg md:max-w-2xl w-full max-h-[90vh] overflow-y-auto modal-content" onClick={e => e.stopPropagation()} style={{ zIndex: 100000 }}>
            <div className="flex justify-between items-center mb-3 md:mb-4">
              <h2 className="text-xl md:text-2xl font-bold text-purple-700 dark:text-purple-300">
                About ELSI
              </h2>
              <button
                onClick={() => setShowInfo(false)}
                className="text-3xl font-bold text-white hover:text-purple-200 transition-colors px-2"
                aria-label="Close info modal"
                style={{ lineHeight: 1 }}
              >
                ×
              </button>
            </div>            <div className="space-y-4 md:space-y-6 text-white text-base md:text-lg">
              <section>
                <h3 className="font-semibold text-base md:text-lg mb-1 text-white">
                  What is ELSI?
                </h3>
                <p className="text-white">
                  ELSI (English Learners Summer Internship) is a hands-on program
                  for students of classes 10-12 to gain real-world experience in
                  content creation, video editing, and social media management
                  with English Learners.
                </p>
              </section>
              <section>
                <h3 className="font-semibold text-base md:text-lg mb-1 text-white">
                  Quick Facts
                </h3>                <ul className="list-disc list-inside ml-4 space-y-1 text-white">
                  <li>
                    <b>Duration:</b> 3 months (June - August)
                  </li>
                  <li>
                    <b>Eligibility:</b> Class 10+ & English Learners students
                  </li>
                  <li>
                    <b>Domains:</b> Video Editing, Social Media, Content Writing
                  </li>
                  <li>
                    <b>Mode:</b> Online, flexible hours
                  </li>
                  <li>
                    <b>Stipend:</b> Performance-based
                  </li>
                  <li>
                    <b>Slots:</b> At least 2 per domain
                  </li>
                </ul>
              </section>
              <section>
                <h3 className="font-semibold text-base md:text-lg mb-1 text-white">
                  Selection Process
                </h3>
                <ul className="list-disc list-inside ml-4 space-y-1 text-white">
                  <li>Apply and choose your preferred domain</li>
                  <li>Complete a short, domain-specific task</li>
                  <li>Judged on creativity, quality, and punctuality</li>
                  <li>Selected students join a private orientation group</li>
                </ul>              </section>
              <section>
                <h3 className="font-semibold text-base md:text-lg mb-1 text-white">
                  What You'll Gain
                </h3>
                <ul className="list-disc list-inside ml-4 space-y-1 text-white">
                  <li>Real project experience</li>
                  <li>Team collaboration</li>
                  <li>Certificates & recognition</li>
                  <li>Performance-based stipend</li>
                </ul>
              </section>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

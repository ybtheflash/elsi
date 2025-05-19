"use client";
import { useState } from "react";
import Logo from "../components/Logo";

export default function Home() {
  const [showModal, setShowModal] = useState(false);
  const [showMessage, setShowMessage] = useState("");

  const openBrochure = () => {
    window.open("/ELSE-25.pdf", "_blank");
  };

  const applyClick = () => {
    setShowMessage("Will be active soon. Stay Tuned.");
  };

  const loginClick = () => {
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-between">
      {/* Overlay for dimming background */}
      <div className="fixed inset-0 bg-black/40 z-0" aria-hidden="true"></div>

      {/* Header */}
      <header className="relative z-10 flex justify-between items-center px-4 md:px-10 py-6">
        <Logo />
        <button
          onClick={loginClick}
          className="glass px-6 py-2 font-semibold text-[var(--color-lilacish)] hover:bg-[var(--color-lilacish)] hover:text-[var(--color-navy)] transition border border-[var(--color-lilacish)] shadow-lg"
        >
          Login
        </button>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 py-8">
        <section className="glass w-full max-w-2xl mx-auto flex flex-col items-center gap-8 p-8 md:p-12 shadow-2xl">
          {/* Heading */}
          <h1 className="brand-heading text-4xl md:text-5xl font-bold text-white text-center drop-shadow-lg">
            ELSI 2025
          </h1>
          {/* Subtitle */}
          <h2 className="text-xl md:text-2xl font-semibold text-white/90 text-center tracking-wide mb-2">
            English Learners Student Internship
          </h2>
          {/* Details */}
          <div className="w-full flex flex-col items-center gap-4">
            <p className="text-white/90 text-base md:text-lg text-center max-w-xl">
              A unique, hands-on internship program designed and run by Maithree
              Roy’s English Learners. This is your opportunity to join a
              creative team, build your skills, and make your mark!
            </p>
            <ul className="list-disc list-inside space-y-1 text-white/90 text-left mx-auto max-w-md">
              <li>Open to students of class 10-12 (Offline Batch)</li>
              <li>
                Work on real-world content creation, video editing, and social
                media projects
              </li>
              <li>Collaborate with a dynamic, supportive team</li>
              <li>Boost your resume and confidence</li>
              <li>Earn certificates, stipends, and official recognition</li>
            </ul>
          </div>
          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 w-full justify-center mt-2">
            <button
              onClick={openBrochure}
              className="w-full sm:w-auto glass px-8 py-3 rounded-xl font-semibold text-[var(--color-lilacish)] bg-white/20 hover:bg-white/30 hover:text-[var(--color-navy)] transition shadow-md"
            >
              Brochure
            </button>
            <button
              onClick={applyClick}
              className="w-full sm:w-auto glass px-8 py-3 rounded-xl font-semibold text-[var(--color-lilacish)] bg-white/20 animate-pulse hover:bg-white/30 hover:text-[var(--color-navy)] transition shadow-md"
            >
              Apply
            </button>
          </div>
          {/* Message */}
          {showMessage && (
            <div className="text-white text-center text-lg font-semibold mt-2">
              {showMessage}
            </div>
          )}
        </section>
      </main>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={closeModal}
          ></div>
          <div className="glass relative z-10 p-8 max-w-xs w-full text-center border-2 border-[var(--color-lilacish)] shadow-2xl">
            <p className="mb-4 font-semibold text-lg text-white">
              Hey! Hold your horses buddy, let&apos;s apply first?
            </p>
            <button
              onClick={closeModal}
              className="mt-2 px-6 py-2 rounded-xl font-semibold bg-[var(--color-lilacish)] text-[var(--color-navy)] hover:bg-[var(--color-navy)] hover:text-[var(--color-lilacish)] transition border border-[var(--color-lilacish)]"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="relative z-10 glass mx-4 md:mx-auto my-6 max-w-2xl flex flex-col sm:flex-row justify-center items-center gap-4 py-4 px-6 border-t border-[var(--color-lilacish)]">
        <a
          href="https://www.youtube.com/@englishlearnersyt"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[var(--color-lilacish)] hover:underline text-lg"
        >
          YouTube
        </a>
        <span className="hidden sm:inline text-[var(--color-lilacish)]">|</span>
        <a
          href="https://myenglishlearners.in"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[var(--color-lilacish)] hover:underline text-lg"
        >
          myenglishlearners.in
        </a>
      </footer>
    </div>
  );
}

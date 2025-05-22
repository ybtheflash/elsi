"use client";
import { useState } from "react";
import PushableButton from "../components/PushableButton";
import SubmitTaskButton from "../components/SubmitTaskButton";
import Logo from "../components/Logo";
import {
  UserRound,
  Youtube,
  Globe,
  Users,
  BadgeCheck,
  Sparkles,
  ArrowRightCircle,
  BookOpen,
  Video,
  PenLine,
  MonitorPlay,
  Calendar,
  Coins,
  Layers,
  CheckCircle2,
  ClipboardList,
  Award,
  ListChecks,
  Instagram,
} from "lucide-react";

export default function Home() {
  const [showModal, setShowModal] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);

  const openBrochure = () => {
    window.open("/ELSI-25.pdf", "_blank");
  };

  const downloadTaskBooklet = () => {
    window.open("/Task Booklet - ELSI-25.pdf", "_blank");
  };

  const loginClick = () => {
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  return (
    <div className="relative min-h-screen flex flex-col bg-transparent">
      {/* Overlay for dimming background */}
      <div
        className="fixed inset-0 bg-black/40 z-0 pointer-events-none"
        aria-hidden="true"
      ></div>

      {/* Header */}
      <header className="relative z-10 flex justify-between items-center px-4 md:px-10 py-6 max-w-screen-lg mx-auto w-full">
        <a
          href="https://myenglishlearners.in"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Go to English Learners main site"
          className="focus:outline-none focus:ring-2 focus:ring-[var(--color-lilacish)] rounded"
        >
          <Logo />
        </a>
        <button
          onClick={loginClick}
          className="glass px-6 py-2 font-semibold flex items-center gap-2 text-[var(--color-lilacish)] hover:bg-[var(--color-lilacish)] hover:text-[var(--color-navy)] transition border border-[var(--color-lilacish)] shadow"
        >
          <UserRound size={20} />
          Login
        </button>
      </header>

      {/* HERO SECTION */}
      <section className="relative z-10 flex flex-col items-center justify-center px-4 pt-10 pb-16 max-w-screen-lg mx-auto w-full">
        <div className="glass w-full md:w-4/5 lg:w-3/5 flex flex-col items-center gap-4 p-8 md:p-12 shadow-md">
          <h1 className="brand-heading text-4xl md:text-5xl font-bold text-white text-center drop-shadow-lg flex items-center justify-center gap-3">
            <Sparkles size={38} className="text-[var(--color-lilacish)]" />
            ELSI 2025
          </h1>
          <h2 className="text-xl md:text-2xl font-semibold text-white/90 text-center tracking-wide mb-2 flex items-center gap-2 justify-center">
            <Award size={22} className="text-[var(--color-lilacish)]" />
            English Learners Summer Internship
          </h2>
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-10 w-full items-center justify-center mt-3">
            <PushableButton
              onClick={openBrochure}
              color="#00296b" // deep blue for Brochure
              text="#fff"
            >
              Brochure
            </PushableButton>
            <PushableButton
              onClick={() => setShowApplyModal(true)}
              color="#fdc500" // bright gold for Apply
              text="#00296b"
            >
              Apply
            </PushableButton>
          </div>

          {/* Apply Modal */}
          {showApplyModal && (
            <div className="fixed inset-0 flex items-center justify-center z-50">
              <div
                className="absolute inset-0 bg-black/60"
                onClick={() => setShowApplyModal(false)}
              ></div>
              <div className="glass relative z-10 p-8 max-w-sm w-full text-center border-2 border-[var(--color-lilacish)] shadow-2xl flex flex-col gap-6 items-center bg-[#00142e]">
                <h3 className="text-xl font-bold text-white mb-2">
                  ELSI 2025 Application
                </h3>
                <div className="flex flex-col justify-center items-center gap-4 w-full">
                  <PushableButton onClick={downloadTaskBooklet}>
                    Task Booklet
                  </PushableButton>
                  <SubmitTaskButton
                    onClick={() => (window.location.href = "/submit")}
                  />
                </div>
                <button
                  onClick={() => setShowApplyModal(false)}
                  className="mt-4 text-[var(--color-lilacish)] underline"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ABOUT SECTION */}
      <section className="relative z-10 flex justify-center px-4 py-10">
        <div className="glass max-w-2xl w-full p-8 flex flex-col items-center gap-4 shadow">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen size={28} className="text-[var(--color-lilacish)]" />
            <span className="text-2xl font-bold text-white brand-heading">
              What is ELSI?
            </span>
          </div>
          <p className="text-white/90 text-center text-lg">
            ELSI (English Learners Summer Internship) is a unique, hands-on
            program designed and run by English Learners. It offers students
            from classes 10 - 12 a chance to gain real-world experience in
            content creation, video editing, and social media management while
            working closely with our educational platform.
          </p>
        </div>
      </section>

      {/* BENEFITS SECTION */}
      <section className="relative z-10 flex justify-center px-4 py-10">
        <div className="glass max-w-2xl w-full p-8 flex flex-col items-center gap-6 shadow">
          <div className="flex items-center gap-2 mb-2">
            <BadgeCheck size={28} className="text-[var(--color-lilacish)]" />
            <span className="text-2xl font-bold text-white brand-heading">
              Through ELSI, you can:
            </span>
          </div>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
            <li className="flex items-center gap-3 text-white/90">
              <CheckCircle2
                size={22}
                className="text-[var(--color-lilacish)]"
              />
              Apply your skills to real projects
            </li>
            <li className="flex items-center gap-3 text-white/90">
              <Users size={22} className="text-[var(--color-lilacish)]" />
              Collaborate with a creative team
            </li>
            <li className="flex items-center gap-3 text-white/90">
              <ArrowRightCircle
                size={22}
                className="text-[var(--color-lilacish)]"
              />
              Boost your resume and confidence
            </li>
            <li className="flex items-center gap-3 text-white/90">
              <BadgeCheck size={22} className="text-[var(--color-lilacish)]" />
              Earn certificates, stipends, and recognition
            </li>
          </ul>
        </div>
      </section>

      {/* QUICK INFO SECTION */}
      <section className="relative z-10 flex justify-center px-4 py-10">
        <div className="glass max-w-3xl w-full p-8 flex flex-col gap-6 shadow">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center gap-3">
              <Calendar size={22} className="text-[var(--color-lilacish)]" />
              <span className="text-white/90">
                <span className="font-semibold">Duration:</span> 3 months (June
                - August)
              </span>
            </div>
            <div className="flex items-center gap-3">
              <ClipboardList
                size={22}
                className="text-[var(--color-lilacish)]"
              />
              <span className="text-white/90">
                <span className="font-semibold">Eligibility:</span> Class 10+
                &amp; English Learners Offline Batch
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Layers size={22} className="text-[var(--color-lilacish)]" />
              <span className="text-white/90">
                <span className="font-semibold">Domains:</span> Video Editing,
                Social Media, Content Writing
              </span>
            </div>
            <div className="flex items-center gap-3">
              <MonitorPlay size={22} className="text-[var(--color-lilacish)]" />
              <span className="text-white/90">
                <span className="font-semibold">Mode:</span> Mostly online,
                flexible hours
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Coins size={22} className="text-[var(--color-lilacish)]" />
              <span className="text-white/90">
                <span className="font-semibold">Stipend:</span>{" "}
                Performance-based
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Users size={22} className="text-[var(--color-lilacish)]" />
              <span className="text-white/90">
                <span className="font-semibold">Slots:</span> At least 2 per
                domain
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* SELECTION PROCESS SECTION */}
      <section className="relative z-10 flex justify-center px-4 py-10">
        <div className="glass max-w-2xl w-full p-8 flex flex-col gap-4 shadow">
          <div className="flex items-center gap-2 mb-2">
            <ListChecks size={28} className="text-[var(--color-lilacish)]" />
            <span className="text-2xl font-bold text-white brand-heading">
              Selection Process
            </span>
          </div>
          <p className="text-white/80">
            Our process identifies students who are talented, committed, and
            enthusiastic. After you apply and choose your preferred domain,
            you’ll receive a short, domain-specific task to complete within a
            limited time. Your submission will be judged on creativity, quality,
            timely completion, and your proficiency in using relevant tools or
            apps.
          </p>
          <ul className="list-disc list-inside text-white/80 ml-4 space-y-1">
            <li>
              We value punctuality, teamwork, and seriousness about
              responsibilities.
            </li>
            <li>
              You must have enough free time and be available for the full 3
              months.
            </li>
            <li>
              If selected, you’ll be invited to a private group for orientation
              and onboarding.
            </li>
          </ul>
        </div>
      </section>

      {/* DOMAINS SECTION */}
      <section className="relative z-10 flex justify-center px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full">
          {/* Video Editing */}
          <div className="glass p-6 rounded-xl flex flex-col gap-2 items-start border border-[var(--color-lilacish)] shadow">
            <div className="flex items-center gap-2 mb-1">
              <Video size={22} className="text-[var(--color-lilacish)]" />
              <span className="font-semibold text-white">Video Editing</span>
            </div>
            <ul className="list-disc list-inside text-white/80 ml-4 space-y-1 text-sm">
              <li>Edit short-form videos and YouTube Shorts</li>
              <li>Add graphics, subtitles, transitions, music, effects</li>
              <li>
                Optimize videos for YouTube; create mini educational videos
              </li>
              <li>Coordinate with content and social teams</li>
              <li>Meet deadlines and adapt to feedback</li>
            </ul>
          </div>
          {/* Social Media Management */}
          <div className="glass p-6 rounded-xl flex flex-col gap-2 items-start border border-[var(--color-lilacish)] shadow">
            <div className="flex items-center gap-2 mb-1">
              <Instagram size={22} className="text-[var(--color-lilacish)]" />
              <span className="font-semibold text-white">
                Social Media Management
              </span>
            </div>
            <ul className="list-disc list-inside text-white/80 ml-4 space-y-1 text-sm">
              <li>Design posts &amp; stories for Instagram, LinkedIn</li>
              <li>Write captions, hashtags, and promotional texts</li>
              <li>Schedule, publish, and share content regularly</li>
              <li>Engage audience, track trends, analyze performance</li>
              <li>Collaborate for consistency across platforms</li>
            </ul>
          </div>
          {/* Content Writing */}
          <div className="glass p-6 rounded-xl flex flex-col gap-2 items-start border border-[var(--color-lilacish)] shadow">
            <div className="flex items-center gap-2 mb-1">
              <PenLine size={22} className="text-[var(--color-lilacish)]" />
              <span className="font-semibold text-white">Content Writing</span>
            </div>
            <ul className="list-disc list-inside text-white/80 ml-4 space-y-1 text-sm">
              <li>Prepare raw content for YouTube videos (CBSE/ICSE/ISC)</li>
              <li>Write articles, grammar tips, summaries, explanations</li>
              <li>Draft quizzes, worksheets, and sample papers</li>
              <li>Research topics and ensure originality</li>
              <li>Edit and adapt content for various platforms</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={closeModal}
          ></div>
          <div className="glass relative z-10 p-8 max-w-xs w-full text-center border-2 border-[var(--color-lilacish)] shadow-2xl">
            <p className="mb-4 font-semibold text-lg text-white flex items-center justify-center gap-2">
              <UserRound size={22} className="text-[var(--color-lilacish)]" />
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
          className="flex items-center gap-2 text-[var(--color-lilacish)] hover:underline text-lg"
        >
          <Youtube size={20} /> YouTube
        </a>
        <span className="hidden sm:inline text-[var(--color-lilacish)]">|</span>
        <a
          href="https://myenglishlearners.in"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-[var(--color-lilacish)] hover:underline text-lg"
        >
          <Globe size={20} /> myenglishlearners.in
        </a>
      </footer>
    </div>
  );
}

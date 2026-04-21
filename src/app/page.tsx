"use client";

import { Navbar } from "@/components/navbar";
import { Hero } from "@/components/hero";
import { ToolStatusBanner } from "@/components/tool-status-banner";
import { SettingsPanel } from "@/components/settings-panel";
import { LinkInput } from "@/components/link-input";
import { GlobalDefaults } from "@/components/global-defaults";
import { QueueSection } from "@/components/queue-section";
import { ActionBar } from "@/components/action-bar";
import { Footer } from "@/components/footer";
import { ToastContainer } from "@/components/toast-container";
import { UserGuide } from "@/components/user-guide";

export default function Home() {
  return (
    <div className="relative z-[2] max-w-[1240px] mx-auto px-10 max-md:px-5 pt-8 pb-20">
      <Navbar />
      <Hero />
      <UserGuide />
      <ToolStatusBanner />
      <SettingsPanel />
      <LinkInput />
      <GlobalDefaults />
      <QueueSection />
      <ActionBar />
      <Footer />
      <ToastContainer />
    </div>
  );
}

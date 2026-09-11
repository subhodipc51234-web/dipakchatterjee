// app/(site)/complaints/page.tsx
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import ComplaintForm from "@/components/complaints/ComplaintForm";

export const metadata = {
  title: "Submit a Complaint — Dipak Chatterjee",
  description: "File a complaint with Dipak Chatterjee's office and get a reference number for follow-up.",
};

export default function ComplaintsPage() {
  return (
    <main className="bg-paper-100 dark:bg-navy-900 min-h-screen transition-colors">
      <div className="max-w-6xl mx-auto px-5 md:px-8 py-12 md:py-16 grid lg:grid-cols-[0.85fr_1.15fr] gap-10 md:gap-14">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-600 dark:text-paper-100/70 hover:text-navy-900 dark:hover:text-white mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>

          <p className="text-[var(--theme-primary)] font-semibold text-sm mb-3">Citizen Support</p>

          <h1 className="font-display text-3xl md:text-4xl text-navy-900 dark:text-white leading-tight">
            Tell us what&rsquo;s wrong. We&rsquo;ll follow up.
          </h1>

          <p className="mt-5 text-ink-600 dark:text-paper-100/70 leading-relaxed">
            Every submission is logged with a reference number and routed to the right person
            &mdash; a school, a ward office, or a welfare department. Fill in the form, get your
            reference number, and expect a call within 3&ndash;5 working days.
          </p>

          <div className="mt-8 p-5 rounded-lg border border-line dark:border-white/10 bg-white dark:bg-navy-800">
            <p className="text-sm text-ink-600 dark:text-paper-100/70">
              <span className="font-semibold text-navy-900 dark:text-white">Urgent safety issue?</span>{" "}
              Mark it clearly in your description below, or email the office directly at{" "}
              <a
                href="mailto:dipak.chatterjee304@gmail.com"
                className="text-[var(--theme-primary)] font-medium"
              >
                dipak.chatterjee304@gmail.com
              </a>
              .
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-line dark:border-white/10 bg-white dark:bg-navy-800 overflow-hidden">
          <div className="bg-[var(--theme-secondary)] px-6 md:px-8 py-5">
            <p className="text-white font-display text-lg">Complaint Form</p>
          </div>

          <div className="p-6 md:p-8">
            <ComplaintForm />
          </div>
        </div>
      </div>
    </main>
  );
}

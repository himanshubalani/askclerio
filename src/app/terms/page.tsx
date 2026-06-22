import Image from "next/image";
import Link from "next/link";

export default function TermsOfUsePage() {
  return (
    <main className="min-h-screen bg-white selection:bg-[#bfdbf7] selection:text-[#022b3a]">
      {/* Header */}
      <header className="border-b border-[#e1e5f2] bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-6">
          <Link
            href="/"
            className="text-sm font-medium text-[#022b3a]/60 hover:text-[#022b3a] transition-colors"
          >
            ← Back to home
          </Link>
		  <Link
            href="/privacy"
            className="text-sm font-medium text-[#022b3a]/60 hover:text-[#022b3a] transition-colors"
          >
            Read Privacy Policy
          </Link>
        </div>
      </header>

      {/* Content */}
      <article className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-3xl font-bold text-[#022b3a] mb-2">Terms of Use</h1>
        <p className="text-sm text-[#022b3a]/50 mb-12">Effective Date: 22 June 2026</p>

        <div className="prose prose-sm max-w-none text-[#022b3a]/80 space-y-8">
          <p>
            Welcome to Clerio (available at askclerio.dev). Clerio is an AI-powered productivity tool designed to help you reclaim your inbox and manage your schedule by integrating directly with your Gmail and Google Calendar.
          </p>
          <p>
            By accessing or using Clerio, you agree to be bound by these Terms of Use. If you do not agree, you may not use the service.
          </p>

          <section>
            <h2 className="text-lg font-semibold text-[#022b3a] mb-3">1. Acceptance of Terms</h2>
            <p>
              By creating an account or using the Clerio web application, you acknowledge that you have read, understood, and agreed to be bound by these Terms. These terms constitute a legally binding agreement between you and Clerio.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#022b3a] mb-3">2. Description of Service</h2>
            <p className="mb-3">Clerio provides an &ldquo;AI-powered command center&rdquo; that connects to your Workspace. Key features include:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Smart Inbox:</strong> AI-driven triage and thread summarization.</li>
              <li><strong>Calendar Integration:</strong> Real-time visibility and management of Google Calendar events alongside your email.</li>
              <li><strong>AI Assistant:</strong> Drafting replies, scheduling meetings, and performing cross-platform queries.</li>
            </ul>
            <p className="mt-3 rounded-lg bg-[#f0f7ff] border border-[#bfdbf7] p-3 text-sm">
              <strong>Beta Notice:</strong> Clerio is currently in an early access / beta phase. The service is subject to frequent updates, changes, and potential periods of instability. We appreciate your feedback as we refine the experience.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#022b3a] mb-3">3. User Eligibility</h2>
            <p>
              You must be at least 13 years of age to use Clerio. By using the service, you represent and warrant that you meet this age requirement and have the legal capacity to enter into these terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#022b3a] mb-3">4. Account Responsibilities</h2>
            <p className="mb-3">To use Clerio, you must connect your Google Workspace account via OAuth.</p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Security:</strong> You are responsible for maintaining the confidentiality of your Google credentials. Clerio does not store your Google password but relies on secure OAuth tokens to access your data.</li>
              <li><strong>Unauthorized Use:</strong> You must immediately notify us of any unauthorized use of your account or any other breach of security. Clerio will not be liable for any losses caused by unauthorized use of your account.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#022b3a] mb-3">5. Acceptable Use Policy</h2>
            <p className="mb-3">You agree not to use Clerio for any of the following:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Abuse:</strong> Engaging in any activity that interferes with or disrupts the service or the servers and networks connected to it.</li>
              <li><strong>Automated Access:</strong> Using any automated means, including &ldquo;scraping,&rdquo; robots, or data mining tools, to access the service.</li>
              <li><strong>Illegal Purposes:</strong> Using Clerio for any illegal or unauthorized purpose, including the violation of privacy or intellectual property rights.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#022b3a] mb-3">6. AI-Generated Content Disclaimer</h2>
            <p className="mb-3">Clerio uses large language models (LLMs) to generate summaries, drafts, and insights.</p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Accuracy:</strong> AI-generated outputs may not always be accurate, complete, or up-to-date. Users should independently verify any critical information generated by the AI assistant.</li>
              <li><strong>User Discretion:</strong> You are solely responsible for any emails sent or calendar events created based on AI-generated drafts.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#022b3a] mb-3">7. Google API Usage Compliance</h2>
            <p>
              Clerio&apos;s use and transfer of information received from Google APIs will adhere to the Google API Services User Data Policy, including the Limited Use requirements. We only request the minimum permissions necessary to provide the inbox and calendar features.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#022b3a] mb-3">8. Disclaimer of Warranties</h2>
            <p className="uppercase text-xs tracking-wide leading-relaxed">
              Clerio is provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis, without warranties of any kind, either express or implied. This is especially relevant during our beta phase. We do not warrant that the service will be uninterrupted, error-free, or completely secure.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#022b3a] mb-3">9. Limitation of Liability</h2>
            <p className="uppercase text-xs tracking-wide leading-relaxed">
              To the maximum extent permitted by applicable law, Clerio and its affiliates shall not be liable for any indirect, incidental, special, or consequential damages arising out of your use of the service, including but not limited to loss of data or profits.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#022b3a] mb-3">10. Termination</h2>
            <p>
              We reserve the right to suspend or terminate your access to Clerio at our sole discretion, without notice, for conduct that we believe violates these Terms or is harmful to other users, us, or third parties.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#022b3a] mb-3">11. Changes to Terms</h2>
            <p>
              We may modify these Terms at any time. We will notify you of any significant changes by posting the new Terms on our website and updating the &ldquo;Effective Date.&rdquo; Your continued use of the service after such changes constitutes your acceptance of the new Terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#022b3a] mb-3">12. Governing Law and Jurisdiction</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of India. Any disputes arising under or in connection with these Terms shall be subject to the exclusive jurisdiction of the courts located in Nagpur, India.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#022b3a] mb-3">Contact Us</h2>
            <p>
              If you have any questions about these Terms, please contact us at{" "}
              <a href="mailto:support@askclerio.dev" className="text-[#1f7a8c] underline">support@askclerio.dev</a>
            </p>
          </section>
        </div>
      </article>

      {/* Footer */}
      <footer className="border-t border-[#e1e5f2] px-6 py-8 bg-[#fcfcfc]">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <Image src="/clerio_header_light_mode.svg" alt="Clerio" width={64} height={22} />
          <div className="flex items-center gap-6 text-xs text-[#022b3a]/50">
            <Link href="/privacy" className="hover:text-[#022b3a] transition-colors">Privacy Policy</Link>
            <span className="font-medium text-[#022b3a]/70">Terms of Use</span>
            <span>© {new Date().getFullYear()} Clerio</span>
          </div>
        </div>
      </footer>
    </main>
  );
}

import Image from "next/image";
import Link from "next/link";

export default function PrivacyPolicyPage() {
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
            href="/terms"
            className="text-sm font-medium text-[#022b3a]/60 hover:text-[#022b3a] transition-colors"
          >
            Read Terms of Use
          </Link>
        </div>
      </header>

      {/* Content */}
      <article className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-3xl font-bold text-[#022b3a] mb-2">Privacy Policy for Clerio</h1>
        <p className="text-sm text-[#022b3a]/50 mb-12">Effective Date: 22 June 2026</p>

        <div className="prose prose-sm max-w-none text-[#022b3a]/80 space-y-8">
          <section>
            <h2 className="text-lg font-semibold text-[#022b3a] mb-3">1. Introduction</h2>
            <p>
              Welcome to Clerio (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;). We operate the web application at askclerio.dev. We are committed to protecting your privacy. This policy explains what information we collect, how we use it, and your rights regarding your data.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#022b3a] mb-3">2. Information We Collect</h2>
            <p className="mb-3">To provide our AI-powered productivity services, we collect:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Account Information:</strong> When you sign up via Clerk, we collect your name, email address, and authentication details.</li>
              <li><strong>Gmail Data:</strong> We access your Gmail messages to summarize, organize, and help you manage your inbox.</li>
              <li><strong>Calendar Data:</strong> We access your Google Calendar events to help you schedule and manage your time.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#022b3a] mb-3">3. How We Use Your Data</h2>
            <p className="mb-3">We use your data solely to provide and improve the Clerio service:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>AI Features:</strong> Your email and calendar data are processed by OpenAI AI models to provide productivity assistance.</li>
              <li><strong>Service Delivery:</strong> We use your data to maintain the application, ensure functionality, and improve performance.</li>
              <li><strong>No Sale of Data:</strong> We do not sell your personal information or content to third parties for their marketing purposes.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#022b3a] mb-3">4. Third-Party Services</h2>
            <p className="mb-3">We use trusted third-party services to operate Clerio:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Google APIs:</strong> Used to securely access your Gmail and Calendar.</li>
              <li><strong>Clerk:</strong> Used to manage user authentication and identity.</li>
              <li><strong>Neon PostgreSQL:</strong> Used for secure database storage.</li>
              <li><strong>Inngest:</strong> Used to manage background jobs and service workflows.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#022b3a] mb-3">5. Cookies and Session Handling</h2>
            <p>
              We use cookies and similar technologies to manage your session, keep you logged in, and remember your preferences while you use our application.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#022b3a] mb-3">6. Your Rights and Controls</h2>
            <p className="mb-3">You have full control over your data:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Access &amp; Deletion:</strong> You can access, export, or request the deletion of your data at any time.</li>
              <li><strong>Revoking Permissions:</strong> You can revoke Clerio&apos;s access to your Google account (Gmail and Calendar) at any time directly through your Google account security settings.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#022b3a] mb-3">7. Data Retention</h2>
            <p>
              We retain your data only for as long as necessary to provide our services and meet legal obligations. When you delete your account, we take steps to securely delete your personal data from our systems.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#022b3a] mb-3">8. Contact Us</h2>
            <p>
              If you have questions about this policy or wish to exercise your privacy rights, please contact us at:{" "}
              <a href="mailto:privacy@askclerio.dev" className="text-[#1f7a8c] underline">privacy@askclerio.dev</a>{" "}
              or{" "}
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
            <span className="font-medium text-[#022b3a]/70">Privacy Policy</span>
            <Link href="/terms" className="hover:text-[#022b3a] transition-colors">Terms of Use</Link>
            <span>© {new Date().getFullYear()} Clerio</span>
          </div>
        </div>
      </footer>
    </main>
  );
}

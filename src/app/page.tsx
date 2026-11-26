import WaitlistForm from "@/components/waitlist-form";
import Image from "next/image";

export default function Home() {
  return (
    <main className="page-shell">
      <div className="ambient ambient-one" aria-hidden="true" />
      <div className="ambient ambient-two" aria-hidden="true" />

      <section className="content">
        <a className="brand" href="/" aria-label="SAFEN home">
          <Image
            src="/safen-logo.jpg"
            alt="SAFEN - Safe Nigeria"
            width={620}
            height={510}
            priority
            className="brand-logo"
          />
        </a>

        <div className="status"><span className="status-dot" /> COMING SOON</div>

        <h1>Join the <span>waitlist.</span></h1>
        <p className="intro">
          {/* A safer Nigeria starts with all of us. Be among the first to experience
          SAFEN and get notified when we launch. */}
        </p>

        <WaitlistForm />

        <p className="privacy">
          Your information stays private. We’ll only use it to contact you
          about the SAFEN launch.
        </p>
      </section>

      <footer className="footer">
        <span>SAFEN</span>
        <span>SAFE NIGERIA</span>
      </footer>
    </main>
  );
}

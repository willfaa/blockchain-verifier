// frontend/app/page.tsx
import Image from "next/image";
import Link from "next/link";

const navLinks = [
  { label: "Home", href: "#home" },
  { label: "Courses", href: "/courses" },
  { label: "Features", href: "#features" },
  { label: "About", href: "#about" },
  { label: "Verification", href: "/verify" },
];

const courses = [
  {
    title: "Rangkaian Perangkat Lunak",
    body: "Design, build, and ship resilient software with modular lessons.",
    meta: "5 Modules",
    href: "/courses/software",
    image: "/course/placeholder.svg",
  },
  {
    title: "Teknik Komputer Jaringan",
    body: "Network fundamentals, cloud edges, and secure deployments.",
    meta: "7 Modules",
    href: "/courses/networking",
    image: "/course/placeholder.svg",
  },
  {
    title: "Gain Knowledge",
    body: "Mix and match courses for deeper mastery. Swap in your own cards.",
    meta: "Curated tracks",
    href: "/courses",
    image: "/course/placeholder.svg",
  },
  {
    title: "Data and Analytics",
    body: "Pipelines, dashboards, and decision-ready insights across domains.",
    meta: "6 Modules",
    href: "/courses/data",
    image: "/course/placeholder.svg",
  },
];

const features = [
  {
    title: "Transparent Academic Records",
    body: "Every learning activity and achievement is recorded on a secure blockchain ledger, driving data integrity and traceability.",
    image: "/features/placeholder.svg",
  },
  {
    title: "Tamper Proof Records",
    body: "All records are stored on-chain to prevent manipulation.",
    image: "/features/placeholder.svg",
  },
  {
    title: "Built for the Future of Education",
    body: "By leveraging Web3 technologies, Chainnesa bridges traditional academic systems and the digital frontier.",
    image: "/features/placeholder.svg",
  },
];

const footerLinks = {
  quick: [
    { label: "Home", href: "#home" },
    { label: "Courses", href: "#courses" },
    { label: "Features", href: "#features" },
    { label: "About", href: "#about" },
    { label: "Verification", href: "/verify" },
  ],
  resources: [
    { label: "Docs", href: "#verification" },
    { label: "FAQ", href: "#" },
    { label: "Support", href: "#" },
    { label: "Blog", href: "#" },
  ],
  social: [
    { label: "LinkedIn", href: "#" },
    { label: "GitHub", href: "#" },
    { label: "Twitter", href: "#" },
  ],
};

export default function Home() {
  return (
    <div className="min-h-screen bg-linear-to-b from-[#0b0724] via-[#0d0b2f] to-[#130f3d] text-slate-50">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 top-10 h-72 w-72 rounded-full bg-fuchsia-500/20 blur-3xl" />
        <div className="absolute right-0 top-40 h-64 w-64 rounded-full bg-cyan-500/20 blur-3xl" />
      </div>

      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0d0b2f]/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 sm:px-10 lg:px-14">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-cyan-400 via-blue-500 to-fuchsia-500 text-lg font-semibold text-slate-950 shadow-lg shadow-cyan-500/25">
              Cn
            </div>
            <div>
              <p className="text-lg font-semibold">Chainnesa</p>
              <p className="text-xs text-slate-300">
                Blockchain-based Learning Management System
              </p>
            </div>
          </div>

          <nav className="hidden items-center gap-6 text-sm text-slate-200 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="transition hover:text-white hover:underline"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3 text-sm">
            <Link
              href="/verify"
              className="hidden rounded-full border border-white/25 px-4 py-2 font-semibold transition hover:border-white hover:-translate-y-0.5 md:inline-flex"
            >
              Verify
            </Link>
            <Link
              href="/issuer"
              className="rounded-full bg-linear-to-r from-fuchsia-500 via-orange-400 to-amber-300 px-4 py-2 font-semibold text-slate-950 shadow-lg shadow-fuchsia-500/25 transition hover:-translate-y-0.5"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <main className="relative mx-auto flex max-w-6xl flex-col px-6 sm:px-10 lg:px-14">
        <section
          id="home"
          className="grid grid-cols-1 items-center gap-10 pb-16 pt-12 lg:grid-cols-[1.1fr_0.9fr]"
        >
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-cyan-100 ring-1 ring-white/20">
              Web3 ecosystem - Chainnesa LMS
            </div>
            <h1 className="text-4xl font-bold leading-tight text-white sm:text-5xl">
              Blockchain-Based Learning Management System
            </h1>
            <p className="max-w-2xl text-base text-slate-200 sm:text-lg">
              Learn any course with verifiable records. Chainnesa anchors
              achievements to IPFS + Hyperledger Fabric so every certificate is
              tamper-evident and easy to validate.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/issuer"
                className="rounded-lg bg-linear-to-r from-blue-500 via-cyan-400 to-emerald-400 px-5 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/25 transition hover:-translate-y-0.5 hover:shadow-cyan-500/35"
              >
                Get Started
              </Link>
              <Link
                href="/verify"
                className="rounded-lg border border-white/30 px-5 py-3 text-sm font-semibold text-slate-50 transition hover:border-white hover:-translate-y-0.5"
              >
                Go to Verification
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg shadow-black/25">
                <p className="text-sm font-semibold text-white">
                  Transparent ledger
                </p>
                <p className="mt-2 text-sm text-slate-200">
                  Every course milestone is recorded, auditable, and shareable.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg shadow-black/25">
                <p className="text-sm font-semibold text-white">
                  Instant verification
                </p>
                <p className="mt-2 text-sm text-slate-200">
                  Partners validate via certId or hash, without manual emails.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg shadow-black/25">
                <p className="text-sm font-semibold text-white">
                  Built for educators
                </p>
                <p className="mt-2 text-sm text-slate-200">
                  Issue credentials from your LMS while keeping existing flows.
                </p>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-4 rounded-3xl bg-linear-to-br from-fuchsia-500/10 via-blue-500/10 to-cyan-400/10 blur-3xl" />
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl shadow-black/30">
              <Image
                src="/hero/placeholder.svg"
                alt="Dashboard preview placeholder"
                width={480}
                height={320}
                className="h-full w-full object-cover"
                priority
              />
            </div>
          </div>
        </section>

        <section id="courses" className="space-y-6 pb-14">
          <div className="text-center">
            <p className="text-sm uppercase tracking-[0.2em] text-cyan-100">
              Our Courses
            </p>
            <h2 className="mt-2 text-3xl font-semibold text-white sm:text-4xl">
              Explore programs and start learning
            </h2>
          </div>
          <div className="grid grid-cols-1 justify-items-center gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {courses.map((course) => (
              <div
                key={course.title}
                className="group relative flex h-full min-h-[360px] w-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-xl shadow-black/25 transition hover:-translate-y-1 hover:border-white/20 hover:shadow-fuchsia-500/20"
              >
                <div className="absolute -left-10 top-0 h-32 w-32 rounded-full bg-fuchsia-500/10 blur-2xl transition group-hover:scale-110" />
                <div className="space-y-4 p-5">
                  <div className="rounded-xl border border-white/10 bg-slate-900/70 p-3">
                    <Image
                      src={course.image}
                      alt={course.title}
                      width={360}
                      height={260}
                      className="h-36 w-full object-cover"
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs uppercase tracking-wide text-cyan-100">
                    <span>{course.meta}</span>
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white">
                    {course.title}
                  </h3>
                  <p className="text-sm text-slate-200">{course.body}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-center">
            <Link
              href="/courses"
              className="rounded-full bg-linear-to-r from-blue-500 via-cyan-400 to-emerald-400 px-6 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/25 transition hover:-translate-y-0.5 hover:shadow-cyan-500/35"
            >
              Start courses
            </Link>
          </div>
        </section>

        <section id="features" className="space-y-6 pb-14">
          <div className="text-center">
            <p className="text-sm uppercase tracking-[0.2em] text-cyan-100">
              Our Features
            </p>
            <h2 className="mt-2 text-3xl font-semibold text-white sm:text-4xl">
              Why institutions trust Chainnesa
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-linear-to-r from-white/5 via-white/7 to-white/5 p-5 shadow-lg shadow-black/25 transition hover:-translate-y-1 hover:border-white/20"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-white/10 bg-slate-900/70">
                    <Image
                      src={feature.image}
                      alt={feature.title}
                      width={64}
                      height={64}
                      className="h-12 w-12 object-contain"
                    />
                  </div>
                  <h3 className="text-xl font-semibold text-white">
                    {feature.title}
                  </h3>
                </div>
                <p className="text-sm text-slate-200">{feature.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section
          id="verification"
          className="grid grid-cols-1 gap-6 pb-14 lg:grid-cols-[1.1fr_0.9fr]"
        >
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl shadow-black/20">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-cyan-100">
              Verification
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            </div>
            <h2 className="mt-2 text-2xl font-semibold text-white">
              Check a certificate in three steps
            </h2>
            <p className="mt-1 text-sm text-slate-200">
              Use the certId from the learner. We look up the on-chain record,
              cross-check the IPFS CID, and surface the stored hash.
            </p>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {["Issue", "Distribute", "Verify"].map((title, idx) => (
                <div
                  key={title}
                  className="rounded-2xl border border-white/10 bg-slate-900/70 p-4"
                >
                  <div className="flex items-center gap-2 text-xs font-semibold text-cyan-100">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-white">
                      {idx + 1}
                    </span>
                    {title}
                  </div>
                  <p className="mt-2 text-xs text-slate-200">
                    {idx === 0 &&
                      "Upload the credential, add learner details, anchor to IPFS + Fabric."}
                    {idx === 1 &&
                      "Share the certId or verification link with learners and partners."}
                    {idx === 2 &&
                      "Confirm integrity by checking the chain-stored hash and CID."}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-5 flex flex-wrap gap-3 text-sm">
              <Link
                href="/issuer"
                className="rounded-full bg-white px-4 py-2 font-semibold text-slate-900 shadow-lg shadow-cyan-500/25 transition hover:-translate-y-0.5"
              >
                Issue a new credential
              </Link>
              <Link
                href="/verify"
                className="rounded-full border border-white/30 px-4 py-2 font-semibold text-slate-50 transition hover:border-white hover:-translate-y-0.5"
              >
                Verify now
              </Link>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-xl shadow-black/25">
            <p className="text-sm font-semibold text-white">
              How this verify endpoint works
            </p>
            <ul className="mt-3 space-y-3 text-sm text-slate-200">
              <li className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-emerald-400" />
                The frontend sends
                <code className="ml-1 rounded bg-slate-950/60 px-1 py-0.5 text-[0.7rem]">
                  certId
                </code>
                to
                <code className="ml-1 rounded bg-slate-950/60 px-1 py-0.5 text-[0.7rem]">
                  POST http://localhost:4000/verify
                </code>
                .
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-cyan-400" />
                Backend reads metadata from PostgreSQL and cross-checks anchors
                on Hyperledger Fabric.
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-blue-400" />
                The IPFS CID renders the original file via gateway
                <code className="ml-1 rounded bg-slate-950/60 px-1 py-0.5 text-[0.7rem]">
                  127.0.0.1:8080/ipfs/[cid]
                </code>
                , while the SHA-256 hash guarantees integrity.
              </li>
            </ul>
            <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-slate-100">
              <p className="font-semibold text-white">Current endpoints</p>
              <p className="mt-2">POST http://localhost:4000/issue</p>
              <p>POST http://localhost:4000/verify</p>
              <p className="mt-2 text-slate-300">
                Hook these into your frontend or partner portals.
              </p>
            </div>
          </div>
        </section>

        <section
          id="about"
          className="grid grid-cols-1 items-center gap-10 pb-14 lg:grid-cols-[1.05fr_0.95fr]"
        >
          <div className="space-y-4">
            <p className="text-sm uppercase tracking-[0.2em] text-cyan-100">
              About Us
            </p>
            <h2 className="text-3xl font-semibold text-white sm:text-4xl">
              Built on Chainnesa for tamper-proof learning
            </h2>
            <p className="text-base text-slate-200 sm:text-lg">
              Chainnesa is a blockchain-powered learning management system (LMS)
              designed to bring transparency, security, and authenticity to
              digital education records for every learner. Achievements, online
              academic records, and certifications are tamper-proof and
              verifiable.
            </p>
            <Link
              href="/verify"
              className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-200 transition hover:text-white"
            >
              Learn more
              <span aria-hidden>-&gt;</span>
            </Link>
          </div>
          <div className="relative">
            <div className="absolute inset-4 rounded-3xl bg-linear-to-br from-amber-400/10 via-fuchsia-500/10 to-blue-500/10 blur-3xl" />
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl shadow-black/30">
              <Image
                src="/features/placeholder.svg"
                alt="About Chainnesa placeholder"
                width={420}
                height={260}
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 bg-[#0c0a24]/80 py-10">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-6 sm:px-10 lg:px-14 md:grid-cols-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-white">Chainnesa</span>
              <span className="rounded-full border border-white/20 px-2 py-0.5 text-[0.7rem] uppercase tracking-wide text-amber-200">
                Web3 Learning
              </span>
            </div>
            <p className="text-sm text-slate-300">
              Blockchain-based LMS for transparent records and verifiable
              credentials.
            </p>
          </div>

          <div>
            <p className="text-sm font-semibold text-white">Quick Links</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-300">
              {footerLinks.quick.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="transition hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold text-white">Resources</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-300">
              {footerLinks.resources.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="transition hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-semibold text-white">Stay in touch</p>
            <div className="flex gap-2">
              {footerLinks.social.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/5 text-sm font-semibold text-slate-200 transition hover:border-white hover:text-white"
                >
                  {item.label[0]}
                </Link>
              ))}
            </div>
            <div className="flex flex-col gap-2 text-sm text-slate-300">
              <p className="font-semibold text-white">Newsletter</p>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="Enter email"
                  className="w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-sm text-white outline-none ring-0 placeholder:text-slate-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/40"
                />
                <button className="rounded-lg bg-linear-to-r from-fuchsia-500 to-orange-400 px-4 text-sm font-semibold text-slate-950 shadow-md shadow-fuchsia-500/25 transition hover:-translate-y-0.5">
                  Subscribe
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-8 text-center text-xs text-slate-400">
          (c) {new Date().getFullYear()} Chainnesa. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

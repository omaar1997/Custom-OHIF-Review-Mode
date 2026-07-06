import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-100 px-6 py-16 text-slate-900">
      <div className="w-full max-w-3xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">OHIF-inspired prototype</p>
        <h1 className="mt-3 text-3xl font-semibold">Radiology Review Mode</h1>
        <p className="mt-4 max-w-2xl text-base text-slate-600">
          This demo implements a custom review workflow with a dedicated route, a review-mode layout shell,
          and a reusable notes panel for study review.
        </p>

        <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-medium text-slate-700">Open the review route</p>
          <Link
            href="/review/demo"
            className="mt-3 inline-flex cursor-pointer rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
          >
            Launch Radiology Review Mode
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function UnauthorizedPage() {
  return (
    <main className="min-h-screen bg-[#050505] px-6 py-20 text-white">
      <div className="mx-auto max-w-xl rounded-[2rem] border border-white/10 bg-white p-8 text-center text-black shadow-2xl">
        <h1 className="text-3xl font-extrabold">Access Denied</h1>
        <p className="mt-3 text-neutral-600">
          You do not have permission to view this admin page.
        </p>

        <a
          href="/admin"
          className="mt-6 inline-block rounded-full bg-yellow-500 px-6 py-3 font-bold text-black"
        >
          Back to Dashboard
        </a>
      </div>
    </main>
  );
}
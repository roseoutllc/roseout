export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center px-6">
        <h1 className="text-5xl font-bold">RoseOut</h1>

        <p className="mt-4 text-lg text-neutral-300">
          Plan the perfect night out in seconds.
        </p>

        <a href="/create">
          <button className="mt-8 px-6 py-3 bg-yellow-500 text-black rounded-xl font-semibold">
            Start Planning
          </button>
        </a>
      </div>
    </main>
  );
}
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="container mx-auto max-w-2xl px-4 py-24">
      <div className="rounded-lg border border-white/10 bg-black/30 backdrop-blur-md p-8 text-center">
        <h1 className="text-3xl font-semibold mb-2 text-white/90">
          Страница не найдена
        </h1>
        <p className="text-white/70 mb-6">
          Похоже, такой страницы не существует.
        </p>
        <Link href="/" className="underline">
          На главную
        </Link>
      </div>
    </main>
  );
}

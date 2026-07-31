import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-10 p-6 text-center">
      <h1 className="text-3xl font-bold">Ewidencja godzin pracy</h1>

      <div className="flex w-full max-w-sm flex-col gap-5">
        <Link
          href="/pracownik"
          className="btn-big bg-blue-600 text-white shadow"
        >
          Jestem pracownikiem
        </Link>
        <Link
          href="/admin"
          className="btn-big bg-white text-gray-800 shadow ring-1 ring-gray-300"
        >
          Panel administratora
        </Link>
      </div>
    </div>
  );
}

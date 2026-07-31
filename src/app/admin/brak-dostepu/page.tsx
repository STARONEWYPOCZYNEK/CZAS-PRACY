import { signOutAdmin } from "../actions";

export default function BrakDostepuPage() {
  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-bold">Brak uprawnień</h1>
      <p className="text-gray-600">
        To konto nie ma uprawnień administratora w tej aplikacji.
      </p>
      <form action={signOutAdmin}>
        <button type="submit" className="btn-big bg-gray-100 text-gray-600">
          Wyloguj
        </button>
      </form>
    </div>
  );
}

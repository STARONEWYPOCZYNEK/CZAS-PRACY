export default function OfflinePage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-bold">Brak połączenia z internetem</h1>
      <p className="text-gray-600">
        Sprawdź połączenie i spróbuj ponownie. Wpisane wcześniej dane nie zostały zapisane.
      </p>
    </div>
  );
}

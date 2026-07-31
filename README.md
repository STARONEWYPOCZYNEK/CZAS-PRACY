# Ewidencja godzin pracy

Aplikacja mobilna (PWA) do rejestracji godzin pracy pracowników i rozliczania wynagrodzeń.

## Dla pracownika

Otwórz stronę główną → "Jestem pracownikiem" → wybierz swoje imię z listy → wpisz 4-cyfrowy PIN → dodaj wpis (data, rodzaj pracy, godziny, opis). Wpisy z ostatnich 24h można samodzielnie edytować lub usunąć.

Zalecane: na telefonie otwórz stronę w przeglądarce i wybierz "Dodaj do ekranu głównego" — appka będzie działać jak zwykła aplikacja.

## Dla administratora

"Panel administratora" → zaloguj się e-mailem (link logowania przyjdzie na maila). W panelu:
- **Pracownicy** — dodawanie, dezaktywacja, reset PIN-u
- **Rodzaje pracy** — nazwy i stawki PLN/h
- **Wpisy** — wszystkie wpisy z filtrem po pracowniku i dacie, edycja/usuwanie
- **Rozliczenie** — wybierz pracownika (lub wszystkich) i zakres dat, appka policzy sumę godzin i kwotę do wypłaty

## Stos technologiczny

Next.js (App Router) + TypeScript + Tailwind + Supabase (Postgres/Auth/RLS) + Vercel + PWA.

## Rozwój lokalny

```bash
npm install
npm run dev
```

Wymaga `.env.local` (patrz `.env.example`).

## Testy

```bash
npx vitest run
```

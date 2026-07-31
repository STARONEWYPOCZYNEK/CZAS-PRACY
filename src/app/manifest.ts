import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Ewidencja godzin pracy",
    short_name: "Godziny pracy",
    description: "Rejestracja godzin pracy i rozliczenia dla pracowników",
    start_url: "/",
    display: "standalone",
    background_color: "#f6f7f9",
    theme_color: "#2563eb",
    lang: "pl",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}

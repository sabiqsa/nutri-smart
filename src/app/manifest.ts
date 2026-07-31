import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "NutriSmart",
    short_name: "NutriSmart",
    description: "Nutrition & diet tracking for hospital care teams",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f9fb",
    theme_color: "#00478d",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}

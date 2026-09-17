import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SWAG Landscapes — Project Profit Tracker",
    short_name: "SWAG Tracker",
    description: "Track income and expenses per project and see profit at a glance.",
    start_url: "/",
    display: "standalone",
    background_color: "#12160F",
    theme_color: "#12160F",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}

import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "NetFault — Network troubleshooting",
    short_name: "NetFault",
    description: "Build your network troubleshooting instincts.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#0b1017",
    theme_color: "#0b1017",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}

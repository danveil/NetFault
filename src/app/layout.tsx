import type { Metadata, Viewport } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "NetFault — Learn to find the fault",
  description: "An evidence-first network troubleshooting lab for WIA2008.",
  applicationName: "NetFault",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "NetFault" },
  icons: { icon: "/icon.svg", apple: "/apple-touch-icon.png" },
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0b1017",
  viewportFit: "cover",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

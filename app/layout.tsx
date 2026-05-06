import type { Metadata, Viewport } from "next";
import "./globals.css";
import AppShell from "@/components/AppShell";
import {
  createPageMetadata,
  defaultDescription,
  defaultTitle,
  getSiteUrl,
  organizationJsonLd,
  safeJsonLd,
  siteName,
  websiteJsonLd,
} from "@/lib/seo";

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  ...createPageMetadata({
    title: defaultTitle,
    description: defaultDescription,
    path: "/",
  }),
  title: {
    default: defaultTitle,
    template: `%s | ${siteName}`,
  },
  applicationName: siteName,
  authors: [{ name: siteName }],
  creator: siteName,
  publisher: siteName,
  category: "travel",
  appleWebApp: {
    capable: true,
    title: siteName,
    statusBarStyle: "black-translucent",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#e1062a",
  colorScheme: "dark light",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: safeJsonLd([organizationJsonLd, websiteJsonLd]),
          }}
        />
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
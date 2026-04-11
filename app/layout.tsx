import type { Metadata } from "next";
import { Geist_Mono, Plus_Jakarta_Sans, Source_Serif_4 } from "next/font/google";
import "./globals.css";

/** UI body: neutral, high legibility — common SaaS / fintech pattern (2024–26). */
const fontSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

/** Headings: editorial serif — ties to “documents” / resume without feeling gimmicky. */
const fontHeading = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
});

const fontMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Resume AI Agent",
  description:
    "Your AI resume expert — tailor your CV to each job description with clear, honest framing.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${fontSans.variable} ${fontHeading.variable} ${fontMono.variable} h-full`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

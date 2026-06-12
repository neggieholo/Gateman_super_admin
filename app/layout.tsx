import type { Metadata } from "next";
import "./globals.css";
import { UserProvider } from "./UserContext";
import { Montserrat, Oswald, Roboto } from "next/font/google";
import Script from "next/script";
import { Toaster } from "react-hot-toast";

const oswald = Oswald({
  subsets: ["latin"],
  weight: ["600"],
  variable: "--font-oswald",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["700", "800"],
  variable: "--font-montserrat",
});

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-roboto",
});

export const metadata: Metadata = {
  title: {
    template: "%s | GateMan",
    default: "GateMan | Super Admin",
  },
  description: "Master access control.",
  // manifest: "/manifest.json",
  // icons: {
  //   icon: "/favicon.ico",
  //   apple: "/apple-icon.png",
  // },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // Moved font variables to HTML tag for clean portal inheritance
    <html
      lang="en"
      className={`${oswald.variable} ${montserrat.variable} ${roboto.variable}`}
    >
      <body className="antialiased">
        <UserProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              // Added gm-charcoal border styling globally to match your component profile layouts
              className:
                "font-sans text-sm rounded-[1.5rem] border border-gm-charcoal bg-white text-slate-900 shadow-xl p-4 max-w-sm",
              duration: 4000,
              // Overriding base styling properties safely for specific status components
              error: {
                style: {
                  borderColor: "var(--gm-charcoal, #2d3748)", // Falls back to tailwind palette if not explicitly typed in base config
                },
              },
              success: {
                style: {
                  borderColor: "var(--gm-charcoal, #2d3748)",
                },
              },
            }}
          />
        </UserProvider>

        <Script
          src="https://cdn.smileidentity.com/js/v1/smileid.js"
          strategy="beforeInteractive"
        />
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Poppins, Rubik } from "next/font/google";
import "./globals.css";

export const dynamic = 'force-dynamic';

import Header from "@/components/global/Header";
import Footer from "@/components/global/Footer";
import CartDrawer from "@/components/cart/CartDrawer";
import CartInitializer from "@/components/cart/CartInitializer";
import GiftManager from "@/components/cart/GiftManager";
import MobileBottomNav from "@/components/global/MobileBottomNav";
import PageLoader from "@/components/global/PageLoader";
import AnnouncementBar from "@/components/global/AnnouncementBar";
import MobileSocialStrip from "@/components/global/MobileSocialStrip";
import FloatingWhatsApp from "@/components/global/FloatingWhatsApp";
import MetaPixel from "@/components/global/MetaPixel";
import GoogleTagManager from "@/components/global/GoogleTagManager";
import GoogleAnalytics from "@/components/global/GoogleAnalytics";
import SvgFilters from "@/components/global/SvgFilters";
import CursorGlow from "@/components/global/CursorGlow";
import StoryTrackerNav from "@/components/global/StoryTrackerNav";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
});

const rubik = Rubik({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-rubik",
});

// Kalnia from Google Fonts — use next/font/google with display swap
import { Kalnia } from "next/font/google";
const kalnia = Kalnia({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-kalnia",
});

import { serverGetSettings } from "@/lib/server-data";

export async function generateMetadata(): Promise<Metadata> {
  const settings: any = await serverGetSettings();
  return {
    title: {
      template: settings.seo?.titleTemplate || "%s | Boutiique Vastraa",
      default: "Boutiique Vastraa",
    },
    description: settings.seo?.defaultDescription,
    keywords: settings.seo?.keywords,
  };
}

import { getCustomerToken } from "@/app/actions/auth";
import { Suspense } from "react";
import ScrollToTopOnPageChange from "@/components/global/ScrollToTopOnPageChange";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let token: string | null = null;
  try {
    token = await getCustomerToken();
  } catch {}
  const isLoggedIn = !!token;

  const settings: any = await serverGetSettings();
  const footerSettings = settings.footer || {};
  const headerSettings = settings.header || {};

  const rawWaNum = headerSettings.whatsappNumber || "919205238666";
  const cleanWaNum = rawWaNum;

  const gtmId = process.env.NEXT_PUBLIC_GTM_ID;

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${poppins.variable} ${kalnia.variable} ${rubik.variable} font-poppins antialiased`}>
        <SvgFilters />
        <CursorGlow />
        <StoryTrackerNav />
        {gtmId && (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
            />
          </noscript>
        )}
        <GoogleTagManager />
        <GoogleAnalytics />
        <MetaPixel />
        <Suspense fallback={null}>
          <ScrollToTopOnPageChange />
        </Suspense>
        <PageLoader />
        <div className="sticky top-0 z-50">
          <AnnouncementBar settings={headerSettings} />
          <Header isLoggedIn={isLoggedIn} settings={headerSettings} footerSettings={footerSettings} />
        </div>
        <CartDrawer />
        <CartInitializer />
        <GiftManager />
        <main className="min-h-screen font-poppins">
          {children}
        </main>
        <Footer settings={footerSettings} whatsappNumber={cleanWaNum} />
        <MobileSocialStrip
          facebook={footerSettings.facebookUrl}
          instagram={footerSettings.instagramUrl}
          pinterest={footerSettings.pinterestUrl}
          whatsapp={`https://wa.me/${cleanWaNum}`}
          youtube={footerSettings.youtubeUrl}
        />
        <FloatingWhatsApp whatsappNumber={cleanWaNum} />
        <MobileBottomNav />
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Poppins, Rubik } from "next/font/google";
import "./globals.css";

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
  display: "swap",
});

const rubik = Rubik({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-rubik",
  display: "swap",
});

// Kalnia from Google Fonts — use next/font/google with display swap
import { Kalnia } from "next/font/google";
const kalnia = Kalnia({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-kalnia",
  display: "swap",
});

import { serverGetSettings } from "@/lib/server-data";

export async function generateMetadata(): Promise<Metadata> {
  const settings: any = await serverGetSettings();
  const defaultDesc =
    settings.seo?.defaultDescription ||
    "Discover handcrafted Banarasi silk sarees, designer lehengas & premium Indian ethnic wear at Boutiique Vastraa. Enjoy authentic silk mark quality & free shipping across India. Shop our exclusive collection today!";

  return {
    metadataBase: new URL("https://boutiiquevastraa.com"),
    title: {
      template: settings.seo?.titleTemplate || "%s | Boutiique Vastraa",
      default: "Boutiique Vastraa – Handcrafted Sarees & Ethnic Wear",
    },
    description: defaultDesc,
    keywords:
      settings.seo?.keywords || [
        "saree",
        "Banarasi silk saree",
        "handcrafted sarees",
        "ethnic wear",
        "designer lehengas",
        "Boutiique Vastraa",
        "silk mark sarees",
      ],
    alternates: {
      canonical: "/",
    },
    icons: {
      icon: "/favicon.ico",
      apple: "/apple-touch-icon.png",
    },
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

  const siteJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://boutiiquevastraa.com/#organization",
        "name": "Boutiique Vastraa",
        "url": "https://boutiiquevastraa.com",
        "logo": {
          "@type": "ImageObject",
          "url": "https://boutiiquevastraa.com/images/logo.png"
        },
        "contactPoint": {
          "@type": "ContactPoint",
          "telephone": "+91-9205238666",
          "contactType": "customer service",
          "areaServed": "IN",
          "availableLanguage": ["en", "hi"]
        }
      },
      {
        "@type": "WebSite",
        "@id": "https://boutiiquevastraa.com/#website",
        "url": "https://boutiiquevastraa.com",
        "name": "Boutiique Vastraa",
        "description": "Handcrafted Banarasi Silk Sarees & Designer Ethnic Wear",
        "publisher": {
          "@id": "https://boutiiquevastraa.com/#organization"
        },
        "potentialAction": {
          "@type": "SearchAction",
          "target": {
            "@type": "EntryPoint",
            "urlTemplate": "https://boutiiquevastraa.com/search?q={search_term_string}"
          },
          "query-input": "required name=search_term_string"
        }
      }
    ]
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(siteJsonLd) }}
        />
      </head>
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

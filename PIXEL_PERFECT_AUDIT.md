# Pixel-Perfect Visual Reconstruction Audit
Target Reference: https://boutiquevastra.com/

## 1. Global Typography & Styling Audit
| Property | Reference | Current Next.js | Required Fix |
|---|---|---|---|
| Main Font | Poppins | Inter | Switch to `next/font/google` Poppins |
| Heading Font | Kalnia | Playfair Display | Switch to `next/font/google` Kalnia |
| Secondary Font | Rubik | N/A | Add Rubik for specific badges/accents |
| Colors | `bg-maroonClr`, `bg-goldClr`, `bg-creamClr` | Custom hex (#800020, #D4AF37) | Redefine exact Tailwind tokens in `tailwind.config.mjs` matching reference hexes. |

## 2. Component Inventory & Missing Elements

| Page / Component | Missing Section / Feature | Current Status | Required Fix |
|---|---|---|---|
| **Global Header** | WhatsApp Action Button | Missing | Add WhatsApp icon & `https://wa.me/...` link |
| **Global Header** | Track Order Button | Missing | Add Track Order routing & icon |
| **Global Header** | Mobile Bottom Nav Bar | Missing | Create fixed bottom nav for mobile (Home, Collections, Products, Profile) |
| **Global Header** | Initial Full-Screen Loader | Missing | Implement `loader-flip` animation on initial load |
| **Homepage** | Top Sellings Slider | Uses standard grid | Implement Splide.js or Embla for horizontal dragging |
| **Homepage** | Saree Tabs (Find Your Perfect Saree) | Missing | Add horizontal scrollable tabs for category switching |
| **Homepage** | What makes shopping special? | Missing | Add 6-grid feature cards (`craftmanship.jpeg`, `collection.jpg`, etc.) |
| **Homepage** | Testimonials Splide Slider | Exists but different UI | Match exactly: Left images column, right text column. |
| **Homepage** | FAQ Accordion | Missing | Add Radix/Tailwind Accordion for FAQs at the bottom. |
| **Pages** | `/track-order` | Missing | Create Route |
| **Pages** | `/sign-in-mobile` | Missing | Update Auth Routing |

## 3. Immediate Action Plan (Phase 10)
1. **Theme Override**: Update `layout.tsx` to load Poppins, Kalnia, and Rubik.
2. **Tailwind Override**: Rewrite `tailwind.config.mjs` to map `maroonClr`, `goldClr`, `creamClr` exactly.
3. **Header Rewrite**: Exact 1:1 rebuild of the Header & Sticky Mobile Bottom Nav.
4. **Homepage Reconstruction**: Break down into specific components (`TopSellingSlider`, `SareeTabs`, `FeaturesGrid`, `FaqAccordion`).

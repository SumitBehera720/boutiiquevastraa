# Homepage Section Map - boutiquevastra.com

Extracted from live DOM analysis on 2026-06-15.

## Section 0: Full-Screen Loader
- **Section Name:** Page Loader
- **Original Design:** Fixed overlay `bg-maroonClr`, centered logo with `loader-flip` CSS animation, fades out after page load
- **Required Component:** `components/global/PageLoader.tsx`
- **Data Source:** Static (logo image)
- **Animation:** CSS flip animation on logo, opacity fade-out on load complete

## Section 1: Sticky Header
- **Section Name:** Header (3-layer)
- **Original Design:**
  - Layer 1: Thin maroon announcement bar (empty but present)
  - Layer 2: Main header row — Logo center, Search right, WhatsApp button, Track Order button, Cart button, Login button, Mobile hamburger
  - Layer 3: Desktop navigation bar on cream background — "Collections" dropdown, "Products" dropdown
- **Required Component:** `components/global/Header.tsx` (complete rewrite)
- **Data Source:** Static + Shopify collections for dropdowns
- **Animation:** Dropdown chevron rotation, hamburger→X morph animation

## Section 2: Mobile Bottom Nav
- **Section Name:** MobileBottomNav
- **Original Design:** Fixed bottom bar `bg-maroonClr`, 4-column grid: Collections (saree.svg), Products (saree2.svg), Orders (layers icon), Profile (user icon). Uses `font-kalnia text-[10px]`
- **Required Component:** `components/global/MobileBottomNav.tsx`
- **Data Source:** Static
- **Animation:** translate-y slide in/out on scroll

## Section 3: Our Most Loved Collections
- **Section Name:** CollectionsSlider
- **Original Design:** Rangoli decorative image top-left (opacity-60), centered heading `font-kalnia text-maroonClr`, Splide horizontal slider of collection cards
- **Required Component:** `components/home/CollectionsSlider.tsx`
- **Data Source:** Shopify collections
- **Animation:** Splide autoplay slider
- **Padding:** `py-8 sm:py-12 md:py-16 lg:py-20`

## Section 4: Spot it. Style it. Own it.
- **Section Name:** PatternBanner
- **Original Design:** Full-width background image (`/images/pattern-bg.jpg`), dark overlay `bg-black/60 backdrop-blur-[1px]`, centered gold heading `text-goldClr font-kalnia`
- **Required Component:** `components/home/PatternBanner.tsx`
- **Data Source:** Static
- **Animation:** None (static banner)
- **Padding:** `py-8 sm:py-12 md:py-16 lg:py-20`

## Section 5: Top-Sellings
- **Section Name:** TopSellings
- **Original Design:** Rangoli decoration bottom-center (rotated), centered heading + description, Splide product slider, "View all" maroon pill button
- **Required Component:** `components/home/TopSellings.tsx`
- **Data Source:** Shopify products (bestsellers tag or first N products)
- **Animation:** Splide draggable slider
- **Padding:** `py-8 sm:py-12 md:py-16 lg:py-20`

## Section 6: Find Your Perfect Saree
- **Section Name:** PerfectSareeTabs
- **Original Design:** Rangoli decoration top-left, centered heading + description, horizontal scrollable tab bar (maroon pill bg), each tab shows a product Splide slider
- **Required Component:** `components/home/PerfectSareeTabs.tsx`
- **Data Source:** Shopify collections as tab categories
- **Animation:** Tab switching, Splide slider per tab
- **Padding:** `py-8 sm:py-12 md:py-16 lg:py-20`

## Section 7: Explore Best Categories
- **Section Name:** BestCategories
- **Original Design:** Rangoli decoration bottom-right, centered heading + description, responsive grid of category cards (`grid-cols-2 md:grid-cols-3 lg:grid-cols-4`), "Explore all" pill button
- **Required Component:** `components/home/BestCategories.tsx`
- **Data Source:** Shopify collections with images
- **Animation:** None (static grid)
- **Padding:** `px-4 pb-8 sm:pb-12 md:px-6 md:pb-16 lg:pb-20`

## Section 8: What Makes Shopping Special (Maroon Section)
- **Section Name:** FeaturesGrid
- **Original Design:** Full maroon background, 2-column header (gold heading left, white description right), 6 feature cards in `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` with gold card bg, image (aspect-video), maroon title, white description
- **Required Component:** `components/home/FeaturesGrid.tsx`
- **Data Source:** Static content with local images
- **Animation:** None
- **Padding:** `px-4 py-8 sm:py-12 md:px-6 md:py-16 lg:py-20`, border-b border-gray-400

## Section 9: What Our Customers Say (Still Maroon)
- **Section Name:** TestimonialsSection
- **Original Design:** Split layout — Left: image slider in `border-goldClr/20 rounded-2xl` container (w-full md:w-1/2 lg:w-5/12). Right: Text testimonial slider with avatar, name, role, and large quote text in `font-kalnia text-white`
- **Required Component:** `components/home/TestimonialsSection.tsx`
- **Data Source:** Static testimonial data (5 clients with images)
- **Animation:** Two synced Splide sliders (image + text)

## Section 10: FAQ Accordion (Still Maroon)
- **Section Name:** FaqAccordion
- **Original Design:** 2-column layout. Left: gold heading + white description + woman image. Right: Radix-style accordion with `border-goldClr` dividers, `font-kalnia text-xl sm:text-2xl` question text, chevron rotation
- **Required Component:** `components/home/FaqAccordion.tsx`
- **Data Source:** Static FAQ content (6 questions)
- **Animation:** Accordion open/close with height animation
- **Padding:** `border-t border-gray-400 pt-12 sm:pt-16 md:pt-20`

## Section 11: Footer
- **Section Name:** Footer
- **Original Design:** (Extracted from reference — needs separate DOM fetch for footer specifics)
- **Required Component:** `components/global/Footer.tsx` (rewrite)
- **Data Source:** Static

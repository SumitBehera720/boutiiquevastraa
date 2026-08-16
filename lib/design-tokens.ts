// Design tokens extracted from boutiquevastra.com reference
// These map directly to the Tailwind custom classes used in the original

export const colors = {
  // Primary maroon — extracted from meta theme-color
  maroonClr: '#8D0B41',
  
  // Gold accent — extracted from button/border computed styles
  goldClr: '#C9A84C',
  
  // Cream navigation background
  creamClr: '#FFF8F0',
  
  // Main page background  
  bgClr: '#FFFDF9',
  
  // Text colors
  textPrimary: '#171717',    // neutral-900
  textSecondary: '#525252',  // neutral-600
  textMuted: '#a3a3a3',      // neutral-400
  textWhite: '#ffffff',
} as const;

export const fonts = {
  poppins: 'Poppins',   // Body text
  kalnia: 'Kalnia',     // Headings / display
  rubik: 'Rubik',       // Accent / badges
} as const;

export const spacing = {
  sectionPadding: {
    base: 'py-8',
    sm: 'sm:py-12',
    md: 'md:py-16',
    lg: 'lg:py-20',
  },
  containerPadding: 'px-2 sm:px-4 md:px-6',
} as const;

// Feature card data matching reference exactly
export const featureCards = [
  {
    title: 'Heritage Craftsmanship',
    description: 'We work with skilled artisans preserving weaving traditions for generations, making every saree a timeless piece of art.',
    image: '/images/craftmanship.jpeg',
  },
  {
    title: 'Exclusive Collections',
    description: 'From wedding silks to everyday cottons, discover curated collections designed to match every occasion.',
    image: '/images/collection.jpg',
  },
  {
    title: 'Saree Care Guidance',
    description: 'Easy-to-follow care tips are shared with every order to help your saree stay beautiful for years.',
    image: '/images/care.jpg',
  },
  {
    title: 'Style Inspiration',
    description: 'Explore lookbooks and draping tutorials that show modern and elegant ways to style your sarees.',
    image: '/images/style.jpg',
  },
  {
    title: 'Eco-Friendly Practices',
    description: 'From sustainable packaging to conscious sourcing, we make choices that care for the planet.',
    image: '/images/eco.jpg',
  },
  {
    title: 'Made-to-Measure Options',
    description: 'Personalize your saree fit with tailored measurements for a flawless drape that\'s uniquely yours.',
    image: '/images/measure.jpg',
  },
] as const;

// Testimonial data matching reference exactly
export const testimonials = [
  {
    name: 'Rinki Paul',
    role: 'Happy Shopper',
    image: '/images/client-1.jpg',
    quote: 'Beautiful saree! The fabric feels soft and comfortable, and the colour looks exactly like the pictures. Very happy with the purchase. I just loved your Collection',
  },
  {
    name: 'Pampa Paul',
    role: 'Happy Shopper',
    image: '/images/client-2.jpg',
    quote: 'This saree exceeded my expectations. The craftsmanship is exquisite, with intricate weaving and a rich texture that feels luxurious. The colour is elegant and instantly elevates the entire look.',
  },
  {
    name: 'Pallabi Chakraborty',
    role: 'Repeat Customer',
    image: '/images/client-3.jpg',
    quote: 'Absolutely loved this saree! The fabric quality is excellent—soft, smooth, and very comfortable to drape. The colour is vibrant and looks even more stunning in person.',
  },
  {
    name: 'Pallabi Mitra',
    role: 'Repeat Customer',
    image: '/images/client-4.jpg',
    quote: 'Good quality, excellent weaving quality authenticity, and quality of the saree is satisfying. Great value for money, worth its price, and best in the market. Just love it!',
  },
  {
    name: 'Rama Rajbanshi',
    role: 'Repeat Customer',
    image: '/images/client-5.jpg',
    quote: 'This saree is beautiful, Excellent quality and fabric, Looks very elegant, and It\'s so comfortable to wear',
  },
  {
    name: 'Ananya Roy',
    role: 'Festive Shopper',
    image: '/images/client-1.jpg',
    quote: 'I ordered a silk saree for Durga Puja and it was stunning! The zari work is neat and the handloom quality is very authentic. Highly recommend Boutiique Vastraa to everyone.',
  },
  {
    name: 'Priyanka Sen',
    role: 'Saree Collector',
    image: '/images/client-2.jpg',
    quote: 'Amazing customer service and high-quality collection. The ordering process was smooth, and delivery was quick. The premium feel of their cotton sarees is incomparable.',
  },
] as const;

// FAQ data matching reference exactly
export const faqItems = [
  {
    question: 'Why buy Saree Online from Boutiique Vastraa?',
    answer: 'We offer handcrafted sarees sourced directly from artisans across India with guaranteed authenticity, competitive pricing, and doorstep delivery.',
  },
  {
    question: 'Do you provide Cash on Delivery (COD)?',
    answer: 'Yes, we offer Cash on Delivery on select products and locations. You can check availability during checkout.',
  },
  {
    question: 'How long does delivery take?',
    answer: 'Standard delivery takes 5-7 business days. Express shipping options are available for select locations.',
  },
  {
    question: 'Do you offer customization or blouse stitching?',
    answer: 'Yes, we offer blouse stitching and customization services. You can provide your measurements during checkout.',
  },
  {
    question: 'What if the product I received is damaged or defective?',
    answer: 'We have a hassle-free return and exchange policy. Contact our customer support within 48 hours of delivery.',
  },
  {
    question: 'Are the sarees exactly the same as shown in photos?',
    answer: 'We make every effort to photograph our sarees accurately. Minor color variations may occur due to screen settings.',
  },
  {
    question: 'Do you ship internationally?',
    answer: 'Currently, we only ship within India. We are working on offering international shipping soon.',
  },
  {
    question: 'How do I care for my handloom saree?',
    answer: 'We recommend dry cleaning for silk sarees. For cotton handlooms, hand wash separately in cold water using a mild liquid detergent and dry in shade.',
  },
  {
    question: 'Can I change or cancel my order after placing it?',
    answer: 'Orders can be modified or cancelled within 12 hours of placement by contacting our support team via email or WhatsApp.',
  },
  {
    question: 'Are the colors of the saree natural?',
    answer: 'Many of our traditional collections use organic, natural dyes, while some use safe, premium synthetic dyes to ensure long-lasting color brightness.',
  },
] as const;

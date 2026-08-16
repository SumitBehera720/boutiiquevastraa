import { notFound } from "next/navigation";

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: any) {
  const slug = (await params).slug;
  const titles: Record<string, string> = {
    "privacy-policy": "Privacy Policy",
    "terms-conditions": "Terms & Conditions",
    "refund-policy": "Refund Policy",
    "shipping-policy": "Shipping Policy",
    "return-policy": "Return Policy",
  };

  return {
    title: `${titles[slug] || "Policy"} | Boutiique Vastraa`,
    description: `Official ${titles[slug] || "Policy"} of Boutiique Vastraa premium ethnic wear online boutique.`,
  };
}

export default async function PolicyPage({ params }: any) {
  const slug = (await params).slug;
  
  const policies: Record<string, { title: string; content: string[] }> = {
    "privacy-policy": {
      title: "Privacy Policy",
      content: [
        "Welcome to Boutiique Vastraa. We value your privacy and are committed to protecting your personal information. This Privacy Policy details how we collect, use, and safeguard your data when you visit our website.",
        "1. Information We Collect: When you register, browse, or place an order, we collect details such as your name, email address, phone number, shipping address, and payment references.",
        "2. How We Use Your Information: We use your data to process orders, send order confirmations and invoices, update order delivery statuses, respond to customer queries, and customize your boutique browsing experience.",
        "3. Sharing of Information: We do not sell or lease your personal data. We only share information with trusted third-party service providers (such as shipping partners like Shiprocket, and payment gateways like PhonePe) required to fulfill your orders.",
        "4. Cookies: We use cookies to enhance navigation, remember items in your cart, and analyze traffic to improve our overall user experience.",
        "5. Security: We employ industry-standard secure socket layers (SSL) and database encryption to safeguard your data. While we strive to protect your info, no transmission method is 100% secure.",
        "If you have any questions or feedback regarding this privacy policy, please contact us at boutiiquevastraa@gmail.com."
      ]
    },
    "terms-conditions": {
      title: "Terms & Conditions",
      content: [
        "Welcome to the Boutiique Vastraa online boutique. By accessing or using this website, you agree to comply with and be bound by the following terms and conditions of use.",
        "1. Account Eligibility: You must provide accurate and complete personal details during registration to use our services. You are solely responsible for maintaining account confidentiality.",
        "2. Products and Pricing: We strive to display product colors, fabrics, and sizes as accurately as possible. However, actual color variations may occur depending on your screen settings. Prices are subject to change without prior notice.",
        "3. Orders & Cancellations: We reserve the right to cancel or limit order quantities at our discretion. Orders can be cancelled or modified within 12 hours of placement.",
        "4. Intellectual Property: All content, designs, images, and brand assets on this website are the property of Boutiique Vastraa and are protected by applicable trademark and copyright laws.",
        "5. Governing Law: These terms and conditions are governed by and construed in accordance with the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts in West Bengal.",
        "If you have any queries about our terms, please reach out to our legal department at boutiiquevastraa@gmail.com."
      ]
    },
    "refund-policy": {
      title: "Refund Policy",
      content: [
        "At Boutiique Vastraa, we want to ensure a transparent and fair refund process for all our customers. Please read our guidelines below regarding refunds.",
        "1. Refund Eligibility: Refunds are processed only for items returned within the eligible 7-day window that pass our quality inspection. Items must be unworn, unwashed, and have all original tags intact.",
        "2. Non-Refundable Items: Custom-tailored products, including pre-stitched blouses and customized sizing requests, are non-refundable unless they are delivered in a damaged or defective condition.",
        "3. Process & Timeline: Once we receive your returned package at our warehouse, we will verify the condition within 2-3 business days. Approved refunds are credited directly back to your original payment method (bank account, card, or UPI) within 7-10 business days.",
        "4. COD Refunds: For Cash on Delivery orders, we will request your bank account details or UPI ID securely to credit the refund amount directly.",
        "If you have any questions or require support, please contact us at boutiiquevastraa@gmail.com."
      ]
    },
    "shipping-policy": {
      title: "Shipping Policy",
      content: [
        "We are committed to delivering your premium handcrafted drapes and ethnic styles safely and quickly. Read below for details about our shipping guidelines.",
        "1. Order Processing: All orders are dispatched within 24-48 hours from our design studio. Orders placed on Sundays or national holidays are dispatched on the next business day.",
        "2. Shipping Charges: We are proud to offer FREE standard shipping on all domestic orders delivered within India, with no minimum purchase required.",
        "3. Delivery Timelines: Standard shipping across major Indian cities takes 3-5 business days. Remote pin codes or custom-tailored orders may require an additional 2-3 days for transit and stitching.",
        "4. Tracking and SMS Updates: Once shipped, you will receive a tracking link via email, SMS, and WhatsApp. You can track your shipment details in real time on our Track Order page.",
        "If you experience any delivery delays or need courier help, reach out to us at boutiiquevastraa@gmail.com."
      ]
    },
    "return-policy": {
      title: "Return Policy",
      content: [
        "We want you to love your Boutiique Vastraa purchase. If you are not completely satisfied, we offer a hassle-free 7-day return and exchange policy.",
        "1. Eligibility Criteria: Items must be returned in their original condition—unworn, unwashed, unaltered, and with all original tags and certifications (such as Silk Mark tags) intact.",
        "2. Non-Returnable Items: Customized tailored products (such as pre-stitched blouses and custom-fit apparel) and promotional sale items are not eligible for returns or exchanges unless received in a damaged condition.",
        "3. Return Process: To initiate a return, log into your account, visit your Order History, and request a return, or email us at boutiiquevastraa@gmail.com with your order number and invoice.",
        "4. Refunds: Once your return is received and inspected at our warehouse, we will notify you. Approved refunds will be credited back to your original payment method or bank account within 7-10 business days.",
        "For return requests or support, contact our returns team at boutiiquevastraa@gmail.com or WhatsApp us at +91 - 9205248666."
      ]
    }
  };

  const policy = policies[slug];

  if (!policy) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] py-16 px-4">
      <div className="container mx-auto max-w-4xl bg-white p-8 md:p-12 rounded-2xl shadow-sm border border-gray-100 animate-fadeIn">
        <h1 className="text-3xl md:text-5xl font-kalnia text-maroonClr font-bold text-center mb-8 pb-4 border-b border-gray-150 tracking-wide">
          {policy.title}
        </h1>
        <div className="space-y-6 text-gray-700 leading-relaxed font-sans text-sm md:text-base">
          {policy.content.map((paragraph, index) => (
            <p key={index} className={paragraph.match(/^\d\./) ? "font-semibold text-gray-900 mt-6" : ""}>
              {paragraph}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

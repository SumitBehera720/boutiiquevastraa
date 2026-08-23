import type { Metadata } from "next";
import ContactForm from "@/components/contact/ContactForm";
import { serverGetSettings } from "@/lib/server-data";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Get in touch with Boutiique Vastraa. We'd love to hear from you!",
};

export default async function ContactPage() {
  const settings = await serverGetSettings();
  const footerSettings = settings?.footer || {};
  const headerSettings = settings?.header || {};

  const email = footerSettings.contactEmail || "boutiiquevastraa@gmail.com";
  const contactPhone = footerSettings.contactPhone || "+91 - 9205238666";
  const whatsappNumber = headerSettings.whatsappNumber || "919205238666";
  return (
    <div className="bg-white min-h-screen">
      <div className="container mx-auto px-4 py-12 md:py-20 max-w-4xl">
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-center text-gray-900 mb-8">
          Contact Us
        </h1>
        
        <div className="grid md:grid-cols-2 gap-12">
          <div>
            <p className="text-gray-600 mb-6 leading-relaxed">
              Have a question, feedback, or just want to say hello? We&apos;d love to hear 
              from you. Reach out to us and our team will get back to you as soon as possible.
            </p>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-maroonClr mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
                <div>
                  <h3 className="font-medium text-gray-800">Email</h3>
                  <a href={`mailto:${email}`} className="text-gray-600 hover:text-maroonClr">
                    {email}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-maroonClr mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                </svg>
                <div>
                  <h3 className="font-medium text-gray-800">Phone / WhatsApp</h3>
                  <div className="flex flex-col gap-1 mt-0.5">
                    <a href={`tel:${contactPhone.replace(/[^0-9+]/g, "")}`} className="text-gray-600 hover:text-maroonClr text-sm">
                      Call: {contactPhone}
                    </a>
                    <a href={`https://wa.me/${whatsappNumber.replace(/[^0-9]/g, "")}`} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-maroonClr text-sm flex items-center gap-1">
                      WhatsApp: +91 - {whatsappNumber.replace(/^91/, "").replace(/(\d{5})(\d{5})/, "$1 $2")}
                    </a>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-maroonClr mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
                <div>
                  <h3 className="font-medium text-gray-800">Address</h3>
                  <p className="text-gray-600 text-sm leading-relaxed mt-0.5">
                    Boutiique Vastraa<br />
                    2 No Gouranga Colony, Koler Danga Road<br />
                    Nabadwip, West Bengal, Nadia, 741302<br />
                    India
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <ContactForm />
          </div>
        </div>
      </div>
    </div>
  );
}

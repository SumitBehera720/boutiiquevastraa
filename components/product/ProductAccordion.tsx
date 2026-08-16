"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

export default function ProductAccordion({ descriptionHtml }: { descriptionHtml: string }) {
  const [openSection, setOpenSection] = useState<string | null>("description");

  const toggle = (section: string) => {
    setOpenSection(openSection === section ? null : section);
  };

  const sections = [
    {
      id: "description",
      title: "Product Description",
      content: <div className="prose prose-sm max-w-none text-gray-600" dangerouslySetInnerHTML={{ __html: descriptionHtml }} />
    },
    {
      id: "shipping",
      title: "Shipping Information",
      content: <p className="text-sm text-gray-600 leading-relaxed">We offer standard and express shipping options. Orders are typically processed within 24-48 hours. Standard shipping takes 3-5 business days across India.</p>
    },
    {
      id: "returns",
      title: "Return Policy",
      content: <p className="text-sm text-gray-600 leading-relaxed">We accept returns within 7 days of delivery for unworn, unwashed merchandise with original tags attached. Please initiate a return request via your account dashboard.</p>
    },
    {
      id: "care",
      title: "Care Instructions",
      content: <p className="text-sm text-gray-600 leading-relaxed">Dry clean only. Keep away from direct sunlight when storing. Do not spray perfume directly on the fabric or zari work.</p>
    }
  ];

  return (
    <div className="border-t border-gray-200 mt-8">
      {sections.map((s) => (
        <div key={s.id} className="border-b border-gray-200">
          <button 
            className="w-full flex justify-between items-center py-4 text-left focus:outline-none"
            onClick={() => toggle(s.id)}
          >
            <span className="font-serif text-lg font-medium text-gray-900">{s.title}</span>
            {openSection === s.id ? (
              <ChevronUp className="w-5 h-5 text-gray-500" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-500" />
            )}
          </button>
          <div 
            className={`overflow-hidden transition-all duration-300 ease-in-out ${
              openSection === s.id ? "max-h-96 pb-4 opacity-100" : "max-h-0 opacity-0"
            }`}
          >
            {s.content}
          </div>
        </div>
      ))}
    </div>
  );
}

"use client";

import { useState } from "react";
import { submitContactFormAction } from "@/app/actions/contact";
import { Loader2, CheckCircle2, AlertCircle, Send } from "lucide-react";

export default function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === "loading") return;

    setStatus("loading");
    setErrorMessage("");

    try {
      const response = await submitContactFormAction({ name, email, message });
      if (response.success) {
        setStatus("success");
        // Clear fields on success
        setName("");
        setEmail("");
        setMessage("");
      } else {
        setStatus("error");
        setErrorMessage(response.error || "Something went wrong. Please try again.");
      }
    } catch (err: any) {
      setStatus("error");
      setErrorMessage("A network error occurred. Please check your connection and try again.");
    }
  };

  if (status === "success") {
    return (
      <div className="bg-[#FFF8F0] border border-[#f6e8c7] rounded-xl p-8 text-center animate-fadeIn shadow-sm">
        <div className="w-16 h-16 bg-[#8D0B41]/5 border border-[#8D0B41]/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-8 h-8 text-[#8D0B41]" />
        </div>
        <h3 className="text-xl font-serif font-bold text-[#8D0B41] mb-3">
          Message Sent!
        </h3>
        <p className="text-neutral-600 text-sm leading-relaxed max-w-md mx-auto mb-6">
          Thank you for reaching out to Boutiique Vastraa. We have received your query, and our team will get back to you shortly.
        </p>
        <button
          onClick={() => setStatus("idle")}
          className="bg-[#8D0B41] text-white px-6 py-2.5 rounded-md font-medium hover:bg-[#8D0B41]/90 transition-all text-sm uppercase tracking-wider font-semibold shadow-sm"
        >
          Send Another Message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 animate-fadeIn">
      {status === "error" && (
        <div className="flex gap-2.5 bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 text-sm animate-scaleUp">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="font-medium">{errorMessage}</p>
        </div>
      )}

      <div>
        <label htmlFor="name" className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1.5">
          Your Name
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={status === "loading"}
          className="w-full px-4 py-3 border border-neutral-200 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8D0B41]/10 focus:border-[#8D0B41] text-sm text-neutral-800 transition-all placeholder:text-neutral-400"
          placeholder="Enter your name"
          required
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1.5">
          Email Address
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={status === "loading"}
          className="w-full px-4 py-3 border border-neutral-200 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8D0B41]/10 focus:border-[#8D0B41] text-sm text-neutral-800 transition-all placeholder:text-neutral-400"
          placeholder="Enter your email"
          required
        />
      </div>

      <div>
        <label htmlFor="message" className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1.5">
          Message
        </label>
        <textarea
          id="message"
          name="message"
          rows={5}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={status === "loading"}
          className="w-full px-4 py-3 border border-neutral-200 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8D0B41]/10 focus:border-[#8D0B41] text-sm text-neutral-800 transition-all placeholder:text-neutral-400 resize-none"
          placeholder="How can we help you?"
          required
        />
      </div>

      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full bg-[#8D0B41] text-white py-3 rounded-lg font-bold uppercase tracking-widest text-xs hover:bg-[#8D0B41]/90 focus:ring-4 focus:ring-[#8D0B41]/20 transition-all duration-200 flex items-center justify-center gap-2 shadow-sm disabled:opacity-75 disabled:cursor-not-allowed cursor-pointer"
      >
        {status === "loading" ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Sending...
          </>
        ) : (
          <>
            <Send className="w-3.5 h-3.5" />
            Send Message
          </>
        )}
      </button>
    </form>
  );
}

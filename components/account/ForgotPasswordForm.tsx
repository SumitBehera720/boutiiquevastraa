"use client";

import { useState } from "react";
import Image from "next/image";
import { requestPasswordResetAction } from "@/app/actions/resetPassword";
import { AlertCircle, CheckCircle2, ArrowLeft } from "lucide-react";

export default function ForgotPasswordForm({ onToggleView }: { onToggleView: () => void }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await requestPasswordResetAction({ email });
      if (response.success) {
        setSuccessMessage(response.message || "A password reset link has been sent to your email.");
      } else {
        setError(response.error || "Failed to request password reset.");
      }
    } catch (err: any) {
      setError("A connection error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[420px] bg-white rounded-2xl shadow-xl border border-gray-100 p-8 md:p-10 animate-scaleUp">
      {/* Brand Header */}
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-neutral-900 rounded-lg p-1.5 border border-[#C9A84C]/25 mx-auto mb-4 flex items-center justify-center relative shadow-sm">
          <Image 
            src="/images/logo.png" 
            alt="Boutiique Vastraa" 
            fill 
            className="object-contain p-1"
          />
        </div>
        <h2 className="text-lg font-serif font-bold text-gray-900 uppercase tracking-widest">
          Boutiique Vastraa
        </h2>
        <p className="text-xs text-gray-500 mt-2">Reset Password</p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-3.5 rounded-lg mb-6 text-xs font-semibold border border-red-100 text-center animate-fadeIn flex items-center justify-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMessage ? (
        <div className="space-y-6 text-center animate-fadeIn">
          <div className="w-12 h-12 bg-green-50 border border-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6 text-green-600" />
          </div>
          <p className="text-xs text-neutral-600 leading-relaxed">
            {successMessage}
          </p>
          <button
            onClick={onToggleView}
            className="w-full bg-[#8D0B41] text-white py-3.5 rounded font-bold uppercase tracking-widest text-xs hover:bg-[#6A102A] transition-colors shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-xs text-neutral-500 text-center leading-relaxed mb-4">
            Enter your registered email address and we will send you a secure link to reset your password.
          </p>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Email ID</label>
            <input 
              type="email" 
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              placeholder="Enter your email address"
              className="w-full border border-gray-300 rounded px-4 py-3 text-xs text-gray-800 focus:outline-none focus:border-[#8D0B41] focus:ring-1 focus:ring-[#8D0B41] transition-all bg-[#FDFBF7]"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-[#8D0B41] text-white py-3.5 rounded font-bold uppercase tracking-widest text-xs hover:bg-[#6A102A] transition-colors shadow-md hover:shadow-lg disabled:bg-gray-400 mt-2 flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Sending Link...
              </>
            ) : (
              "Send Reset Link"
            )}
          </button>

          <button
            type="button"
            onClick={onToggleView}
            disabled={loading}
            className="w-full border border-gray-200 text-gray-600 py-3.5 rounded font-bold uppercase tracking-widest text-xs hover:bg-gray-55 transition-colors flex items-center justify-center gap-2 mt-2 cursor-pointer"
          >
            Cancel
          </button>
        </form>
      )}
    </div>
  );
}

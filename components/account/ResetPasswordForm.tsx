"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { resetPasswordAction } from "@/app/actions/resetPassword";
import { Eye, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react";

interface ResetPasswordFormProps {
  email: string;
  token: string;
}

export default function ResetPasswordForm({ email, token }: ResetPasswordFormProps) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const router = useRouter();

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        router.push("/account/login");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success, router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (loading || success) return;

    setError(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await resetPasswordAction({
        email,
        token,
        password,
      });

      if (response.success) {
        setSuccess(true);
      } else {
        setError(response.error || "Failed to reset password.");
      }
    } catch (err: any) {
      setError("An unexpected network error occurred. Please try again.");
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
        <p className="text-xs text-gray-500 mt-2">Choose New Password</p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-3.5 rounded-lg mb-6 text-xs font-semibold border border-red-100 text-center animate-fadeIn flex items-center justify-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success ? (
        <div className="space-y-6 text-center animate-fadeIn">
          <div className="w-12 h-12 bg-green-50 border border-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6 text-green-600" />
          </div>
          <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Password Reset!</h3>
          <p className="text-xs text-neutral-600 leading-relaxed">
            Your password has been successfully reset. You will be redirected to the login page shortly...
          </p>
          <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
            <div className="bg-[#8D0B41] h-full animate-loadingBar rounded-full" />
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">New Password</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                placeholder="At least 6 characters"
                className="w-full border border-gray-300 rounded px-4 py-3 pr-10 text-xs text-gray-800 focus:outline-none focus:border-[#8D0B41] focus:ring-1 focus:ring-[#8D0B41] transition-all bg-[#FDFBF7]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#8D0B41] transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Confirm Password</label>
            <div className="relative">
              <input 
                type={showConfirmPassword ? "text" : "password"} 
                name="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
                placeholder="Re-enter password"
                className="w-full border border-gray-300 rounded px-4 py-3 pr-10 text-xs text-gray-800 focus:outline-none focus:border-[#8D0B41] focus:ring-1 focus:ring-[#8D0B41] transition-all bg-[#FDFBF7]"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#8D0B41] transition-colors cursor-pointer"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-[#8D0B41] text-white py-3.5 rounded font-bold uppercase tracking-widest text-xs hover:bg-[#6A102A] transition-colors shadow-md hover:shadow-lg disabled:bg-gray-400 mt-2 flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Resetting...
              </>
            ) : (
              "Save Password"
            )}
          </button>
        </form>
      )}
    </div>
  );
}

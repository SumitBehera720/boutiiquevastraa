import ResetPasswordForm from "@/components/account/ResetPasswordForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reset Password | Boutiique Vastraa",
  description: "Reset your Boutiique Vastraa account password.",
};

interface SearchParamsProps {
  searchParams: Promise<{ token?: string; email?: string }>;
}

export default async function ResetPasswordPage({ searchParams }: SearchParamsProps) {
  const resolvedSearchParams = await searchParams;
  const token = resolvedSearchParams.token || "";
  const email = resolvedSearchParams.email || "";

  return (
    <div className="min-h-screen w-full flex items-center justify-center py-16 px-4 relative overflow-hidden bg-radial-[at_center_center] from-[#A70E4E] via-[#8D0B41] to-[#2C0214]">
      {/* Dynamic light blur overlay to emulate vignette spotlight */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-[#8D0B41]/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-[#C9A84C]/5 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {token && email ? (
          <ResetPasswordForm email={email} token={token} />
        ) : (
          <div className="w-full max-w-[420px] bg-white rounded-2xl shadow-xl border border-gray-100 p-8 md:p-10 text-center animate-scaleUp">
            <h2 className="text-[#8D0B41] font-serif font-bold text-lg mb-4 uppercase tracking-wider">Invalid Reset Link</h2>
            <p className="text-xs text-neutral-500 leading-relaxed mb-6">
              This password reset link is invalid, incomplete, or expired. Please request a new link from the login page.
            </p>
            <a
              href="/account/login"
              className="w-full bg-[#8D0B41] text-white py-3.5 rounded font-bold uppercase tracking-widest text-xs hover:bg-[#6A102A] transition-colors shadow-md hover:shadow-lg inline-block text-center decoration-none"
            >
              Go to Login Page
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

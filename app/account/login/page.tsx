"use client";

import { useState } from "react";
import LoginForm from "@/components/account/LoginForm";
import RegisterForm from "@/components/account/RegisterForm";
import ForgotPasswordForm from "@/components/account/ForgotPasswordForm";

export default function LoginPage() {
  const [view, setView] = useState<"login" | "register" | "forgot">("login");

  return (
    <div className="min-h-screen w-full flex items-center justify-center py-16 px-4 relative overflow-hidden bg-radial-[at_center_center] from-[#A70E4E] via-[#8D0B41] to-[#2C0214]">
      {/* Dynamic light blur overlay to emulate vignette spotlight */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-[#8D0B41]/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-[#C9A84C]/5 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {view === "login" ? (
          <LoginForm 
            onToggleView={() => setView("register")} 
            onForgotPassword={() => setView("forgot")}
          />
        ) : view === "register" ? (
          <RegisterForm onToggleView={() => setView("login")} />
        ) : (
          <ForgotPasswordForm onToggleView={() => setView("login")} />
        )}
      </div>
    </div>
  );
}

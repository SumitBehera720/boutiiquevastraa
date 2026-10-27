"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RotateCw, CheckCircle2 } from "lucide-react";

interface AutoRefreshOrderProps {
  targetId?: string;
}

export default function AutoRefreshOrder({ targetId }: AutoRefreshOrderProps) {
  const router = useRouter();
  const [checking, setChecking] = useState(false);
  const [attempts, setAttempts] = useState(0);

  const checkOrder = async () => {
    if (!targetId || targetId.trim() === "" || targetId === "CONFIRMED") return;
    setChecking(true);
    try {
      const res = await fetch(`/api/orders/lookup?id=${encodeURIComponent(targetId)}`, {
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.success) {
          router.refresh();
          return;
        }
      }
    } catch {
      // Ignore network hiccup during polling
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    if (!targetId || targetId.trim() === "" || targetId === "CONFIRMED") return;

    let timer: NodeJS.Timeout | null = null;
    if (attempts < 4) {
      timer = setTimeout(async () => {
        setAttempts((prev) => prev + 1);
        await checkOrder();
      }, 2500);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [attempts, targetId]);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6 pt-6 border-t border-amber-100 text-xs text-neutral-600">
      <div className="flex items-center gap-2">
        <span className="inline-block w-2 h-2 rounded-full bg-amber-500 animate-ping" />
        <span>Order received & being generated in dispatch queue</span>
      </div>
      <button
        type="button"
        onClick={() => {
          setAttempts(0);
          checkOrder();
        }}
        disabled={checking}
        className="inline-flex items-center gap-1.5 font-semibold text-maroonClr hover:text-[#6A102A] transition-colors disabled:opacity-50 underline underline-offset-4"
      >
        <RotateCw className={`w-3.5 h-3.5 ${checking ? "animate-spin" : ""}`} />
        {checking ? "Checking..." : "Refresh Receipt"}
      </button>
    </div>
  );
}

import { Gift, Star, Sparkles } from "lucide-react";

interface MarqueeBannerProps {
  settings?: {
    marquee?: { text: string; icon?: string }[];
  };
}

export default function MarqueeBanner({ settings }: MarqueeBannerProps) {
  const marqueeItems = settings?.marquee && settings.marquee.length > 0 
    ? settings.marquee 
    : [
        { text: "UP TO 49% PRIVILEGE SAVINGS", icon: "gift" },
        { text: "COMPLIMENTARY GIFT ON PURCHASE OF ANY 2 STYLES ₹1,500+", icon: "gift" },
        { text: "LOVED BY 10,000+ ESTEEMED CUSTOMERS", icon: "star" }
      ];

  const renderIcon = (iconName?: string) => {
    if (iconName === "star") return <Star className="w-4 h-4 text-goldClr" fill="currentColor" />;
    if (iconName === "sparkles") return <Sparkles className="w-4 h-4 text-goldClr" />;
    return <Gift className="w-4 h-4 text-goldClr" />;
  };

  return (
    <div className="bg-maroonClr text-white overflow-hidden py-2 border-t border-b border-goldClr/20">
      <div className="whitespace-nowrap flex items-center animate-[marquee_20s_linear_infinite] hover:[animation-play-state:paused]">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center space-x-4 mx-4 shrink-0 font-medium text-xs sm:text-sm tracking-wide">
            {marqueeItems.map((item, idx) => (
              <span key={idx} className="flex items-center gap-2">
                {renderIcon(item.icon)}
                <span>{item.text}</span>
                <span className="opacity-55 ml-4">|</span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

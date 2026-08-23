import Image from "next/image";

export default function BrandIntroduction() {
  return (
    <section className="bg-creamClr border-b border-goldClr/20 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
        {/* Left Side: Branding & Logo */}
        <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 overflow-hidden bg-white rounded-full shadow-md border border-goldClr/30 flex items-center justify-center p-2">
              <Image
                src="/images/logo.png"
                alt="Boutiique Vastraa Logo"
                fill
                priority
                className="object-contain p-2"
              />
            </div>
            <div>
              <h2 className="font-kalnia text-maroonClr text-xl sm:text-2xl font-bold tracking-wide">
                Boutiique Vastraa
              </h2>
              <p className="text-goldClr font-medium text-xs sm:text-sm uppercase tracking-widest">
                Heritage Fashion Boutique
              </p>
            </div>
          </div>
        </div>

        {/* Right Side: Welcome Message & OAuth Verification Details */}
        <div className="flex-1 max-w-2xl bg-white p-6 rounded-xl shadow-sm border border-goldClr/10 space-y-4">
          <div className="space-y-2">
            <h1 className="font-kalnia text-maroonClr text-2xl sm:text-3xl font-medium">
              Welcome to Boutiique Vastraa
            </h1>
            <p className="text-gray-750 text-sm sm:text-base leading-relaxed">
              Boutiique Vastraa is an online fashion boutique platform allowing customers to browse custom apparel, curate personalized wishlists, track orders, and manage account details.
            </p>
          </div>
          
          <div className="pt-3 border-t border-gray-150">
            <h3 className="text-xs font-bold uppercase tracking-wider text-goldClr mb-1">
              Google Account Authentication
            </h3>
            <p className="text-gray-650 text-xs sm:text-sm leading-relaxed">
              Sign in with Google to securely access your personalized account, save items to your wishlist, manage active orders, and track delivery status.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

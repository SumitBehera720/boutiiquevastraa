"use client";

import { useState } from "react";
import { saveCouponAction, toggleCouponAction, deleteCouponAction } from "@/app/actions/adminCoupons";
import { Plus, Edit2, Trash2, CheckCircle2, XCircle, Sparkles, PlusCircle, AlertCircle, Percent, DollarSign, Calendar } from "lucide-react";

interface CouponsListClientProps {
  initialCoupons: any[];
}

export default function CouponsListClient({ initialCoupons }: CouponsListClientProps) {
  const [coupons, setCoupons] = useState(initialCoupons);
  const [editingCoupon, setEditingCoupon] = useState<any | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Form Fields
  const [code, setCode] = useState("");
  const [type, setType] = useState<"PERCENTAGE" | "FIXED_AMOUNT">("PERCENTAGE");
  const [value, setValue] = useState("");
  const [minPurchase, setMinPurchase] = useState("");
  const [active, setActive] = useState(true);

  const openCreateDrawer = () => {
    setEditingCoupon(null);
    setCode("");
    setType("PERCENTAGE");
    setValue("");
    setMinPurchase("0");
    setActive(true);
    setError("");
    setIsDrawerOpen(true);
  };

  const openEditDrawer = (coupon: any) => {
    setEditingCoupon(coupon);
    setCode(coupon?.code || "");
    setType(coupon?.type || "PERCENTAGE");
    setValue((coupon?.value ?? 0).toString());
    setMinPurchase((coupon?.minPurchaseAmount ?? coupon?.minPurchase ?? 0).toString());
    setActive(!!coupon?.active);
    setError("");
    setIsDrawerOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!code || !value) {
      setError("Please fill in code and value.");
      setLoading(false);
      return;
    }

    try {
      const res = await saveCouponAction({
        id: editingCoupon?.id,
        code,
        type,
        value: parseFloat(value),
        active,
        minPurchaseAmount: parseFloat(minPurchase || "0"),
        minPurchase: parseFloat(minPurchase || "0"),
      });

      if (res.success) {
        // Refresh local state list
        window.location.reload();
      } else {
        setError(res.error || "Failed to save coupon.");
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred.");
      setLoading(false);
    }
  };

  const handleToggle = async (id: string) => {
    try {
      const res = await toggleCouponAction(id);
      if (res.success) {
        setCoupons(coupons.map(c => c.id === id ? { ...c, active: res.active } : c));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this coupon?")) return;
    try {
      const res = await deleteCouponAction(id);
      if (res.success) {
        setCoupons(coupons.filter(c => c.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const safeCoupons = Array.isArray(coupons) ? coupons : [];

  return (
    <div className="space-y-6">
      
      {/* Header action */}
      <div className="flex justify-between items-center pb-4 border-b border-neutral-850">
        <div>
          <h1 className="text-2xl font-serif font-bold text-white flex items-center gap-2">
            Promo Codes Manager <Sparkles className="w-4 h-4 text-[#C9A84C]" />
          </h1>
          <p className="text-xs text-neutral-400">Total active promotional campaigns: {safeCoupons.length}</p>
        </div>
        <button
          onClick={openCreateDrawer}
          className="bg-maroonClr hover:bg-[#A30C4D] text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-2 shadow-lg shadow-maroonClr/20"
        >
          <Plus className="w-4.5 h-4.5" /> Create Coupon
        </button>
      </div>

      {/* Coupons grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {safeCoupons.map((coupon) => (
          <div 
            key={coupon.id}
            className="bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-all rounded-xl p-5 shadow-sm space-y-4"
          >
            {/* Coupon title / badge */}
            <div className="flex justify-between items-center">
              <span className="font-mono text-base font-bold text-white tracking-widest bg-neutral-950 border border-neutral-800 px-3 py-1 rounded-lg">
                {coupon.code}
              </span>
              <button
                onClick={() => handleToggle(coupon.id)}
                className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${
                  coupon.active 
                    ? "bg-green-500/10 text-green-400 border-green-500/20" 
                    : "bg-red-500/10 text-red-400 border-red-500/20"
                }`}
              >
                {coupon.active ? "ACTIVE" : "INACTIVE"}
              </button>
            </div>

            {/* Values */}
            <div className="space-y-1">
              <p className="text-2xl font-bold text-white font-mono flex items-baseline gap-1">
                {coupon.type === "PERCENTAGE" ? (
                  <>
                    {coupon.value}<span className="text-xs text-neutral-400">% OFF</span>
                  </>
                ) : (
                  <>
                    ₹{coupon.value}<span className="text-xs text-neutral-400">FLAT OFF</span>
                  </>
                )}
              </p>
              <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">
                Min Purchase: ₹{(coupon.minPurchaseAmount ?? coupon.minPurchase ?? 0).toLocaleString("en-IN")}
              </p>
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-neutral-850 flex justify-between items-center">
              <button
                onClick={() => openEditDrawer(coupon)}
                className="text-xs text-neutral-400 hover:text-white transition-colors flex items-center gap-1 font-bold uppercase tracking-wider text-[10px]"
              >
                <Edit2 className="w-3.5 h-3.5" /> Edit
              </button>
              
              <button
                onClick={() => handleDelete(coupon.id)}
                className="text-xs text-neutral-500 hover:text-red-400 transition-colors flex items-center gap-1 font-bold uppercase tracking-wider text-[10px]"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create / Edit Drawer Overlay */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end animate-fadeIn">
          <div className="w-full max-w-md bg-neutral-900 border-l border-neutral-800 h-full p-8 overflow-y-auto space-y-6 flex flex-col justify-between">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-serif font-bold text-white uppercase tracking-wider">
                  {editingCoupon ? "Edit Promo Code" : "Create Promo Code"}
                </h3>
                <p className="text-xs text-neutral-500">Configure discounts, pricing triggers, and coupon codes.</p>
              </div>

              {error && (
                <div className="p-3 bg-red-950/40 border border-red-900/50 text-red-400 text-xs rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Coupon Code</label>
                  <input
                    type="text"
                    required
                    placeholder="E.G. FESTIVE20"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-maroonClr uppercase font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Coupon Type</label>
                    <select
                      value={type}
                      onChange={(e: any) => setType(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2.5 text-xs text-white focus:outline-none focus:border-maroonClr"
                    >
                      <option value="PERCENTAGE">PERCENTAGE (%)</option>
                      <option value="FIXED_AMOUNT">FLAT AMOUNT (₹)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Value</label>
                    <input
                      type="number"
                      required
                      placeholder={type === "PERCENTAGE" ? "20" : "500"}
                      value={value}
                      onChange={(e) => setValue(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-maroonClr font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Minimum Purchase Requirement (₹)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={minPurchase}
                    onChange={(e) => setMinPurchase(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-maroonClr font-mono"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="coupon_active"
                    checked={active}
                    onChange={(e) => setActive(e.target.checked)}
                    className="w-4 h-4 text-maroonClr bg-neutral-950 border-neutral-850 rounded focus:ring-0 focus:ring-offset-0 accent-maroonClr"
                  />
                  <label htmlFor="coupon_active" className="text-xs text-neutral-300 font-semibold cursor-pointer">
                    Enable coupon campaign instantly
                  </label>
                </div>
              </form>
            </div>

            {/* Bottom Actions */}
            <div className="pt-6 border-t border-neutral-850 flex gap-4">
              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className="flex-1 bg-neutral-950 border border-neutral-800 hover:bg-neutral-850 text-neutral-300 px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex-1 bg-maroonClr hover:bg-[#A30C4D] text-white px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
              >
                {loading ? "Saving..." : "Save Coupon"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

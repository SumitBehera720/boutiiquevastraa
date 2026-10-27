"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Shield,
  Truck,
  AlertCircle,
  Sparkles,
  Tag,
  X,
  Smartphone,
  AlertTriangle,
  Phone,
  ShieldCheck,
  CreditCard,
  CheckCircle2,
  Zap,
  ShoppingBag,
  ChevronDown,
} from "lucide-react";
import { getCartForCheckout, submitOrder, createRazorpayOrder, verifyRazorpayPayment } from "@/lib/api/checkout-client";
import { applyPromoCode } from "@/lib/api/promo-client";
import { useCartStore } from "@/store/cartStore";
import { launchShiprocketCheckout } from "@/lib/shiprocket-checkout-client";

interface CheckoutFormProps {
  cartId?: string;
  initialCustomer?: any;
}

export default function CheckoutForm({ cartId: initialCartId, initialCustomer }: CheckoutFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { cartId: storeCartId, lines: storeLines, subtotal: storeSubtotal, setCart, setTransactionCancelled } = useCartStore();

  const [cart, setCartData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const urlError = searchParams?.get("error") || "";
  const urlStatus = searchParams?.get("status") || "";
  const urlCancelled = searchParams?.get("cancelled") || "";

  const isCancelled = Boolean(
    (urlError &&
      (urlError.toLowerCase().includes("cancel") ||
        urlError.toLowerCase().includes("completed") ||
        urlError.toLowerCase().includes("failed") ||
        urlError.toLowerCase().includes("not completed"))) ||
      urlStatus === "CANCELLED" ||
      urlCancelled === "true"
  );

  useEffect(() => {
    if (isCancelled) {
      setTransactionCancelled(true);
    } else {
      setTransactionCancelled(false);
    }
  }, [isCancelled, setTransactionCancelled]);

  // Form State
  const [firstName, setFirstName] = useState(initialCustomer?.firstName || "");
  const [lastName, setLastName] = useState(initialCustomer?.lastName || "");
  const [email, setEmail] = useState(initialCustomer?.email || "");
  const [phone, setPhone] = useState(initialCustomer?.phone || "");
  const [address1, setAddress1] = useState(initialCustomer?.defaultAddress?.address1 || "");
  const [address2, setAddress2] = useState(initialCustomer?.defaultAddress?.address2 || "");
  const [city, setCity] = useState(initialCustomer?.defaultAddress?.city || "");
  const [province, setProvince] = useState(initialCustomer?.defaultAddress?.province || "");
  const [zip, setZip] = useState(initialCustomer?.defaultAddress?.zip || "");
  const [country, setCountry] = useState(initialCustomer?.defaultAddress?.country || "India");
  const [paymentMethod, setPaymentMethod] = useState<"COD" | "RAZORPAY">("RAZORPAY");
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);

  // Promo Code States
  const [promoCode, setPromoCode] = useState("");
  const [promoError, setPromoError] = useState("");
  const [promoSuccess, setPromoSuccess] = useState("");
  const [discount, setDiscount] = useState(0);
  const [appliedCode, setAppliedCode] = useState("");
  const [checkingPromo, setCheckingPromo] = useState(false);
  const [prepaidDiscountPercent, setPrepaidDiscountPercent] = useState(8);
  const [eddDate, setEddDate] = useState<string | null>(null);
  const [loadingEdd, setLoadingEdd] = useState(false);

  useEffect(() => {
    // Dynamic discount incentive between 5% and 8%
    const pct = Math.floor(Math.random() * 4) + 5; // 5, 6, 7, 8
    setPrepaidDiscountPercent(pct);
  }, []);

  const [launchingFastrr, setLaunchingFastrr] = useState(false);

  const handleLaunchFastrr = async (e?: React.MouseEvent | any) => {
    const rawLines = cart?.lines?.length > 0 ? cart.lines : storeLines;
    if (!rawLines || rawLines.length === 0) return;
    setLaunchingFastrr(true);

    try {
      const items = rawLines.map((l: any) => ({
        merchandiseId: l.merchandiseId || l.variantId || l.id,
        variantId: l.variantId || l.merchandiseId || l.id,
        quantity: Math.max(1, Number(l.quantity) || 1),
      }));

      const res = await launchShiprocketCheckout({
        event: e?.nativeEvent || e || null,
        items,
        fallbackUrl: `/checkout?fastrr_dismissed=1`,
      });

      if (!res.success) {
        console.warn("[Shiprocket Fastrr fallback to manual form]:", res.error);
      }
    } catch (err: any) {
      console.error("[Fastrr checkout launch error]:", err);
    } finally {
      setLaunchingFastrr(false);
    }
  };

  // PIN Lookup States
  const [pinLoading, setPinLoading] = useState(false);
  const [pinError, setPinError] = useState("");

  useEffect(() => {
    const cleanZip = zip.trim();
    if (cleanZip.length === 6 && /^\d{6}$/.test(cleanZip)) {
      let isMounted = true;
      const lookupPincode = async () => {
        setPinLoading(true);
        setPinError("");
        try {
          const res = await fetch(`/api/pincode/${cleanZip}`);
          const data = await res.json();
          if (isMounted) {
            if (res.ok && data.success) {
              if (data.city) setCity(data.city);
              if (data.state) setProvince(data.state);
              setPinError("");
            } else {
              setPinError(data.message || "Invalid PIN Code");
            }
          }
        } catch {
          if (isMounted) {
            setPinError(""); // Silent fallback: user can type manually
          }
        } finally {
          if (isMounted) setPinLoading(false);
        }
      };

      const fetchEdd = async () => {
        setLoadingEdd(true);
        try {
          const res = await fetch(`/api/shiprocket/edd?pincode=${cleanZip}&isCod=${paymentMethod === "COD"}`);
          const data = await res.json();
          if (data.success && data.edd) {
            setEddDate(data.edd);
          } else {
            setEddDate(null);
          }
        } catch {
          setEddDate(null);
        } finally {
          setLoadingEdd(false);
        }
      };

      lookupPincode();
      fetchEdd();
      return () => {
        isMounted = false;
      };
    } else {
      setEddDate(null);
      setPinError("");
      setPinLoading(false);
    }
  }, [zip, paymentMethod]);

  const getAddressesList = () => {
    const defaultAddr = initialCustomer?.defaultAddress;
    if (!defaultAddr) return [];
    if (defaultAddr.addresses && Array.isArray(defaultAddr.addresses)) {
      return defaultAddr.addresses;
    }
    if (defaultAddr.address1) {
      return [
        {
          id: "addr_legacy",
          name: `${initialCustomer.firstName || ""} ${initialCustomer.lastName || ""}`.trim() || "Saved Address",
          phone: defaultAddr.phone || initialCustomer.phone || "",
          alternatePhone: "",
          address1: defaultAddr.address1,
          address2: defaultAddr.address2 || "",
          city: defaultAddr.city || "",
          province: defaultAddr.province || "",
          zip: defaultAddr.zip || "",
          country: defaultAddr.country || "India",
          isDefault: true,
        },
      ];
    }
    return [];
  };

  const addressesList = getAddressesList();

  useEffect(() => {
    const list = getAddressesList();
    if (list.length > 0) {
      const defaultAddr = list.find((a: any) => a.isDefault) || list[0];
      if (defaultAddr) {
        setSelectedAddressId(defaultAddr.id);
        const nameParts = defaultAddr.name ? defaultAddr.name.trim().split(" ") : ["", ""];
        setFirstName(nameParts[0] || "");
        setLastName(nameParts.slice(1).join(" ") || "");
        setPhone(defaultAddr.phone || "");
        setAddress1(defaultAddr.address1 || "");
        setAddress2(defaultAddr.address2 || "");
        setCity(defaultAddr.city || "");
        setProvince(defaultAddr.province || "");
        setZip(defaultAddr.zip || "");
        setCountry(defaultAddr.country || "India");
      }
    }
  }, [initialCustomer]);

  const handleSelectAddress = (addr: any) => {
    setSelectedAddressId(addr.id);
    const nameParts = addr.name ? addr.name.trim().split(" ") : ["", ""];
    setFirstName(nameParts[0] || "");
    setLastName(nameParts.slice(1).join(" ") || "");
    setPhone(addr.phone || "");
    setAddress1(addr.address1 || "");
    setAddress2(addr.address2 || "");
    setCity(addr.city || "");
    setProvince(addr.province || "");
    setZip(addr.zip || "");
    setCountry(addr.country || "India");
  };

  const handleUseNewAddress = () => {
    setSelectedAddressId("new");
    setFirstName("");
    setLastName("");
    setPhone("");
    setAddress1("");
    setAddress2("");
    setCity("");
    setProvince("");
    setZip("");
    setCountry("India");
  };

  const [showManualForm, setShowManualForm] = useState(false);
  const fetchedCartIdRef = useRef<string | null>(null);
  const autoLaunchedRef = useRef(false);
  const isFastrrDismissed = searchParams?.get("fastrr_dismissed") === "1";

  // Robust Cart Loader with Single-Fetch Guard (Eliminates infinite GET /api/cart loop)
  useEffect(() => {
    let isMounted = true;
    const activeCartId = initialCartId || storeCartId;

    // Use current in-memory store lines immediately
    if (storeLines && storeLines.length > 0) {
      setCartData({
        id: activeCartId || "client_cart",
        lines: storeLines,
        subtotal: storeSubtotal || "0.00",
        totalQuantity: storeLines.reduce((acc: number, l: any) => acc + (Number(l.quantity) || 1), 0),
      });
      setLoading(false);
    }

    if (!activeCartId || fetchedCartIdRef.current === activeCartId) {
      if (isMounted) setLoading(false);
      return;
    }
    fetchedCartIdRef.current = activeCartId;

    async function loadCart() {
      try {
        const res = await getCartForCheckout(activeCartId!);
        if (isMounted && res.success && res.cart && res.cart.lines && res.cart.lines.length > 0) {
          setCartData(res.cart);
        }
      } catch (err) {
        console.warn("[Checkout] Server cart fetch notice:", err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadCart();
    return () => {
      isMounted = false;
    };
  }, [initialCartId, storeCartId]);

  // Auto-launch Fastrr 1-Click Buy by default (one-time per checkout session)
  useEffect(() => {
    if (autoLaunchedRef.current || isFastrrDismissed) return;
    const activeItems = cart?.lines?.length > 0 ? cart.lines : storeLines;
    if (activeItems && activeItems.length > 0 && !loading) {
      autoLaunchedRef.current = true;
      handleLaunchFastrr();
    }
  }, [cart, storeLines, loading, isFastrrDismissed]);

  const handleApplyPromo = async () => {
    const currentSubtotal = cart?.subtotal || storeSubtotal || "0";
    if (!promoCode.trim() || parseFloat(currentSubtotal) <= 0) return;
    setCheckingPromo(true);
    setPromoError("");
    setPromoSuccess("");

    try {
      const res = await applyPromoCode(promoCode, parseFloat(currentSubtotal));
      if (res.success && res.discountAmount !== undefined) {
        setDiscount(res.discountAmount);
        setAppliedCode(res.code || promoCode.toUpperCase().trim());
        setPromoSuccess(`Promo applied! Saved ₹${res.discountAmount.toFixed(0)}`);
      } else {
        setPromoError(res.error || "Failed to apply code.");
      }
    } catch {
      setPromoError("Failed to apply promo code.");
    } finally {
      setCheckingPromo(false);
    }
  };

  const handleRemovePromo = () => {
    setDiscount(0);
    setAppliedCode("");
    setPromoCode("");
    setPromoSuccess("");
    setPromoError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const items = cart?.lines || storeLines || [];
    if (!items || items.length === 0) {
      setError("Your cart is empty. Please add items to your cart before proceeding.");
      return;
    }

    if (!firstName || !lastName || !email || !phone || !address1 || !city || !province || !zip || !country) {
      setError("Please fill in all shipping details.");
      return;
    }

    const cleanPhone = phone.replace(/[^0-9]/g, "").slice(-10);
    const indianPhoneRegex = /^[6-9]\d{9}$/;
    if (!indianPhoneRegex.test(cleanPhone)) {
      setError("Please enter a valid 10-digit Indian mobile number.");
      return;
    }

    setSubmitting(true);

    try {
      const orderPayloadLines = items.map((l: any) => ({
        id: l.id,
        merchandiseId: l.merchandiseId || l.variantId || l.id,
        variantId: l.variantId || l.merchandiseId || l.id,
        title: l.title,
        variantTitle: l.variantTitle || "Default",
        quantity: Math.max(1, Number(l.quantity) || 1),
        price: l.price || "0",
        image: l.image || null,
        isGift: !!l.isGift,
        handle: l.handle || "",
      }));

      const activeCartId = cart?.id || initialCartId || storeCartId || `cart_${Date.now()}`;

      // Submit internal order
      const res = await submitOrder({
        cartId: activeCartId,
        firstName,
        lastName,
        email,
        phone,
        address1,
        address2,
        city,
        province,
        zip,
        country,
        paymentMethod,
        promoCode: appliedCode || undefined,
        discount: discount + prepaidDiscountAmount,
        lines: orderPayloadLines,
        subtotal: cart?.subtotal || storeSubtotal || "0.00",
      });

      if (!res.success || !res.orderId) {
        setError(res.error || "Failed to create order. Please try again.");
        setSubmitting(false);
        return;
      }

      if (paymentMethod === "RAZORPAY") {
        // Create Razorpay order
        const rzpOrderRes = await createRazorpayOrder(res.orderId);
        if (!rzpOrderRes.success || !rzpOrderRes.razorpayOrderId) {
          setError(rzpOrderRes.error || "Failed to initiate online payment. Please try COD or retry.");
          setSubmitting(false);
          return;
        }

        // Dynamically load Razorpay SDK if not already in document
        if (!(window as any).Razorpay) {
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement("script");
            script.src = "https://checkout.razorpay.com/v1/checkout.js";
            script.onload = () => resolve();
            script.onerror = () => reject(new Error("Unable to load secure Razorpay SDK"));
            document.head.appendChild(script);
          });
        }

        const options = {
          key: rzpOrderRes.keyId,
          amount: rzpOrderRes.amount,
          currency: rzpOrderRes.currency || "INR",
          name: "Boutiique Vastraa",
          description: `Order #${res.orderNumber}`,
          order_id: rzpOrderRes.razorpayOrderId,
          prefill: {
            name: `${firstName} ${lastName}`.trim(),
            email,
            contact: phone,
          },
          theme: { color: "#7B1C35" },
          modal: {
            ondismiss: () => {
              setError("Payment was cancelled or closed. You can retry or choose Cash on Delivery.");
              setSubmitting(false);
            },
          },
          handler: async (response: any) => {
            try {
              const verifyRes = await verifyRazorpayPayment({
                orderId: res.orderId,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              });

              if (verifyRes.success) {
                setCart({ id: null, checkoutUrl: null, totalQuantity: 0, lines: [], subtotal: "0.00" });
                router.push(`/checkout/success?orderId=${verifyRes.orderId}&number=${verifyRes.orderNumber}`);
              } else {
                setError(verifyRes.error || "Payment verification failed. Please contact support.");
                setSubmitting(false);
              }
            } catch {
              setError("Payment verification encountered a network error. Please contact support.");
              setSubmitting(false);
            }
          },
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.on("payment.failed", (resp: any) => {
          setError(`Payment failed: ${resp?.error?.description || "Transaction declined"}`);
          setSubmitting(false);
        });
        rzp.open();
        return;
      }

      // COD: Order complete immediately
      setCart({
        id: null,
        checkoutUrl: null,
        totalQuantity: 0,
        lines: [],
        subtotal: "0.00",
      });
      router.push(`/checkout/success?orderId=${res.orderId}&number=${res.orderNumber}`);
    } catch (err: any) {
      console.error("[Checkout Submit Error]:", err);
      setError("An unexpected error occurred. Please try again or contact support.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] bg-[#FDFBF7]">
        <div className="w-12 h-12 border-4 border-[#7B1C35] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-gray-700 font-medium">Securing your checkout session...</p>
      </div>
    );
  }

  if (isCancelled) {
    return (
      <div className="container mx-auto px-4 py-16 text-center max-w-md my-12 rounded-2xl border border-gray-200 shadow-sm bg-white">
        <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4 border border-amber-200 shadow-sm">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-serif font-bold text-gray-900 mb-2">Transaction Was Cancelled</h2>
        <p className="text-gray-600 text-sm mb-6 max-w-xs mx-auto">
          {urlError || error || "Your previous payment attempt was cancelled. No money was deducted."}
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/products"
            className="w-full sm:w-auto bg-[#7B1C35] text-white px-6 py-3 rounded-lg font-bold text-xs uppercase tracking-wider hover:bg-[#6A102A] transition-colors shadow-sm text-center"
          >
            Keep Shopping
          </Link>
          <Link
            href="/"
            className="w-full sm:w-auto bg-white border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-bold text-xs uppercase tracking-wider hover:bg-gray-50 transition-colors text-center"
          >
            Home
          </Link>
        </div>
      </div>
    );
  }

  const items = cart?.lines || storeLines || [];
  const rawSubtotal = cart?.subtotal || storeSubtotal || "0.00";
  const numSubtotal = parseFloat(rawSubtotal);

  if (!items || items.length === 0) {
    return (
      <div className="min-h-[70vh] bg-[#FDFBF7] flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full text-center bg-white rounded-2xl border border-gray-100 shadow-sm p-8 md:p-10">
          <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4 border border-amber-200">
            <Sparkles className="w-8 h-8 text-[#C9A84C]" />
          </div>
          <h2 className="text-2xl font-serif font-bold text-gray-900 mb-2">Your Cart is Empty</h2>
          <p className="text-gray-500 text-sm mb-6">
            Add your favourite handcrafted sarees and ethnic wear to your cart before proceeding to checkout.
          </p>
          <Link
            href="/products"
            className="w-full inline-flex items-center justify-center gap-2 bg-[#7B1C35] hover:bg-[#6A102A] text-white py-3.5 px-6 rounded-lg font-bold text-xs uppercase tracking-widest transition-colors shadow-sm"
          >
            <ShoppingBag className="w-4 h-4" /> Explore Collections
          </Link>
        </div>
      </div>
    );
  }

  const isPrepaid = paymentMethod === "RAZORPAY";
  const prepaidDiscountAmount = isPrepaid
    ? parseFloat(((numSubtotal - discount) * (prepaidDiscountPercent / 100)).toFixed(2))
    : 0;
  const finalTotal = Math.max(0, numSubtotal - discount - prepaidDiscountAmount);

  return (
    <div className="min-h-screen bg-[#FDFBF7] pt-4 pb-36 sm:pb-16 px-4 md:px-6">
      <div className="container mx-auto max-w-6xl">
        {/* Navigation back */}
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-[#7B1C35] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to store
          </Link>
        </div>

        <div className="flex flex-col lg:flex-row gap-10 items-start">
          {/* Form Area */}
          <div className="flex-1 w-full bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
            <h1 className="text-2xl md:text-3xl font-serif font-bold text-[#7B1C35] mb-8 pb-4 border-b border-gray-100 flex items-center gap-2">
              Shipping & Payment
            </h1>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded flex items-center gap-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500" />
                <span>{error}</span>
              </div>
            )}

            {/* Express Shiprocket Fastrr 1-Click Checkout Hero Card (Default & Primary) */}
            <div className="mb-6 p-6 md:p-8 bg-gradient-to-br from-amber-50/80 via-[#7B1C35]/5 to-amber-50/40 border-2 border-[#7B1C35]/25 rounded-2xl shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 transform translate-x-4 -translate-y-4 w-32 h-32 bg-[#7B1C35]/5 rounded-full blur-2xl pointer-events-none" />

              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-flex items-center justify-center bg-[#7B1C35] text-white p-1.5 rounded-lg shadow-sm">
                    <Zap className="w-4 h-4 fill-amber-300 text-amber-300 animate-pulse" />
                  </span>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#7B1C35] bg-[#7B1C35]/10 px-2.5 py-1 rounded-full">
                    Recommended Fast Checkout
                  </span>
                </div>

                <h2 className="text-xl md:text-2xl font-serif font-bold text-gray-900 mt-2 mb-1">
                  ⚡ Fastrr 1-Click Buy
                </h2>
                <p className="text-xs md:text-sm text-gray-600 mb-6 max-w-lg">
                  Instant OTP verification, saved addresses & 1-Click checkout. Supports Cash on Delivery (COD), UPI (GPay/PhonePe), Credit/Debit Cards, and Netbanking.
                </p>

                {/* Primary Fastrr CTA */}
                <button
                  type="button"
                  disabled={launchingFastrr}
                  onClick={handleLaunchFastrr}
                  className="w-full bg-[#7B1C35] text-white hover:bg-[#6A102A] py-4 px-6 rounded-xl font-bold uppercase tracking-widest text-sm flex items-center justify-center gap-3 transition-all shadow-lg hover:shadow-xl active:scale-[0.99] disabled:opacity-60"
                >
                  {launchingFastrr ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Opening Fastrr 1-Click Buy...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-5 h-5 fill-amber-300 text-amber-300" />
                      <span>⚡ Complete Order with Fastrr 1-Click Buy</span>
                    </>
                  )}
                </button>

                {/* Trust Highlights */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 pt-5 border-t border-[#7B1C35]/15 text-xs text-gray-600 font-medium">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#7B1C35] shrink-0" />
                    <span>Instant OTP & Auto-fill</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-[#7B1C35] shrink-0" />
                    <span>Cash on Delivery Available</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#7B1C35] shrink-0" />
                    <span>100% Verified by Shiprocket</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Collapsible Manual Form Toggle */}
            <div className="pt-2 pb-2 text-center">
              <button
                type="button"
                onClick={() => setShowManualForm(!showManualForm)}
                className="inline-flex items-center gap-2 text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors py-2 px-4 rounded-lg border border-gray-200 hover:border-gray-300 bg-gray-50/60"
              >
                <span>{showManualForm ? "Hide manual address form" : "Prefer to enter shipping address manually?"}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showManualForm ? "rotate-180" : ""}`} />
              </button>
            </div>

            {showManualForm && (
              <form onSubmit={handleSubmit} className="space-y-6 pt-4 border-t border-gray-100">
              {/* Customer Contact */}
              <div>
                <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="email@example.com"
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#7B1C35] focus:ring-1 focus:ring-[#7B1C35]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">
                      Mobile Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. 9876543210"
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#7B1C35] focus:ring-1 focus:ring-[#7B1C35]"
                    />
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              <div className="border-t border-gray-100 pt-6">
                <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4">Delivery Address</h3>

                {/* Saved addresses selector for logged-in users */}
                {addressesList.length > 0 && (
                  <div className="mb-6 bg-gray-50/70 p-4 rounded-xl border border-gray-200">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">
                      Deliver to a Saved Address
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                      {addressesList.map((addr: any) => {
                        const isSelected = selectedAddressId === addr.id;
                        return (
                          <div
                            key={addr.id}
                            onClick={() => handleSelectAddress(addr)}
                            className={`p-3.5 rounded-lg border-2 cursor-pointer transition-all ${
                              isSelected
                                ? "border-[#7B1C35] bg-white shadow-sm"
                                : "border-gray-200 bg-white hover:border-gray-300"
                            }`}
                          >
                            <div className="flex justify-between items-center mb-1.5">
                              <span className="font-semibold text-xs text-gray-900">{addr.name}</span>
                              {addr.isDefault && (
                                <span className="bg-[#7B1C35]/15 text-[#7B1C35] text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
                                  Default
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-gray-600 leading-relaxed font-sans font-medium">
                              {addr.address1}, {addr.address2 && `${addr.address2}, `}
                              {addr.city}, {addr.province} - {addr.zip}
                            </p>
                            <p className="text-[11px] text-gray-500 mt-2 font-medium font-sans flex items-center gap-1">
                              <Phone className="w-3 h-3 text-gray-500 shrink-0" />
                              <span>{addr.phone}</span>
                            </p>
                          </div>
                        );
                      })}
                    </div>
                    <button
                      type="button"
                      onClick={handleUseNewAddress}
                      className={`text-xs font-bold uppercase tracking-wider transition-colors ${
                        selectedAddressId === "new" ? "text-[#7B1C35] underline" : "text-gray-500 hover:text-gray-950"
                      }`}
                    >
                      + Deliver to a new address
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="First Name"
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#7B1C35] focus:ring-1 focus:ring-[#7B1C35]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Last Name"
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#7B1C35] focus:ring-1 focus:ring-[#7B1C35]"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">
                      Flat / House / Building Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={address1}
                      onChange={(e) => setAddress1(e.target.value)}
                      placeholder="Flat, House no., Building, Company, Apartment"
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#7B1C35] focus:ring-1 focus:ring-[#7B1C35]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">
                      Area / Street / Landmark (Optional)
                    </label>
                    <input
                      type="text"
                      value={address2}
                      onChange={(e) => setAddress2(e.target.value)}
                      placeholder="Area, Street, Sector, Landmark"
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#7B1C35] focus:ring-1 focus:ring-[#7B1C35]"
                    />
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="col-span-2 md:col-span-1">
                      <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">
                        City <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="City"
                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#7B1C35] focus:ring-1 focus:ring-[#7B1C35]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">
                        State <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={province}
                        onChange={(e) => setProvince(e.target.value)}
                        placeholder="State"
                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#7B1C35] focus:ring-1 focus:ring-[#7B1C35]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5 flex items-center justify-between">
                        <span>
                          PIN Code <span className="text-red-500">*</span>
                        </span>
                        {pinLoading && (
                          <span className="text-[10px] text-[#7B1C35] font-normal flex items-center gap-1">
                            <span className="w-2.5 h-2.5 border border-[#7B1C35] border-t-transparent rounded-full animate-spin" />
                            Looking up...
                          </span>
                        )}
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={6}
                        value={zip}
                        onChange={(e) => setZip(e.target.value.replace(/\D/g, ""))}
                        placeholder="e.g. 751001"
                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#7B1C35] focus:ring-1 focus:ring-[#7B1C35] font-mono"
                      />
                      {pinError && (
                        <p className="mt-1 text-[11px] text-red-600 font-sans flex items-center gap-1 font-medium">
                          <AlertCircle className="w-3 h-3 text-red-500" />
                          {pinError}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Country</label>
                      <input
                        type="text"
                        disabled
                        value={country}
                        className="w-full border border-gray-200 bg-gray-50 rounded-lg px-4 py-2.5 text-sm text-gray-500 cursor-not-allowed"
                      />
                    </div>
                  </div>

                  {/* EDD Banner */}
                  {eddDate && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center gap-2">
                      <Truck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span>
                        Estimated Delivery by <strong className="font-semibold">{eddDate}</strong> via Express Courier.
                      </span>
                    </div>
                  )}
                  {loadingEdd && (
                    <div className="text-[11px] text-gray-400 italic">Calculating estimated delivery date...</div>
                  )}
                </div>
              </div>

              {/* Payment Method */}
              <div className="border-t border-gray-100 pt-6">
                <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4">Payment Method</h3>

                <div className="space-y-3">
                  {/* Online Payment (Razorpay) Option */}
                  <label
                    className={`border rounded-xl p-4 flex items-center justify-between cursor-pointer transition-all ${
                      paymentMethod === "RAZORPAY"
                        ? "border-[#7B1C35] bg-[#7B1C35]/5 shadow-sm"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="payment"
                        checked={paymentMethod === "RAZORPAY"}
                        onChange={() => setPaymentMethod("RAZORPAY")}
                        className="w-4 h-4 text-[#7B1C35] focus:ring-[#7B1C35] accent-[#7B1C35]"
                      />
                      <div>
                        <p className="font-semibold text-gray-800 text-sm flex items-center gap-2">
                          Online Payment (UPI, Cards, NetBanking, Wallets)
                          <span className="bg-green-100 text-green-800 text-[10px] px-2 py-0.5 rounded-full font-bold">
                            Extra {prepaidDiscountPercent}% Off
                          </span>
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Instant payment via UPI (GPay, PhonePe, Paytm), Cards, NetBanking & QR.
                        </p>
                      </div>
                    </div>
                    <Smartphone className="w-5 h-5 text-[#7B1C35]" />
                  </label>

                  {/* Cash on Delivery (COD) Option */}
                  <label
                    className={`border rounded-xl p-4 flex items-center justify-between cursor-pointer transition-all ${
                      paymentMethod === "COD"
                        ? "border-[#7B1C35] bg-[#7B1C35]/5 shadow-sm"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="payment"
                        checked={paymentMethod === "COD"}
                        onChange={() => setPaymentMethod("COD")}
                        className="w-4 h-4 text-[#7B1C35] focus:ring-[#7B1C35] accent-[#7B1C35]"
                      />
                      <div>
                        <p className="font-semibold text-gray-800 text-sm">Cash on Delivery (COD)</p>
                        <p className="text-xs text-gray-500">Pay cash upon delivery directly at your doorstep.</p>
                      </div>
                    </div>
                    <Truck className="w-5 h-5 text-[#7B1C35]" />
                  </label>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#7B1C35] text-white py-4 rounded-xl font-bold uppercase tracking-widest text-sm hover:bg-[#6A102A] transition-colors flex items-center justify-center gap-2 shadow-md hover:shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>{paymentMethod === "RAZORPAY" ? "Opening Payment..." : "Placing Order..."}</span>
                  </>
                ) : (
                  <>
                    <span>
                      {paymentMethod === "RAZORPAY"
                        ? `Pay Online ₹${finalTotal.toFixed(0)}`
                        : `Place Order (COD) ₹${finalTotal.toFixed(0)}`}
                    </span>
                  </>
                )}
              </button>
            </form>
            )}
          </div>

          {/* Sidebar Order Summary */}
          <div className="w-full lg:w-[380px] bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-24">
            <h2 className="text-xl font-serif font-bold text-gray-800 mb-6 pb-2 border-b border-gray-100">
              Order Summary
            </h2>

            {/* Product list */}
            <div className="space-y-4 max-h-[360px] overflow-y-auto pr-2 custom-scrollbar mb-6">
              {items.map((line: any) => {
                const img = line.image || line.images?.[0]?.url || line.images?.[0] || null;
                const price = parseFloat(line.price || line.unitPrice || 0);

                return (
                  <div key={line.id} className="flex gap-4 items-center">
                    <div className="w-16 h-20 bg-gray-50 relative rounded overflow-hidden border border-gray-100 flex-shrink-0">
                      {img ? (
                        <Image src={img} alt={line.title || "Product"} fill className="object-cover" sizes="64px" />
                      ) : (
                        <div className="absolute inset-0 bg-[#7B1C35]/5 flex items-center justify-center text-[#7B1C35]/30 font-bold text-xs">
                          Saree
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-800 text-sm truncate hover:text-[#7B1C35] transition-colors">
                        {line.title}
                      </h4>
                      <p className="text-xs text-gray-500 font-medium">
                        {line.variantTitle && line.variantTitle !== "Default Title" ? `Variant: ${line.variantTitle}` : "Authentic Handloom"}
                      </p>
                      <p className="text-xs text-gray-400">Qty: {line.quantity}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="font-bold text-gray-800 text-sm">
                        {line.isGift ? (
                          <span className="text-green-600 font-bold bg-green-50 px-1.5 py-0.5 rounded text-[10px] border border-green-100">
                            FREE
                          </span>
                        ) : (
                          `₹${(price * line.quantity).toFixed(0)}`
                        )}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Promo Code Input */}
            <div className="border-t border-gray-100 pt-4 pb-2">
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Have a Promo Code?</label>
              {appliedCode ? (
                <div className="flex items-center justify-between bg-green-50 border border-green-200 text-green-800 rounded-lg px-3 py-2 text-xs font-semibold">
                  <span className="flex items-center gap-1.5 uppercase">
                    <Tag className="w-3.5 h-3.5 text-green-600" /> {appliedCode} (Saved ₹{discount.toFixed(0)})
                  </span>
                  <button
                    type="button"
                    onClick={handleRemovePromo}
                    className="text-green-600 hover:text-green-800 p-0.5 rounded transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter Code (e.g. VASTRAA10)"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-800 uppercase focus:outline-none focus:border-[#7B1C35]"
                  />
                  <button
                    type="button"
                    onClick={handleApplyPromo}
                    disabled={checkingPromo || !promoCode}
                    className="bg-[#7B1C35] text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-[#6A102A] transition-colors disabled:opacity-55"
                  >
                    {checkingPromo ? "..." : "Apply"}
                  </button>
                </div>
              )}
              {promoError && <p className="text-[10px] text-red-600 font-semibold mt-1.5">{promoError}</p>}
              {promoSuccess && <p className="text-[10px] text-green-600 font-semibold mt-1.5">{promoSuccess}</p>}
            </div>

            {/* Calculations */}
            <div className="border-t border-gray-100 pt-4 space-y-3">
              <div className="flex justify-between text-sm text-gray-600 font-medium">
                <span>Subtotal ({items.reduce((acc: number, l: any) => acc + (Number(l.quantity) || 1), 0)} items)</span>
                <span>₹{numSubtotal.toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-sm text-green-600 font-semibold">
                  <span className="flex items-center gap-1">Discount ({appliedCode})</span>
                  <span>-₹{discount.toFixed(2)}</span>
                </div>
              )}
              {isPrepaid && prepaidDiscountAmount > 0 && (
                <div className="flex justify-between text-sm text-green-600 font-semibold animate-fadeIn">
                  <span className="flex items-center gap-1">Prepaid Discount ({prepaidDiscountPercent}%)</span>
                  <span>-₹{prepaidDiscountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm text-gray-600 font-medium">
                <span>Shipping</span>
                <span className="text-green-600 font-semibold uppercase tracking-wider text-xs">Free</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600 font-medium">
                <span>Taxes</span>
                <span className="text-xs text-gray-400">Included</span>
              </div>
              <div className="border-t border-gray-100 pt-3 flex justify-between items-center text-gray-800">
                <span className="font-bold uppercase tracking-wider text-xs">Total Amount</span>
                <span className="font-bold text-xl text-[#7B1C35]">₹{finalTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Trust Badges */}
            <div className="mt-8 border-t border-gray-100 pt-4 space-y-3">
              <div className="flex items-center gap-2.5 text-xs text-gray-500 font-medium">
                <ShieldCheck className="w-4 h-4 text-[#C9A84C] flex-shrink-0" />
                <span>100% Authentic Handloom Silk</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-gray-500 font-medium">
                <Truck className="w-4 h-4 text-[#C9A84C] flex-shrink-0" />
                <span>Safe & Inspected Doorstep Delivery</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-gray-500 font-medium">
                <CreditCard className="w-4 h-4 text-[#C9A84C] flex-shrink-0" />
                <span>Encrypted 256-Bit SSL Payments</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Bar for Mobile Checkout Button */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] bg-white/95 backdrop-blur-md border-t border-gray-200 z-[9999] shadow-[0_-6px_25px_rgba(0,0,0,0.18)]">
        {!showManualForm ? (
          <button
            type="button"
            onClick={handleLaunchFastrr}
            disabled={launchingFastrr}
            className="w-full bg-[#7B1C35] text-white py-4 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-[#6A102A] transition-colors flex items-center justify-center gap-2 shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {launchingFastrr ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Opening Fastrr...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 fill-amber-300 text-amber-300" />
                <span>⚡ Fastrr 1-Click Buy - ₹{finalTotal.toFixed(0)}</span>
              </>
            )}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              const form = document.querySelector("form");
              if (form) form.requestSubmit();
            }}
            disabled={submitting}
            className="w-full bg-[#7B1C35] text-white py-4 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-[#6A102A] transition-colors flex items-center justify-center gap-2 shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>{paymentMethod === "RAZORPAY" ? "Opening Payment..." : "Placing Order..."}</span>
              </>
            ) : (
              <span>
                {paymentMethod === "RAZORPAY"
                  ? `Pay Online ₹${finalTotal.toFixed(0)}`
                  : `Place Order ₹${finalTotal.toFixed(0)}`}
              </span>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

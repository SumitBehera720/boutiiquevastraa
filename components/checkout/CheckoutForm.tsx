"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { getCartForCheckout, submitOrder, createRazorpayOrder, verifyRazorpayPayment } from "@/lib/api/checkout-client";
import { applyPromoCode } from "@/lib/api/promo-client";
import { useCartStore } from "@/store/cartStore";
import { ArrowLeft, Shield, Truck, AlertCircle, Sparkles, Tag, X, Smartphone, AlertTriangle, Phone } from "lucide-react";
import Link from "next/link";
import { getTokenFromCookie } from "@/lib/api/auth-client";

interface CheckoutFormProps {
  cartId: string;
  initialCustomer: any;
}

export default function CheckoutForm({ cartId, initialCustomer }: CheckoutFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setCart, lastTransactionCancelled, setTransactionCancelled } = useCartStore();
  const [cart, setCartData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const urlError = searchParams?.get("error") || "";
  const urlStatus = searchParams?.get("status") || "";
  const urlCancelled = searchParams?.get("cancelled") || "";

  const isCancelled = Boolean(
    Boolean(urlError && (urlError.toLowerCase().includes("cancel") || urlError.toLowerCase().includes("completed") || urlError.toLowerCase().includes("failed") || urlError.toLowerCase().includes("not completed"))) ||
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
    // Generate random percentage between 5% and 10%
    const pct = Math.floor(Math.random() * 6) + 5; // 5, 6, 7, 8, 9, 10
    setPrepaidDiscountPercent(pct);
  }, []);

  useEffect(() => {
    const cleanZip = zip.trim();
    if (cleanZip.length === 6 && /^\d{6}$/.test(cleanZip)) {
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
        } catch (err) {
          console.error("Failed to fetch EDD:", err);
          setEddDate(null);
        } finally {
          setLoadingEdd(false);
        }
      };
      fetchEdd();
    } else {
      setEddDate(null);
    }
  }, [zip, paymentMethod]);

  const getAddressesList = () => {
    const defaultAddr = initialCustomer?.defaultAddress;
    if (!defaultAddr) return [];
    if (defaultAddr.addresses && Array.isArray(defaultAddr.addresses)) {
      return defaultAddr.addresses;
    }
    if (defaultAddr.address1) {
      return [{
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
        isDefault: true
      }];
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

  useEffect(() => {
    async function loadCart() {
      if (!cartId) {
        setLoading(false);
        return;
      }
      const res = await getCartForCheckout(cartId);
      if (res.success && res.cart) {
        setCartData(res.cart);
      } else {
        setError(res.error || "Failed to load your cart.");
      }
      setLoading(false);
    }
    loadCart();
  }, [cartId]);

  const handleApplyPromo = async () => {
    if (!promoCode.trim() || !cart) return;
    setCheckingPromo(true);
    setPromoError("");
    setPromoSuccess("");

    try {
      const res = await applyPromoCode(promoCode, parseFloat(cart.subtotal));
      if (res.success && res.discountAmount !== undefined) {
        setDiscount(res.discountAmount);
        setAppliedCode(res.code || promoCode.toUpperCase().trim());
        setPromoSuccess(`Promo applied! Saved ₹${res.discountAmount.toFixed(0)}`);
      } else {
        setPromoError(res.error || "Failed to apply code.");
      }
    } catch (err) {
      console.error(err);
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
    if (!getTokenFromCookie()) {
      router.push("/account/login?redirect=" + encodeURIComponent("/checkout"));
      return;
    }
    setSubmitting(true);

    if (!firstName || !lastName || !email || !phone || !address1 || !city || !province || !zip || !country) {
      setError("Please fill in all shipping details.");
      setSubmitting(false);
      return;
    }

    const cleanPhone = phone.replace(/[^0-9]/g, "").slice(-10);
    const indianPhoneRegex = /^[6-9]\d{9}$/;
    if (!indianPhoneRegex.test(cleanPhone)) {
      setError("Please enter a valid 10-digit Indian phone number.");
      setSubmitting(false);
      return;
    }

    try {
      // Step 1: Create the order (PENDING for PhonePe, immediate for COD)
      const res = await submitOrder({
        cartId,
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
        // Pass cart line items as fallback in case the DB cart record is stale
        lines: cart?.lines || [],
        subtotal: cart?.subtotal || "0.00",
      });

      if (!res.success || !res.orderId) {
        setError(res.error || "Failed to create order. Please try again.");
        setSubmitting(false);
        return;
      }

      if (paymentMethod === "RAZORPAY") {
        // Step 2: Create a Razorpay order and open the popup SDK
        const rzpOrderRes = await createRazorpayOrder(res.orderId);
        if (!rzpOrderRes.success || !rzpOrderRes.razorpayOrderId) {
          setError(rzpOrderRes.error || "Failed to initiate payment. Please try again.");
          setSubmitting(false);
          return;
        }

        // Load Razorpay script dynamically if not already loaded
        if (!(window as any).Razorpay) {
          await new Promise<void>((resolve, reject) => {
            const s = document.createElement("script");
            s.src = "https://checkout.razorpay.com/v1/checkout.js";
            s.onload = () => resolve();
            s.onerror = () => reject(new Error("Failed to load Razorpay SDK"));
            document.head.appendChild(s);
          });
        }

        const options = {
          key: rzpOrderRes.keyId,
          amount: rzpOrderRes.amount,
          currency: rzpOrderRes.currency || "INR",
          name: "Boutiique Vastraa",
          description: `Order #${res.orderNumber}`,
          order_id: rzpOrderRes.razorpayOrderId,
          prefill: { name: `${firstName} ${lastName}`, email, contact: phone },
          theme: { color: "#7B1C35" },
          modal: {
            ondismiss: () => {
              setError("Payment was cancelled. No money has been deducted.");
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
              setError("Verification error. Please contact support.");
              setSubmitting(false);
            }
          },
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.on("payment.failed", (resp: any) => {
          setError(`Payment failed: ${resp?.error?.description || "Unknown error"}`);
          setSubmitting(false);
        });
        rzp.open();
        return;
      }

      // COD: order is complete, go to success page
      setCart({
        id: null,
        checkoutUrl: null,
        totalQuantity: 0,
        lines: [],
        subtotal: "0.00",
      });
      router.push(`/checkout/success?orderId=${res.orderId}&number=${res.orderNumber}`);
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] bg-bgClr">
        <div className="w-12 h-12 border-4 border-maroonClr border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-600 font-medium">Securing checkout session...</p>
      </div>
    );
  }

  if (isCancelled) {
    return (
      <div className="container mx-auto px-4 py-16 text-center bg-bgClr max-w-md my-12 rounded-2xl border border-gray-200 shadow-sm bg-white">
        <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4 border border-amber-200 shadow-sm">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-serif font-bold text-gray-900 mb-2">
          Last Transaction Was Cancelled
        </h2>
        <p className="text-gray-600 text-sm mb-6 max-w-xs mx-auto">
          {urlError || error || "Your previous payment attempt was cancelled or not completed. No money was deducted."}
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/products" className="w-full sm:w-auto bg-maroonClr text-white px-6 py-3 rounded-lg font-bold text-xs uppercase tracking-wider hover:bg-maroonClr/90 transition-colors shadow-sm text-center">
            Keep Shopping
          </Link>
          <Link href="/" className="w-full sm:w-auto bg-white border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-bold text-xs uppercase tracking-wider hover:bg-gray-50 transition-colors text-center">
            Home
          </Link>
        </div>
      </div>
    );
  }

  if (error && !cart) {
    return (
      <div className="container mx-auto px-4 py-16 text-center bg-bgClr max-w-md my-12 rounded-2xl border border-gray-200 shadow-sm bg-white">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4 animate-bounce" />
        <h2 className="text-2xl font-serif font-bold text-gray-800 mb-2">Checkout Error</h2>
        <p className="text-gray-600 mb-6 text-sm">{error}</p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/products" className="w-full sm:w-auto bg-maroonClr text-white px-6 py-3 rounded-lg font-bold text-xs uppercase tracking-wider hover:bg-maroonClr/90 transition-colors shadow-sm text-center">
            Keep Shopping
          </Link>
          <Link href="/" className="w-full sm:w-auto bg-white border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-bold text-xs uppercase tracking-wider hover:bg-gray-50 transition-colors text-center">
            Home
          </Link>
        </div>
      </div>
    );
  }

  if (!cart || cart.lines.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center bg-bgClr max-w-md my-12 rounded-2xl border border-gray-200 shadow-sm bg-white">
        <Sparkles className="w-16 h-16 text-goldClr mx-auto mb-4" />
        <h2 className="text-2xl font-serif font-bold text-gray-800 mb-2">Your Cart is Empty</h2>
        <p className="text-gray-500 text-sm mb-6">Add products to your cart before checking out.</p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/products" className="w-full sm:w-auto bg-maroonClr text-white px-6 py-3 rounded-lg font-bold text-xs uppercase tracking-wider hover:bg-maroonClr/90 transition-colors shadow-sm text-center">
            Keep Shopping
          </Link>
          <Link href="/" className="w-full sm:w-auto bg-white border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-bold text-xs uppercase tracking-wider hover:bg-gray-50 transition-colors text-center">
            Home
          </Link>
        </div>
      </div>
    );
  }

  const isPrepaid = paymentMethod === "RAZORPAY";
  const prepaidDiscountAmount = isPrepaid 
    ? parseFloat(((parseFloat(cart.subtotal) - discount) * (prepaidDiscountPercent / 100)).toFixed(2))
    : 0;
  const finalTotal = parseFloat(cart.subtotal) - discount - prepaidDiscountAmount;

  return (
    <div className="min-h-screen bg-[#FDFBF7] pt-4 pb-36 sm:pb-12 px-4 md:px-6">
      <div className="container mx-auto max-w-6xl">
        {/* Navigation back */}
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-maroonClr transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to store
          </Link>
        </div>

        <div className="flex flex-col lg:flex-row gap-10 items-start">
          {/* Form Area */}
          <div className="flex-1 w-full bg-white p-6 md:p-8 rounded-xl shadow-sm border border-gray-100">
            <h1 className="text-2xl md:text-3xl font-serif font-bold text-maroonClr mb-8 pb-4 border-b border-gray-100 flex items-center gap-2">
              Shipping & Payment
            </h1>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded flex items-center gap-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Customer Contact */}
              <div>
                <h3 className="text-md font-semibold text-gray-800 uppercase tracking-wider mb-4">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Email Address</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="email@example.com"
                      className="w-full border border-gray-300 rounded px-4 py-2.5 text-sm focus:outline-none focus:border-maroonClr focus:ring-1 focus:ring-maroonClr"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Phone Number</label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. +91 9876543210"
                      className="w-full border border-gray-300 rounded px-4 py-2.5 text-sm focus:outline-none focus:border-maroonClr focus:ring-1 focus:ring-maroonClr"
                    />
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              <div className="pt-4 border-t border-gray-100">
                <h3 className="text-md font-semibold text-gray-800 uppercase tracking-wider mb-4">Delivery Address</h3>
                
                {addressesList && addressesList.length > 0 && (
                  <div className="mb-6 bg-creamClr/35 p-4 rounded-xl border border-gray-250">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
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
                                ? "border-maroonClr bg-white shadow-sm"
                                : "border-gray-200 bg-white hover:border-gray-300"
                            }`}
                          >
                            <div className="flex justify-between items-center mb-1.5">
                              <span className="font-semibold text-xs text-gray-900">{addr.name}</span>
                              {addr.isDefault && (
                                <span className="bg-maroonClr/15 text-maroonClr text-[8px] font-bold px-1 rounded uppercase tracking-wider">
                                  Default
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-gray-600 leading-relaxed font-sans font-medium">
                              {addr.address1}, {addr.address2 && `${addr.address2}, `}{addr.city}, {addr.province} - {addr.zip}
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
                        selectedAddressId === "new"
                          ? "text-maroonClr underline"
                          : "text-gray-500 hover:text-gray-950"
                      }`}
                    >
                      + Deliver to a new address
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">First Name</label>
                    <input
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="First Name"
                      className="w-full border border-gray-300 rounded px-4 py-2.5 text-sm focus:outline-none focus:border-maroonClr focus:ring-1 focus:ring-maroonClr"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Last Name</label>
                    <input
                      type="text"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Last Name"
                      className="w-full border border-gray-300 rounded px-4 py-2.5 text-sm focus:outline-none focus:border-maroonClr focus:ring-1 focus:ring-maroonClr"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Address Line 1</label>
                    <input
                      type="text"
                      required
                      value={address1}
                      onChange={(e) => setAddress1(e.target.value)}
                      placeholder="Flat, House no., Building, Company, Apartment"
                      className="w-full border border-gray-300 rounded px-4 py-2.5 text-sm focus:outline-none focus:border-maroonClr focus:ring-1 focus:ring-maroonClr"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Address Line 2 (Optional)</label>
                    <input
                      type="text"
                      value={address2}
                      onChange={(e) => setAddress2(e.target.value)}
                      placeholder="Area, Street, Sector, Village"
                      className="w-full border border-gray-300 rounded px-4 py-2.5 text-sm focus:outline-none focus:border-maroonClr focus:ring-1 focus:ring-maroonClr"
                    />
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="col-span-2 md:col-span-1">
                      <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">City</label>
                      <input
                        type="text"
                        required
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="City"
                        className="w-full border border-gray-300 rounded px-4 py-2.5 text-sm focus:outline-none focus:border-maroonClr focus:ring-1 focus:ring-maroonClr"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">State / Province</label>
                      <input
                        type="text"
                        required
                        value={province}
                        onChange={(e) => setProvince(e.target.value)}
                        placeholder="State"
                        className="w-full border border-gray-300 rounded px-4 py-2.5 text-sm focus:outline-none focus:border-maroonClr focus:ring-1 focus:ring-maroonClr"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Pincode / ZIP</label>
                      <input
                        type="text"
                        required
                        value={zip}
                        onChange={(e) => setZip(e.target.value)}
                        placeholder="e.g. 700001"
                        className="w-full border border-gray-300 rounded px-4 py-2.5 text-sm focus:outline-none focus:border-maroonClr focus:ring-1 focus:ring-maroonClr"
                      />
                      {zip.trim().length === 6 && /^\d{6}$/.test(zip.trim()) && (
                        <div className="mt-1.5 text-[11px] font-sans">
                          {loadingEdd ? (
                            <span className="text-gray-550 flex items-center gap-1">
                              <span className="w-3 h-3 border border-gray-450 border-t-transparent rounded-full animate-spin"></span>
                              Estimating delivery date...
                            </span>
                          ) : eddDate ? (
                            <span className="text-green-700 font-semibold flex items-center gap-1">
                              <Truck className="w-3.5 h-3.5 text-[#c49a45]" />
                              Estimated Delivery: {new Date(eddDate).toLocaleDateString("en-IN", { weekday: 'long', day: 'numeric', month: 'short' })}
                            </span>
                          ) : (
                            <span className="text-amber-600 font-medium">
                              Standard Delivery: 5 - 7 Days
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Country</label>
                      <input
                        type="text"
                        required
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        placeholder="India"
                        className="w-full border border-gray-300 rounded px-4 py-2.5 text-sm focus:outline-none focus:border-maroonClr focus:ring-1 focus:ring-maroonClr"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="pt-4 border-t border-gray-100">
                <h3 className="text-md font-semibold text-gray-800 uppercase tracking-wider mb-4">Payment Method</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* COD Option */}
                  <label className={`border rounded-lg p-4 flex items-center justify-between cursor-pointer transition-all hover:border-maroonClr ${paymentMethod === "COD" ? "border-maroonClr bg-maroonClr/5" : "border-gray-200"}`}>
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="payment"
                        checked={paymentMethod === "COD"}
                        onChange={() => setPaymentMethod("COD")}
                        className="w-4 h-4 text-maroonClr focus:ring-maroonClr accent-maroonClr"
                      />
                      <div>
                        <p className="font-semibold text-gray-800 text-sm">Cash on Delivery (COD)</p>
                        <p className="text-xs text-gray-500">Pay cash upon delivery at your doorstep.</p>
                      </div>
                    </div>
                    <Truck className="w-5 h-5 text-maroonClr" />
                  </label>

                  {/* Online Payment (Razorpay) Option */}
                  <label className={`border rounded-lg p-4 flex items-center justify-between cursor-pointer transition-all hover:border-maroonClr ${paymentMethod === "RAZORPAY" ? "border-maroonClr bg-maroonClr/5" : "border-gray-200"}`}>
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="payment"
                        checked={paymentMethod === "RAZORPAY"}
                        onChange={() => setPaymentMethod("RAZORPAY")}
                        className="w-4 h-4 text-maroonClr focus:ring-maroonClr accent-maroonClr"
                      />
                      <div>
                        <p className="font-semibold text-gray-800 text-sm flex items-center gap-2">
                          Online Payment
                          <span className="bg-green-100 text-green-800 text-[10px] px-2 py-0.5 rounded-full font-bold">
                            Flat {prepaidDiscountPercent}% Off
                          </span>
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          UPI, Google Pay, PhonePe, Paytm, Cards, Net Banking
                        </p>
                      </div>
                    </div>
                    <Smartphone className="w-5 h-5 text-maroonClr" />
                  </label>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-maroonClr text-white py-4 rounded-lg font-bold uppercase tracking-widest text-sm hover:bg-[#6A102A] transition-colors flex items-center justify-center gap-2 shadow-md hover:shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    {paymentMethod === "RAZORPAY" ? "Opening Payment..." : "Placing Order..."}
                  </>
                ) : (
                  <>
                    {paymentMethod === "RAZORPAY"
                      ? `Pay Online \u20B9${finalTotal.toFixed(0)}`
                      : `Place Order (\u20B9${finalTotal.toFixed(0)})`}
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Sidebar Order Summary */}
          <div className="w-full lg:w-[380px] bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-24">
            <h2 className="text-xl font-serif font-bold text-gray-800 mb-6 pb-2 border-b border-gray-100">
              Order Summary
            </h2>

            {/* Product list */}
            <div className="space-y-4 max-h-[360px] overflow-y-auto pr-2 custom-scrollbar mb-6">
              {cart.lines.map((line: any) => (
                <div key={line.id} className="flex gap-4 items-center">
                  <div className="w-16 h-20 bg-gray-50 relative rounded overflow-hidden border border-gray-100 flex-shrink-0">
                    {line.image ? (
                      <Image
                        src={line.image}
                        alt={line.title}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-maroonClr/5 flex items-center justify-center text-maroonClr/30 font-bold text-xs">
                        No Image
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-800 text-sm truncate hover:text-maroonClr transition-colors">
                      {line.title}
                    </h4>
                    <p className="text-xs text-gray-500 font-medium">Variant: {line.variantTitle}</p>
                    <p className="text-xs text-gray-400">Qty: {line.quantity}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="font-bold text-gray-800 text-sm">
                      {line.isGift ? (
                        <span className="text-green-600 font-bold bg-green-50 px-1.5 py-0.5 rounded text-[10px] border border-green-100">FREE</span>
                      ) : (
                        `₹${parseFloat(line.price).toFixed(0)}`
                      )}
                    </span>
                  </div>
                </div>
              ))}
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
                    className="flex-1 border border-gray-300 rounded px-3 py-1.5 text-xs text-gray-800 uppercase focus:outline-none focus:border-maroonClr"
                  />
                  <button
                    type="button"
                    onClick={handleApplyPromo}
                    disabled={checkingPromo || !promoCode}
                    className="bg-maroonClr text-white px-4 py-1.5 rounded text-xs font-bold uppercase tracking-wider hover:bg-[#6A102A] transition-colors disabled:opacity-55"
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
                <span>Subtotal ({cart.totalQuantity} items)</span>
                <span>₹{parseFloat(cart.subtotal).toFixed(2)}</span>
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
                <span className="font-bold uppercase tracking-wider text-xs">Total</span>
                <span className="font-bold text-xl text-maroonClr">
                  ₹{finalTotal.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Trust Badges */}
            <div className="mt-8 border-t border-gray-100 pt-4 space-y-3">
              <div className="flex items-center gap-2.5 text-xs text-gray-500 font-medium">
                <Shield className="w-4 h-4 text-goldClr flex-shrink-0" />
                <span>100% Authentic Handloom Products</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-gray-500 font-medium">
                <Truck className="w-4 h-4 text-goldClr flex-shrink-0" />
                <span>Safe & Secure Doorstep Delivery</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Bar for Mobile Checkout Button */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] bg-white/95 backdrop-blur-md border-t border-gray-200 z-[9999] shadow-[0_-6px_25px_rgba(0,0,0,0.18)]">
        <button
          type="button"
          onClick={() => {
            const form = document.querySelector("form");
            if (form) form.requestSubmit();
          }}
          disabled={submitting}
          className="w-full bg-maroonClr text-white py-4 rounded-lg font-bold uppercase tracking-widest text-xs hover:bg-[#6A102A] transition-colors flex items-center justify-center gap-2 shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {submitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              {paymentMethod === "RAZORPAY" ? "Opening Payment..." : "Placing Order..."}
            </>
          ) : (
            <>
              {paymentMethod === "RAZORPAY"
                ? `Pay Online \u20B9${finalTotal.toFixed(0)}`
                : `Place Order (\u20B9${finalTotal.toFixed(0)})`}
            </>
          )}
        </button>
      </div>
    </div>
  );
}

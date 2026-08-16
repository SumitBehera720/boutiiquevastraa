"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, MapPin, Phone, Trash2, Edit2, Plus, Check, AlertCircle } from "lucide-react";

interface Address {
  id: string;
  name: string;
  phone: string;
  alternatePhone?: string;
  address1: string;
  address2?: string;
  city: string;
  province: string;
  zip: string;
  country: string;
  isDefault: boolean;
}

interface AddressFormProps {
  initialAddress: {
    addresses?: Address[];
    address1?: string;
    address2?: string;
    city?: string;
    province?: string;
    zip?: string;
    country?: string;
    phone?: string;
  } | null;
}

export default function AddressForm({ initialAddress }: AddressFormProps) {
  const router = useRouter();

  // Helper to extract addresses array from legacy or new formats
  const getInitialAddresses = (): Address[] => {
    if (!initialAddress) return [];
    if (initialAddress.addresses && Array.isArray(initialAddress.addresses)) {
      return initialAddress.addresses;
    }
    if (initialAddress.address1) {
      return [
        {
          id: "addr_legacy",
          name: "Saved Address",
          phone: initialAddress.phone || "",
          alternatePhone: "",
          address1: initialAddress.address1,
          address2: initialAddress.address2 || "",
          city: initialAddress.city || "",
          province: initialAddress.province || "",
          zip: initialAddress.zip || "",
          country: initialAddress.country || "India",
          isDefault: true,
        },
      ];
    }
    return [];
  };

  const [addresses, setAddresses] = useState<Address[]>([]);
  
  // Sync state with props
  useEffect(() => {
    setAddresses(getInitialAddresses());
  }, [initialAddress]);

  const [formMode, setFormMode] = useState<"list" | "add" | "edit">("list");
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form Fields State
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [alternatePhone, setAlternatePhone] = useState("");
  const [address1, setAddress1] = useState("");
  const [address2, setAddress2] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [zip, setZip] = useState("");
  const [country, setCountry] = useState("India");
  const [isDefaultForm, setIsDefaultForm] = useState(false);

  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Open Form for Adding
  const handleAddNewClick = () => {
    setName("");
    setPhone("");
    setAlternatePhone("");
    setAddress1("");
    setAddress2("");
    setCity("");
    setProvince("");
    setZip("");
    setCountry("India");
    setIsDefaultForm(addresses.length === 0); // Force default if it's the first one
    setValidationErrors([]);
    setFormMode("add");
  };

  // Open Form for Editing
  const handleEditClick = (addr: Address) => {
    setEditingId(addr.id);
    setName(addr.name);
    setPhone(addr.phone);
    setAlternatePhone(addr.alternatePhone || "");
    setAddress1(addr.address1);
    setAddress2(addr.address2 || "");
    setCity(addr.city);
    setProvince(addr.province);
    setZip(addr.zip);
    setCountry(addr.country || "India");
    setIsDefaultForm(addr.isDefault);
    setValidationErrors([]);
    setFormMode("edit");
  };

  // Delete Address
  const handleDeleteClick = async (id: string) => {
    if (!confirm("Are you sure you want to delete this address?")) return;
    
    const updated = addresses.filter((a) => a.id !== id);
    // If we deleted the default address, make another one default
    if (addresses.find((a) => a.id === id)?.isDefault && updated.length > 0) {
      updated[0].isDefault = true;
    }
    
    await saveAddressList(updated, "Address deleted successfully!");
  };

  // Set Address as Default
  const handleSetDefault = async (id: string) => {
    const updated = addresses.map((a) => ({
      ...a,
      isDefault: a.id === id,
    }));
    await saveAddressList(updated, "Default address updated!");
  };

  // Save the complete address array to backend
  const saveAddressList = async (updatedList: Address[], successMsg: string) => {
    setSaving(true);
    setValidationErrors([]);
    try {
      const res = await fetch("/api/auth/me/address", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ addresses: updatedList }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update address list");
      
      setAddresses(updatedList);
      setSuccessMessage(successMsg);
      setFormMode("list");
      router.refresh();
      setTimeout(() => setSuccessMessage(""), 4000);
    } catch (err: any) {
      setValidationErrors([err.message || "Failed to save changes."]);
    } finally {
      setSaving(false);
    }
  };

  // Form submission handler (Insert / Update)
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: string[] = [];

    // Strict Validations
    if (name.trim().length < 3) {
      errors.push("Name must be at least 3 characters long.");
    }
    if (!/^[6-9]\d{9}$/.test(phone.trim())) {
      errors.push("Phone number must be a valid 10-digit Indian number.");
    }
    if (alternatePhone.trim() && !/^[6-9]\d{9}$/.test(alternatePhone.trim())) {
      errors.push("Alternate phone number must be a valid 10-digit Indian number.");
    }
    if (address1.trim().length < 5) {
      errors.push("Address Line 1 must be at least 5 characters long.");
    }
    if (!city.trim()) {
      errors.push("City is required.");
    }
    if (!province.trim()) {
      errors.push("State is required.");
    }
    if (!/^\d{6}$/.test(zip.trim())) {
      errors.push("Pincode must be exactly 6 digits.");
    }
    if (!country.trim()) {
      errors.push("Country is required.");
    }

    if (errors.length > 0) {
      setValidationErrors(errors);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    let updatedList: Address[] = [];
    const newAddress: Address = {
      id: formMode === "edit" && editingId ? editingId : `addr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: name.trim(),
      phone: phone.trim(),
      alternatePhone: alternatePhone.trim() || undefined,
      address1: address1.trim(),
      address2: address2.trim() || undefined,
      city: city.trim(),
      province: province.trim(),
      zip: zip.trim(),
      country: country.trim(),
      isDefault: isDefaultForm || addresses.length === 0,
    };

    if (formMode === "add") {
      if (newAddress.isDefault) {
        // Mark all others as non-default
        updatedList = addresses.map((a) => ({ ...a, isDefault: false }));
      } else {
        updatedList = [...addresses];
      }
      updatedList.push(newAddress);
    } else {
      updatedList = addresses.map((a) => {
        if (a.id === editingId) {
          return newAddress;
        }
        if (newAddress.isDefault) {
          return { ...a, isDefault: false };
        }
        return a;
      });
    }

    // Force default if there's only one address in the list
    if (updatedList.length === 1) {
      updatedList[0].isDefault = true;
    }

    await saveAddressList(updatedList, formMode === "add" ? "New address added!" : "Address updated successfully!");
  };

  // LIST VIEW RENDERING
  if (formMode === "list") {
    return (
      <div className="space-y-4">
        {successMessage && (
          <div className="bg-emerald-50 text-emerald-700 px-4 py-3 rounded-lg text-xs font-semibold border border-emerald-100 flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            {successMessage}
          </div>
        )}

        {addresses.length > 0 ? (
          <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
            {addresses.map((addr) => (
              <div
                key={addr.id}
                className={`p-4 rounded-xl border transition-all ${
                  addr.isDefault
                    ? "border-maroonClr/30 bg-[#FDFBF7]"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-gray-900">{addr.name}</span>
                    {addr.isDefault && (
                      <span className="bg-maroonClr/10 text-maroonClr text-[9px] font-bold px-1.5 py-0.5 rounded border border-maroonClr/20 uppercase tracking-wider">
                        Default
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2.5">
                    <button
                      onClick={() => handleEditClick(addr)}
                      className="text-gray-500 hover:text-maroonClr transition-colors"
                      title="Edit Address"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(addr.id)}
                      className="text-gray-500 hover:text-red-600 transition-colors"
                      title="Delete Address"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-gray-600 leading-relaxed font-sans">
                  {addr.address1}
                  {addr.address2 && `, ${addr.address2}`}
                  <br />
                  {addr.city}, {addr.province} - <span className="font-semibold">{addr.zip}</span>
                  <br />
                  {addr.country}
                </p>

                <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-2.5">
                  <span className="text-[11px] text-gray-500 font-sans flex items-center gap-1">
                    <Phone className="w-3 h-3 text-gray-400" />
                    {addr.phone}
                    {addr.alternatePhone && <span className="text-gray-400 font-light"> | Alt: {addr.alternatePhone}</span>}
                  </span>

                  {!addr.isDefault && (
                    <button
                      onClick={() => handleSetDefault(addr.id)}
                      className="text-[11px] font-bold text-maroonClr hover:underline flex items-center gap-0.5"
                    >
                      Set as Default
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 border border-dashed border-gray-200 rounded-xl bg-white">
            <MapPin className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-xs text-gray-500">No saved addresses found.</p>
          </div>
        )}

        <button
          onClick={handleAddNewClick}
          className="w-full py-2.5 border-2 border-dashed border-maroonClr/40 hover:border-maroonClr text-maroonClr bg-white rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all"
        >
          <Plus className="w-4 h-4" />
          Add New Address
        </button>
      </div>
    );
  }

  // ADD / EDIT FORM VIEW RENDERING
  return (
    <form onSubmit={handleFormSubmit} className="space-y-4 animate-scaleUp">
      <div className="flex justify-between items-center pb-2 border-b border-gray-100">
        <h3 className="text-xs font-bold text-gray-800 uppercase tracking-widest">
          {formMode === "add" ? "Add New Address" : "Edit Address"}
        </h3>
        <button
          type="button"
          onClick={() => setFormMode("list")}
          className="text-xs text-gray-400 hover:text-gray-900 uppercase tracking-widest font-bold"
        >
          Back
        </button>
      </div>

      {validationErrors.length > 0 && (
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-xs border border-red-100 space-y-1">
          <div className="flex items-center gap-1 font-bold mb-1">
            <AlertCircle className="w-4 h-4 text-red-500" />
            Please correct the following:
          </div>
          <ul className="list-disc pl-4 space-y-0.5">
            {validationErrors.map((err, idx) => (
              <li key={idx} className="font-sans font-medium">{err}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="space-y-3 font-sans">
        <div>
          <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Full Name *</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Recipient's name"
            className="w-full border border-gray-300 rounded px-3 py-2 text-xs focus:outline-none focus:border-maroonClr transition-all bg-[#FDFBF7]"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Phone Number *</label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="10-digit number"
              className="w-full border border-gray-300 rounded px-3 py-2 text-xs focus:outline-none focus:border-maroonClr transition-all bg-[#FDFBF7]"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Alternate Phone</label>
            <input
              type="tel"
              value={alternatePhone}
              onChange={(e) => setAlternatePhone(e.target.value)}
              placeholder="10-digit number (opt)"
              className="w-full border border-gray-300 rounded px-3 py-2 text-xs focus:outline-none focus:border-maroonClr transition-all bg-[#FDFBF7]"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Address Line 1 *</label>
          <input
            type="text"
            required
            value={address1}
            onChange={(e) => setAddress1(e.target.value)}
            placeholder="Flat / House no. / Floor / Building"
            className="w-full border border-gray-300 rounded px-3 py-2 text-xs focus:outline-none focus:border-maroonClr transition-all bg-[#FDFBF7]"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Address Line 2 (Optional)</label>
          <input
            type="text"
            value={address2}
            onChange={(e) => setAddress2(e.target.value)}
            placeholder="Street / Sector / Locality"
            className="w-full border border-gray-300 rounded px-3 py-2 text-xs focus:outline-none focus:border-maroonClr transition-all bg-[#FDFBF7]"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">City / Town *</label>
            <input
              type="text"
              required
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="City"
              className="w-full border border-gray-300 rounded px-3 py-2 text-xs focus:outline-none focus:border-maroonClr transition-all bg-[#FDFBF7]"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">State *</label>
            <input
              type="text"
              required
              value={province}
              onChange={(e) => setProvince(e.target.value)}
              placeholder="State"
              className="w-full border border-gray-300 rounded px-3 py-2 text-xs focus:outline-none focus:border-maroonClr transition-all bg-[#FDFBF7]"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Pincode *</label>
            <input
              type="text"
              required
              value={zip}
              onChange={(e) => setZip(e.target.value)}
              placeholder="6-digit PIN"
              className="w-full border border-gray-300 rounded px-3 py-2 text-xs focus:outline-none focus:border-maroonClr transition-all bg-[#FDFBF7]"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Country *</label>
            <input
              type="text"
              required
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder="Country"
              className="w-full border border-gray-300 rounded px-3 py-2 text-xs focus:outline-none focus:border-maroonClr transition-all bg-[#FDFBF7]"
            />
          </div>
        </div>

        {addresses.length > 0 && (
          <div className="flex items-center gap-2 pt-1.5">
            <input
              id="set-default"
              type="checkbox"
              checked={isDefaultForm}
              onChange={(e) => setIsDefaultForm(e.target.checked)}
              className="accent-maroonClr h-4 w-4"
            />
            <label htmlFor="set-default" className="text-xs text-gray-600 cursor-pointer">
              Make this my default address
            </label>
          </div>
        )}
      </div>

      <div className="flex gap-3 pt-2.5">
        <button
          type="submit"
          disabled={saving}
          className="flex-1 bg-maroonClr hover:bg-maroonClr/90 text-white py-2 px-4 rounded text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Address"}
        </button>
        <button
          type="button"
          onClick={() => setFormMode("list")}
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded text-xs font-bold uppercase tracking-wider transition-all"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

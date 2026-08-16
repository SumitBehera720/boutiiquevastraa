import { cookies } from "next/headers";
import { serverGetAuthUser } from "@/lib/server-data";
import CheckoutForm from "@/components/checkout/CheckoutForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Checkout | Boutiique Vastraa",
  description: "Secure checkout for your handcrafted sarees and ethnic wear.",
};

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ cartId?: string }>;
}) {
  const resolvedSearchParams = await searchParams;

  // Check if customer is logged in
  const cookieStore = await cookies();
  const customerToken = cookieStore.get("boutiique_vastraa_customer_token")?.value || null;
  
  let customer = null;
  let loggedInCartId = "";
  if (customerToken) {
    try {
      const rawCustomer = await serverGetAuthUser(customerToken);
      if (rawCustomer) {
        // Exclude passwordHash from client
        customer = {
          id: rawCustomer.id,
          firstName: rawCustomer.firstName,
          lastName: rawCustomer.lastName,
          email: rawCustomer.email,
          phone: rawCustomer.phone || "",
          defaultAddress: rawCustomer.defaultAddress || null,
          cartId: rawCustomer.cartId || null
        };
        loggedInCartId = rawCustomer.cartId || "";
      }
    } catch {
      // Not authenticated
    }
  }

  const cartId = resolvedSearchParams.cartId || loggedInCartId || "";

  return (
    <CheckoutForm 
      cartId={cartId} 
      initialCustomer={customer} 
    />
  );
}

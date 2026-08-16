"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createCustomer, createCustomerAccessToken } from "@/lib/shopify/mutations";

const COOKIE_NAME = "boutiique_vastraa_customer_token";

export async function loginAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { success: false, error: "Please provide both email and password." };
  }

  try {
    const data = await createCustomerAccessToken({ email, password });

    if (data?.customerUserErrors?.length > 0) {
      return { success: false, error: data.customerUserErrors[0].message };
    }

    const token = data?.customerAccessToken?.accessToken;
    const expiresAt = data?.customerAccessToken?.expiresAt;

    if (token) {
      const cookieStore = await cookies();
      cookieStore.set(COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        expires: expiresAt ? new Date(expiresAt) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });
      return { success: true };
    }

    return { success: false, error: "Invalid credentials." };
  } catch (error) {
    console.error("Login Action Error:", error);
    return { success: false, error: "An unexpected error occurred during login." };
  }
}

export async function registerAction(formData: FormData) {
  const firstName = formData.get("firstName") as string;
  const lastName = formData.get("lastName") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!firstName || !lastName || !email || !password) {
    return { success: false, error: "Please fill in all fields." };
  }

  try {
    const data = await createCustomer({ firstName, lastName, email, password });

    if (data?.customerUserErrors?.length > 0) {
      return { success: false, error: data.customerUserErrors[0].message };
    }

    return await loginAction(formData);
  } catch (error) {
    console.error("Register Action Error:", error);
    return { success: false, error: "An unexpected error occurred during registration." };
  }
}

export async function logoutAction() {
  try {
    const { initDataStore, sessions } = await import("@/lib/data-store");
    await initDataStore();
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (token) await sessions.delete(token);
  } catch {}
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
  redirect("/account/login");
}

export async function getCustomerToken() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME);
  return token?.value || null;
}

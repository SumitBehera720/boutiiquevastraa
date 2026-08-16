"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { serverGetAuthUser } from "@/lib/server-data";

export async function verifyAdminSession() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("boutiique_vastraa_customer_token")?.value;
    if (!token) return false;
    const me = await serverGetAuthUser(token);
    return me?.email?.toLowerCase() === "admin@boutiiquevastraa.com";
  } catch {
    return false;
  }
}

export async function adminLogoutAction() {
  try {
    const { initDataStore, sessions } = await import("@/lib/data-store");
    await initDataStore();
    const cookieStore = await cookies();
    const token = cookieStore.get("boutiique_vastraa_customer_token")?.value;
    if (token) await sessions.delete(token);
  } catch {}
  const cookieStore = await cookies();
  cookieStore.delete("boutiique_vastraa_customer_token");
  redirect("/account/login");
}

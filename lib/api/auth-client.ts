const COOKIE_NAME = "boutiique_vastraa_customer_token";

function setCookie(name: string, value: string, days: number) {
  const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
  const isSecure = typeof window !== "undefined" && window.location.protocol === "https:";
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax${isSecure ? "; Secure" : ""}`;
}

function deleteCookie(name: string) {
  const isSecure = typeof window !== "undefined" && window.location.protocol === "https:";
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax${isSecure ? "; Secure" : ""}`;
}

export async function register(input: { firstName: string; lastName: string; email: string; password: string }) {
  const res = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(input),
  });
  const data = await res.json();
  if (!res.ok) {
    const msg = data?.errors?.email?.[0] || data?.message || "Registration failed";
    throw new Error(msg);
  }
  if (data.token) {
    setCookie(COOKIE_NAME, data.token, 30);
  }
  return data;
}

export async function login(input: { email: string; password: string }) {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(input),
  });
  const data = await res.json();
  if (!res.ok) {
    const msg = data?.errors?.email?.[0] || data?.message || "Login failed";
    throw new Error(msg);
  }
  if (data.token) {
    setCookie(COOKIE_NAME, data.token, 30);
  }
  return data;
}

export function logout() {
  deleteCookie(COOKIE_NAME);
  fetch("/api/auth/logout", {
    method: "POST",
    headers: { Accept: "application/json" },
  }).catch(() => {});
}

export function getTokenFromCookie(): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${COOKIE_NAME}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export async function syncSession(input: { cartId: string | null; wishlist: any[] }) {
  const token = getTokenFromCookie();
  if (!token) return null;
  
  const res = await fetch("/api/auth/me/sync", {
    method: "PUT",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error("Sync failed");
  return res.json();
}

export async function syncWishlist(wishlist: any[]) {
  const token = getTokenFromCookie();
  if (!token) return null;
  
  const res = await fetch("/api/auth/me/wishlist", {
    method: "PUT",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ wishlist }),
  });
  if (!res.ok) throw new Error("Wishlist sync failed");
  return res.json();
}

export async function loginWithGoogle(idToken: string) {
  const res = await fetch("/api/auth/google", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ idToken }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.message || "Google Sign-In failed");
  }
  if (data.token) {
    setCookie(COOKIE_NAME, data.token, 30);
  }
  return data;
}

export { COOKIE_NAME };

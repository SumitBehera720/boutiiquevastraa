import { verifyAdminSession } from "@/app/actions/adminAuth";
import AdminLayoutClient from "@/components/admin/AdminLayoutClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Console | Boutiique Vastraa",
  description: "Advanced administrative dashboard for Boutiique Vastraa store management.",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isLogged = await verifyAdminSession();

  if (!isLogged) {
    // Return children directly (the login page) without the sidebar dashboard frame
    return <>{children}</>;
  }

  return (
    <AdminLayoutClient>
      {children}
    </AdminLayoutClient>
  );
}

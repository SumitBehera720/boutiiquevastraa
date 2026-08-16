import { verifyAdminSession } from "@/app/actions/adminAuth";
import { redirect } from "next/navigation";
import { serverGetUsers, serverGetOrders } from "@/lib/server-data";
import CustomersListClient from "@/components/admin/CustomersListClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Customers Directory | Boutiique Vastraa",
  description: "Customer registers, purchase counts, and lifetime value records.",
};

export default async function AdminCustomersPage() {
  const isLogged = await verifyAdminSession();
  if (!isLogged) {
    redirect("/account/login");
  }

  const [customers, orders] = await Promise.all([
    serverGetUsers(),
    serverGetOrders(),
  ]);

  return (
    <CustomersListClient 
      customers={customers} 
      orders={orders} 
    />
  );
}

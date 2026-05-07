import { Suspense } from "react";
import { OrdersTable } from "@/components/dashboard/OrdersTable";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";

export default function OrdersPage() {
  return (
    <DashboardLayout>
      <Suspense fallback={null}>
        <OrdersTable />
      </Suspense>
    </DashboardLayout>
  );
}

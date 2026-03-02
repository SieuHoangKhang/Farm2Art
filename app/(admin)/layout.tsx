import { RequireAuth } from "@/components/auth/RequireAuth";
import AdminSidebar from "@/components/admin/AdminSidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RequireAuth requireAdmin>
      <div className="min-h-screen bg-stone-50">
        <AdminSidebar />
        {/* Main content area - offset by sidebar width */}
        <main className="lg:pl-60 pt-14 lg:pt-0 min-h-screen">
          <div className="p-4 md:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </RequireAuth>
  );
}

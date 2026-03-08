import { RequireAuth } from "@/components/auth/RequireAuth";
import AdminSidebar from "@/components/admin/AdminSidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RequireAuth requireAdmin>
      <div className="min-h-screen w-full">
        <AdminSidebar />
        {/* Main content area - offset by sidebar width */}
        <main className="lg:pl-64 pt-14 lg:pt-0 min-h-screen">
          <div className="w-full px-4 md:px-6 lg:px-8 py-6 md:py-8">{children}</div>
        </main>
      </div>
    </RequireAuth>
  );
}

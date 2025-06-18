import { AuthProvider, ProtectedRoute } from '@/context/AuthContext';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <ProtectedRoute>
        {/* You can add a common navbar/sidebar here */}
        <main>{children}</main>
      </ProtectedRoute>
    </AuthProvider>
  );
}
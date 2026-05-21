import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard | BalloonBase",
  description: "Manage your balloon decoration business",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-orange-600">BalloonBase</h1>
            </div>
            <div className="flex gap-4">
              <a href="/dashboard/booking-forms" className="text-gray-700 hover:text-gray-900">
                Booking Forms
              </a>
              <a href="/dashboard/pipeline" className="text-gray-700 hover:text-gray-900">
                Pipeline
              </a>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto">
        {children}
      </main>
    </div>
  );
}

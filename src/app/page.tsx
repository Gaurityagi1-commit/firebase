// The root page might not be directly accessible if always redirected by middleware.
// Keeping DashboardContent here assumes middleware successfully redirects logged-in users.
// If a user lands here unauthenticated, middleware should redirect them to /login.

import DashboardContent from '@/components/dashboard/Dashboard';

export default function HomePage() {
  // This page content will likely only be shown to authenticated users
  // due to the middleware redirecting unauthenticated users to /login.
  return <DashboardContent />;
}

import Header from '@/components/common/Header';
import ProfileSettings from '@/components/settings/ProfileSettings';
import AdminSettings from '@/components/settings/AdminSettings';
// We might need a way to check user role on the client-side for conditional rendering
// This could involve fetching the user's profile or using a context/hook

export default function SettingsPage() {
  // TODO: Add logic to conditionally render AdminSettings based on user role
  // For now, we render both, but AdminSettings component should handle its own authorization checks or display appropriate messages.

  return (
    <>
      <Header title="Settings" />
      <main className="flex-1 p-4 md:p-6 space-y-6 overflow-auto">
        <ProfileSettings />
        <AdminSettings />
        {/* Keep Notification Settings placeholder or implement later */}
        {/*
        <Card>
          <CardHeader>
            <CardTitle>Notification Settings</CardTitle>
            <CardDescription>Manage how you receive notifications.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <p className="text-sm text-muted-foreground">Notification options coming soon.</p>
             <Button variant="outline">Manage Notifications</Button>
          </CardContent>
        </Card>
        */}
      </main>
    </>
  );
}

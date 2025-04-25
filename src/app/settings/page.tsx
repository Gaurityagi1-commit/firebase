import Header from '@/components/common/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

export default function SettingsPage() {
  return (
    <>
      <Header title="Settings" />
      <main className="flex-1 p-4 md:p-6 space-y-6 overflow-auto">
        <Card>
          <CardHeader>
            <CardTitle>Profile Settings</CardTitle>
            <CardDescription>Update your personal information.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" defaultValue="Admin User" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" defaultValue="admin@salesflow.com" />
            </div>
             <Button>Save Changes</Button>
          </CardContent>
        </Card>

         <Card>
          <CardHeader>
            <CardTitle>Notification Settings</CardTitle>
            <CardDescription>Manage how you receive notifications.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             {/* Add notification toggles here later */}
             <p className="text-sm text-muted-foreground">Notification options coming soon.</p>
             <Button variant="outline">Manage Notifications</Button>
          </CardContent>
        </Card>

         <Card>
          <CardHeader>
            <CardTitle>Admin Settings</CardTitle>
            <CardDescription>Manage users and system settings (Admin only).</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             {/* Add user management links/buttons here later */}
             <p className="text-sm text-muted-foreground">User management features coming soon.</p>
              <Button variant="destructive">Manage Users</Button>
          </CardContent>
        </Card>

      </main>
    </>
  );
}

import { useUser } from '@clerk/clerk-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@wiserpin/ui';

export function SettingsPage() {
  const { user } = useUser();

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your account and preferences
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>
              Your account details managed by Clerk
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Name</label>
                <p className="text-foreground">
                  {user?.firstName} {user?.lastName}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Email</label>
                <p className="text-foreground">
                  {user?.primaryEmailAddress?.emailAddress}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">User ID</label>
                <p className="text-foreground text-xs font-mono">{user?.id}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sync Settings</CardTitle>
            <CardDescription>
              Configure how your pins sync across devices
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Cloud sync features are coming soon. Your pins will automatically sync across all your devices.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Extension Settings</CardTitle>
            <CardDescription>
              Configure the browser extension behavior
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Extension settings can be managed from the browser extension options page.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

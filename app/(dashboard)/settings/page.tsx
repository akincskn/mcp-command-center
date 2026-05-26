import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UsageDashboard } from '@/components/settings/UsageDashboard';
import { Preferences } from '@/components/settings/Preferences';

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your preferences and monitor usage.
        </p>
      </div>

      <Tabs defaultValue="usage">
        <TabsList>
          <TabsTrigger value="usage">Usage &amp; Cost</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
        </TabsList>

        <TabsContent value="usage" className="mt-6">
          <UsageDashboard />
        </TabsContent>

        <TabsContent value="preferences" className="mt-6">
          <Preferences />
        </TabsContent>
      </Tabs>
    </div>
  );
}

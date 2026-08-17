import { PageHeader } from "@/components/ui/page-header";
import { SettingsDashboard } from "@/components/settings/settings-dashboard";
export const metadata = { title: "Settings" };
export default function SettingsPage() { return <main className="space-y-6"><PageHeader eyebrow="Account" title="Settings" description="Save PowerChain app preferences, custom wallet RPC endpoints, API connectivity and provider credentials with a strict secret-storage boundary."/><SettingsDashboard/></main>; }

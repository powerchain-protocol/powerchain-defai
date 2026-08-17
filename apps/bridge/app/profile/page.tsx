import { PageHeader } from "@/components/ui/page-header";
import { UserProfileCard } from "@/components/profile/user-profile-card";
export const metadata = { title: "Profile" };
export default function ProfilePage() { return <main className="space-y-6"><PageHeader eyebrow="Account" title="User profile" description="Browser-local personalization paired with connected Solana and Sui wallet state. Profile data never substitutes for wallet authentication."/><UserProfileCard/></main>; }

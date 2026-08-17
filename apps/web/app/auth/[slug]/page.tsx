import { notFound } from "next/navigation";
import { OpenAppGateway } from "@/website/ui/open-app-gateway";
import { isAppRouteSlug, sanitizeResourceId } from "@/website/lib/redirects";

export default async function WalletAccessRoute({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ id?: string }> }) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  if (!isAppRouteSlug(slug)) notFound();
  return <OpenAppGateway slug={slug} resourceId={sanitizeResourceId(query.id)} accessMode="wallet-access" />;
}

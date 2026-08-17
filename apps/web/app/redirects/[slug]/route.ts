import { NextRequest, NextResponse } from "next/server";
import { buildAppHandoffUrl, isAppRouteSlug, sanitizeResourceId } from "@/website/lib/redirects";

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!isAppRouteSlug(slug)) return NextResponse.redirect(new URL("/open/dashboard", request.url), 307);
  const id = sanitizeResourceId(request.nextUrl.searchParams.get("id"));
  const chain = request.nextUrl.searchParams.get("chain")?.toUpperCase();
  const clusterId = request.nextUrl.searchParams.get("cluster");
  return NextResponse.redirect(buildAppHandoffUrl({
    slug,
    id,
    chain: chain === "SOLANA" || chain === "SUI" ? chain : null,
    clusterId,
    source: "website-redirect",
  }), 307);
}

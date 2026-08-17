import { CTA } from "@/website/ui/cta";
import { FAQ } from "@/website/ui/faq";
import { Features } from "@/website/ui/features";
import { Hero } from "@/website/ui/hero";
import { MarketingShell } from "@/website/ui/shell";
import { Partnerships } from "@/website/ui/partnerships";
import { Products } from "@/website/ui/products";

export default function MarketingHome() {
  return <MarketingShell><Hero /><Products /><Features /><Partnerships /><FAQ /><CTA /></MarketingShell>;
}

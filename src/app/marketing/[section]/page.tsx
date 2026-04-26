import MarketingModuleShell from "../MarketingModuleShell";
import { marketingSections } from "./MarketingSectionClient";

export function generateStaticParams() {
  return Object.keys(marketingSections).map((section) => ({ section }));
}

export default async function MarketingSectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  return <MarketingModuleShell section={section} />;
}

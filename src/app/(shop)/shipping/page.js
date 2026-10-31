import { PolicyPage } from "@/components/shop/PolicyPage";
import { POLICY_PAGES } from "@/lib/shop/copy";

export const metadata = {
  title: POLICY_PAGES.shipping.title,
  description: POLICY_PAGES.shipping.intro,
};

export default function ShippingPage() {
  const { title, intro, sections } = POLICY_PAGES.shipping;
  return <PolicyPage title={title} intro={intro} sections={sections} />;
}

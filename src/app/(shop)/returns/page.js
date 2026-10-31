import { PolicyPage } from "@/components/shop/PolicyPage";
import { POLICY_PAGES } from "@/lib/shop/copy";

export const metadata = {
  title: POLICY_PAGES.returns.title,
  description: POLICY_PAGES.returns.intro,
};

export default function ReturnsPage() {
  const { title, intro, sections } = POLICY_PAGES.returns;
  return <PolicyPage title={title} intro={intro} sections={sections} />;
}

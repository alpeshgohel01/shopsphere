import { PolicyPage } from "@/components/shop/PolicyPage";
import { POLICY_PAGES } from "@/lib/shop/copy";

export const metadata = {
  title: POLICY_PAGES.contact.title,
  description: POLICY_PAGES.contact.intro,
};

export default function ContactPage() {
  const { title, intro, sections } = POLICY_PAGES.contact;
  return <PolicyPage title={title} intro={intro} sections={sections} />;
}

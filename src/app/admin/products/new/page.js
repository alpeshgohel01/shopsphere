import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ProductForm } from "@/components/admin/ProductForm";

export const metadata = { title: "New product" };

export default function NewProductPage() {
  return (
    <>
      <header className="space-y-2">
        <Link
          href="/admin/products"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Products
        </Link>
        <h1 className="text-2xl font-bold">New product</h1>
      </header>
      <ProductForm />
    </>
  );
}

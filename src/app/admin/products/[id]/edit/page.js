import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ProductForm } from "@/components/admin/ProductForm";
import { getProductById } from "@/lib/shop/products";

export const metadata = { title: "Edit product" };

export default async function EditProductPage({ params }) {
  const { id } = await params;
  const product = await getProductById(id, { includeInactive: true });
  if (!product) notFound();

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
        <h1 className="text-2xl font-bold">Edit product</h1>
        <p className="text-sm text-muted-foreground">{product.title}</p>
      </header>
      {/* key resets form state if the product changes after a refresh */}
      <ProductForm key={`${product.id}-${product.updatedAt}`} product={product} />
    </>
  );
}

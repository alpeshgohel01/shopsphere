import { cache } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, RotateCcw, ShieldCheck, Truck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Gallery } from "@/components/shop/Gallery";
import { ProductAccordion } from "@/components/shop/ProductAccordion";
import { ProductGrid } from "@/components/shop/ProductGrid";
import { ProductPurchasePanel } from "@/components/shop/ProductPurchasePanel";
import { RatingBreakdown } from "@/components/shop/RatingBreakdown";
import { RatingStars } from "@/components/shop/RatingStars";
import { RecentlyViewed } from "@/components/shop/RecentlyViewed";
import { ReviewForm } from "@/components/shop/ReviewForm";
import { ReviewSection } from "@/components/shop/ReviewSection";
import { StockLine } from "@/components/shop/StockLine";
import { resolveAppUrl } from "@/lib/app-url";
import { getOptionalSession } from "@/lib/shop/guards";
import { discountPercent, isOnSale, primaryImage } from "@/lib/shop/cart-line";
import { PRODUCT } from "@/lib/shop/copy";
import { formatPrice } from "@/lib/shop/format";
import { buildProductJsonLd, jsonLdString } from "@/lib/shop/product-schema";
import {
  getProductBySlug,
  getRelatedProducts,
  toObjectId,
} from "@/lib/shop/products";
import {
  getRatingBreakdown,
  hasPurchasedProduct,
  listReviews,
} from "@/lib/shop/reviews";

const getProduct = cache((slug) => getProductBySlug(slug));

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return { title: "Product not found" };

  const description =
    product.description?.slice(0, 160) ||
    `${product.title} - ${formatPrice(product.price)} at ShopSphere.`;
  const image = primaryImage(product);

  return {
    title: product.title,
    description,
    openGraph: {
      title: `${product.title} | ShopSphere`,
      description,
      ...(image ? { images: [{ url: image }] } : {}),
    },
  };
}

const PERKS = [
  { icon: Truck, text: "Free shipping over $100" },
  { icon: RotateCcw, text: "30-day returns" },
  { icon: ShieldCheck, text: "Secure checkout" },
];

function Lines({ lines }) {
  return (
    <ul className="list-disc space-y-1.5 pl-5 marker:text-muted-foreground">
      {lines.map((line) => (
        <li key={line}>{line}</li>
      ))}
    </ul>
  );
}

/** Details & materials: product description split by line, plus static fit notes. */
function DetailsContent({ product }) {
  const paragraphs = (product.description ?? "")
    .split(/\r?\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <div className="space-y-4">
      {paragraphs.map((p) => (
        <p key={p}>{p}</p>
      ))}
      <Lines
        lines={[
          ...(product.brand ? [`Brand: ${product.brand}`] : []),
          ...(product.category ? [`Category: ${product.category}`] : []),
          ...PRODUCT.fallbackDetails,
        ]}
      />
    </div>
  );
}

export default async function ProductPage({ params }) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  const session = await getOptionalSession();
  const REVIEW_PAGE = 8;
  const [related, reviews, breakdown, canReview] = await Promise.all([
    getRelatedProducts(product.id, 4),
    listReviews(product.id, { limit: REVIEW_PAGE }),
    getRatingBreakdown(product.id).catch(() => ({ total: 0, rows: [] })),
    session?.user?.id
      ? hasPurchasedProduct(session.user.id, toObjectId(product.id)).catch(() => false)
      : Promise.resolve(false),
  ]);

  const onSale = isOnSale(product);
  const jsonLd = buildProductJsonLd(product, resolveAppUrl());

  const accordionItems = [
    {
      id: "details",
      title: PRODUCT.accordion.details,
      content: <DetailsContent product={product} />,
    },
    {
      id: "shipping",
      title: PRODUCT.accordion.shipping,
      content: (
        <>
          <Lines lines={PRODUCT.shippingText} />
          <p className="mt-3">
            <Link href="/shipping" className="underline underline-offset-2 hover:text-primary">
              Shipping
            </Link>
            {" | "}
            <Link href="/returns" className="underline underline-offset-2 hover:text-primary">
              Returns
            </Link>
            {" | "}
            <Link href="/size-guide" className="underline underline-offset-2 hover:text-primary">
              Size guide
            </Link>
          </p>
        </>
      ),
    },
    {
      id: "care",
      title: PRODUCT.accordion.care,
      content: <Lines lines={PRODUCT.careText} />,
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 max-lg:pb-28 sm:px-6 sm:py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdString(jsonLd) }}
      />

      <nav aria-label="Breadcrumb" className="mb-8 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Link href="/products" className="hover:text-foreground">
          Shop
        </Link>
        <ChevronRight className="size-3" />
        <Link
          href={`/products?category=${encodeURIComponent(product.category)}`}
          className="hover:text-foreground"
        >
          {product.category}
        </Link>
        <ChevronRight className="size-3" />
        <span className="line-clamp-1 text-foreground">{product.title}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <Gallery images={product.images} title={product.title} />
        </div>

        <div className="lg:pt-4">
          {product.brand ? (
            <p className="text-xs font-semibold tracking-[0.16em] text-primary uppercase">
              {product.brand}
            </p>
          ) : null}
          <h1 className="font-display mt-3 text-4xl leading-[1.02] sm:text-5xl">
            {product.title}
          </h1>

          <div className="mt-4 flex flex-wrap items-center gap-4">
            <RatingStars rating={product.ratingAvg} count={product.ratingCount} size="md" />
          </div>

          <p className="mt-6 flex items-center gap-3">
            <span className="text-2xl font-semibold">{formatPrice(product.price)}</span>
            {onSale ? (
              <>
                <span className="text-lg text-muted-foreground line-through">
                  {formatPrice(product.compareAtPrice)}
                </span>
                <Badge className="rounded-lg bg-highlight px-2 text-highlight-foreground">
                  Save {discountPercent(product)}%
                </Badge>
              </>
            ) : null}
          </p>

          <StockLine product={product} className="mt-4" />

          <div className="mt-8">
            <ProductPurchasePanel product={product} />
          </div>

          <div className="mt-10">
            <ProductAccordion items={accordionItems} defaultOpen="details" />
          </div>

          <ul className="mt-10 grid gap-3 pt-2 text-sm sm:grid-cols-3">
            {PERKS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-2.5 text-muted-foreground">
                <Icon className="size-4 text-primary" />
                {text}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <section className="mt-24 grid gap-12 lg:grid-cols-[20rem_1fr] lg:gap-16" id="reviews">
        <div>
          <h2 className="font-display text-3xl">Reviews</h2>
          <div className="mt-4 flex items-end gap-3">
            <span className="font-display text-5xl leading-none">
              {product.ratingCount ? product.ratingAvg.toFixed(1) : "-"}
            </span>
            <RatingStars
              rating={product.ratingAvg}
              count={product.ratingCount}
              size="md"
              className="pb-1"
            />
          </div>
          {breakdown.total > 0 ? (
            <div className="mt-6">
              <RatingBreakdown total={breakdown.total} rows={breakdown.rows} />
            </div>
          ) : null}
          <div className="mt-8">
            <ReviewForm
              productId={product.id}
              signedIn={Boolean(session)}
              canReview={canReview}
            />
          </div>
        </div>
        <ReviewSection
          productId={product.id}
          initialItems={reviews.items}
          initialTotal={reviews.total}
          pageSize={REVIEW_PAGE}
        />
      </section>

      {related.length ? (
        <section className="mt-24">
          <h2 className="font-display mb-10 text-3xl sm:text-4xl">You may also like</h2>
          <ProductGrid products={related} />
        </section>
      ) : null}

      <RecentlyViewed product={product} className="mt-24" />
    </div>
  );
}

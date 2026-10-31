import "server-only";
import { getSubscribersCol } from "@/lib/shop/collections";
import { newsletterSchema } from "@/lib/shop/validators";

/**
 * Subscribe an email (idempotent upsert). Re-subscribing keeps the original
 * `createdAt` and clears any previous unsubscribe.
 *
 * @param {unknown} input { email }
 * @returns {Promise<{ email: string, alreadySubscribed: boolean }>}
 */
export async function subscribeToNewsletter(input) {
  const { email } = newsletterSchema.parse(input);
  const col = await getSubscribersCol();
  const now = new Date();

  const res = await col.updateOne(
    { email },
    {
      $set: { status: "subscribed", updatedAt: now },
      $unset: { unsubscribedAt: "" },
      $setOnInsert: { email, source: "website", createdAt: now },
    },
    { upsert: true },
  );

  return { email, alreadySubscribed: res.upsertedCount === 0 };
}

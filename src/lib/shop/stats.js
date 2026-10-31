import "server-only";
import { getDb } from "@/lib/db";
import {
  getOrdersCol,
  getProductsCol,
  getReviewsCol,
} from "@/lib/shop/collections";
import {
  attachCustomerEmails,
  serializeOrder,
} from "@/lib/shop/order-serialize";
import { percentChange } from "@/lib/shop/trend";

export const LOW_STOCK_THRESHOLD = 5;
export const SALES_WINDOW_DAYS = 30;

/** Paid orders that were not later cancelled. */
const REVENUE_MATCH = { paymentStatus: "paid", status: { $ne: "cancelled" } };

const dayKey = (d) => d.toISOString().slice(0, 10);

/**
 * Aggregate everything the admin dashboard needs. Amounts are integer cents.
 * Days are bucketed in UTC.
 */
export async function getAdminStats() {
  const [orders, products, reviews] = await Promise.all([
    getOrdersCol(),
    getProductsCol(),
    getReviewsCol(),
  ]);

  const now = new Date();
  const windowStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  windowStart.setUTCDate(windowStart.getUTCDate() - (SALES_WINDOW_DAYS - 1));
  // The 30 days immediately before the current window.
  const priorStart = new Date(windowStart);
  priorStart.setUTCDate(priorStart.getUTCDate() - SALES_WINDOW_DAYS);

  const [
    revenueAgg,
    recentRevenueAgg,
    priorRevenueAgg,
    statusAgg,
    salesAgg,
    productCounts,
    reviewCount,
    userCount,
    lowStockDocs,
    recentOrders,
  ] = await Promise.all([
    orders
      .aggregate([
        { $match: REVENUE_MATCH },
        { $group: { _id: null, revenue: { $sum: "$total" }, count: { $sum: 1 } } },
      ])
      .toArray(),
    orders
      .aggregate([
        { $match: { ...REVENUE_MATCH, paidAt: { $gte: windowStart } } },
        { $group: { _id: null, revenue: { $sum: "$total" }, count: { $sum: 1 } } },
      ])
      .toArray(),
    orders
      .aggregate([
        { $match: { ...REVENUE_MATCH, paidAt: { $gte: priorStart, $lt: windowStart } } },
        { $group: { _id: null, revenue: { $sum: "$total" }, count: { $sum: 1 } } },
      ])
      .toArray(),
    orders.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]).toArray(),
    orders
      .aggregate([
        { $match: { ...REVENUE_MATCH, paidAt: { $gte: windowStart } } },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$paidAt", timezone: "UTC" },
            },
            revenue: { $sum: "$total" },
            orders: { $sum: 1 },
          },
        },
      ])
      .toArray(),
    products
      .aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            active: { $sum: { $cond: ["$isActive", 1, 0] } },
          },
        },
      ])
      .toArray(),
    reviews.countDocuments({}),
    getDb()
      .then((db) => db.collection("user").countDocuments({}))
      .catch(() => null),
    products
      .aggregate([
        { $match: { isActive: true } },
        {
          $addFields: {
            totalStock: {
              $sum: {
                $map: {
                  input: { $ifNull: ["$variants", []] },
                  as: "v",
                  in: { $ifNull: ["$$v.stock", 0] },
                },
              },
            },
          },
        },
        { $match: { totalStock: { $lt: LOW_STOCK_THRESHOLD } } },
        { $sort: { totalStock: 1, title: 1 } },
        { $limit: 50 },
        {
          $project: {
            title: 1,
            slug: 1,
            category: 1,
            totalStock: 1,
            variants: 1,
            image: { $arrayElemAt: ["$images.url", 0] },
          },
        },
      ])
      .toArray(),
    orders.find({}).sort({ createdAt: -1, _id: -1 }).limit(5).toArray(),
  ]);

  // Fill in days without sales so charts get a continuous 30-day series.
  const byDay = new Map(salesAgg.map((r) => [r._id, r]));
  const salesByDay = [];
  for (let i = 0; i < SALES_WINDOW_DAYS; i++) {
    const d = new Date(windowStart);
    d.setUTCDate(windowStart.getUTCDate() + i);
    const key = dayKey(d);
    const row = byDay.get(key);
    salesByDay.push({ date: key, revenue: row?.revenue ?? 0, orders: row?.orders ?? 0 });
  }

  const totalRevenue = revenueAgg[0]?.revenue ?? 0;
  const paidOrders = revenueAgg[0]?.count ?? 0;
  const ordersByStatus = Object.fromEntries(statusAgg.map((r) => [r._id, r.count]));

  return {
    revenue: {
      total: totalRevenue,
      paidOrders,
      averageOrderValue: paidOrders ? Math.round(totalRevenue / paidOrders) : 0,
      last30Days: recentRevenueAgg[0]?.revenue ?? 0,
      last30DaysOrders: recentRevenueAgg[0]?.count ?? 0,
      previous30Days: priorRevenueAgg[0]?.revenue ?? 0,
      previous30DaysOrders: priorRevenueAgg[0]?.count ?? 0,
    },
    trends: {
      revenue: percentChange(
        recentRevenueAgg[0]?.revenue ?? 0,
        priorRevenueAgg[0]?.revenue ?? 0,
      ),
      orders: percentChange(
        recentRevenueAgg[0]?.count ?? 0,
        priorRevenueAgg[0]?.count ?? 0,
      ),
    },
    counts: {
      orders: Object.values(ordersByStatus).reduce((a, b) => a + b, 0),
      ordersByStatus,
      products: productCounts[0]?.total ?? 0,
      activeProducts: productCounts[0]?.active ?? 0,
      reviews: reviewCount,
      users: userCount,
    },
    salesByDay,
    lowStockThreshold: LOW_STOCK_THRESHOLD,
    lowStock: lowStockDocs.map((p) => ({
      id: String(p._id),
      title: p.title,
      slug: p.slug,
      category: p.category,
      image: p.image ?? "",
      totalStock: p.totalStock,
      variants: p.variants ?? [],
    })),
    recentOrders: await attachCustomerEmails(recentOrders.map(serializeOrder)),
  };
}

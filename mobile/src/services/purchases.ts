/** Public store metadata must come from StoreKit/Google Play, never invented prices. */
export type StoreProduct = { id: string; localizedPrice: string; title: string };
export type VerifiedEntitlements = { credits: number; premiumTemplateIds: string[] };
/** A production adapter sends signed store transactions to the backend for verification.
 * Credit consumption, refunds and restore reconciliation must be idempotent on the server.
 */
export interface PurchaseProvider {
  readonly available: boolean;
  listProducts(): Promise<StoreProduct[]>;
  purchase(productId: string): Promise<VerifiedEntitlements>;
  restore(): Promise<VerifiedEntitlements>;
}
const unavailable = async (): Promise<VerifiedEntitlements> => {
  throw new Error('Purchases are not available in this version. No payment has been taken.');
};
export const purchases: PurchaseProvider = {
  available: false,
  async listProducts() {
    return [];
  },
  purchase: unavailable,
  restore: unavailable,
};

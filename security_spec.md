# Security Specification: Vayzo Commerce & Last-Mile Delivery

## 1. Data Invariants
1. Users can only modify their own user profile document; role changes require Admin privileges.
2. Products can only be created or modified by the merchant who owns the product (`merchantId == request.auth.uid`) or an authorized Admin.
3. Orders can only be created by authenticated customers (`customerId == request.auth.uid`).
4. Order status transitions must strictly follow the allowed order state machine.
5. Delivery tasks can only be updated by the assigned rider or platform operations admin.
6. Financial ledger entries are append-only / immutable once posted.
7. Path IDs must be valid alphanumeric strings within size limits (`isValidId`).
8. The bootstrap super-administrator is `charleskabonga106@gmail.com`.

## 2. Dirty Dozen Security Attack Payloads
1. **Self-Escalation Attack**: Customer attempts to update `role: "admin"` in `/users/{userId}`.
2. **Cross-Merchant Product Hijack**: Merchant B attempts to edit or delete Product A owned by Merchant A.
3. **Ghost Field Injection**: Attempt to append `isApproved: true` or `bypassPayment: true` into an order document.
4. **Order Price Tampering**: Client attempts to create an order with `subtotal: 0.01` when items exceed K500.
5. **State Skipping Attack**: Customer attempts to directly transition order status from `PAYMENT_PENDING` to `DELIVERED`.
6. **Path Traversal / Large ID Attack**: Injecting a 2MB string as `productId` to cause resource exhaustion.
7. **Rider Earnings Modification**: Rider attempts to update `totalEarnings: 99999` on a delivery task.
8. **Unauthorized Ledger Injection**: Non-admin user attempts to create a fake refund ledger entry.
9. **Unauthenticated Order Scraping**: Guest user attempts to list all orders across all customers.
10. **Merchant Payout Spoof**: Tampering with merchant settlement balance directly from client.
11. **Review Manipulation**: Submitting a verified review without having an eligible completed order.
12. **Email Spoofing Attack**: Submitting an admin request with unverified email token.

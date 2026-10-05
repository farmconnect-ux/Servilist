# Switching on payments

Servilist takes payments through Paystack, Flutterwave, or both. Buyers choose
at checkout from whichever providers are switched on and support the listing's
currency. Until the steps below are done, checkout shows "Online payment is not
available yet" and no money can move.

There is no test or mock provider. To try payments without real money, use the
**test keys** each provider gives you; they behave like the real ones.

## 1. Choose a server secret

Make up a long random value (at least 32 characters; a password manager's
generator is ideal). It lets the app server, and nothing else, record a payment
as confirmed. Keep it private.

In Supabase, open the SQL editor and run this once, with your value:

```sql
SELECT private.set_server_secret('payments', 'your-long-random-value');
```

The database stores only a hash of it. Run it again any time to change it.

## 2. Add the settings to the new app on Vercel

Project `servilist-next`, Settings, Environment Variables:

| Name                       | Value                                             |
| :------------------------- | :------------------------------------------------ |
| `PAYMENTS_SERVER_SECRET`   | the same value as in step 1                       |
| `PAYSTACK_SECRET_KEY`      | Paystack dashboard, Settings, API Keys & Webhooks |
| `FLUTTERWAVE_SECRET_KEY`   | Flutterwave dashboard, Settings, API Keys         |
| `FLUTTERWAVE_WEBHOOK_HASH` | a second random value of your own (see step 3)    |

Leave a provider's key out to keep that provider switched off. Redeploy after
changing them.

## 3. Tell each provider where to send confirmations

- **Paystack**, Settings, API Keys & Webhooks, Webhook URL:
  `https://<your-app-address>/api/v1/webhooks/payments/paystack`
- **Flutterwave**, Settings, Webhooks:
  URL `https://<your-app-address>/api/v1/webhooks/payments/flutterwave`,
  and set the Secret hash to the same value as `FLUTTERWAVE_WEBHOOK_HASH`.

## How a payment is confirmed

1. The buyer places an order. The database sets the price from the listing (or
   the accepted offer), adds the buyer protection fee, and holds the item for
   30 minutes.
2. The buyer is sent to the provider's own payment page for that exact amount.
3. When the provider reports back (by webhook, and again when the buyer
   returns), the server asks the provider directly what was charged. The
   database marks the order paid only if the amount and currency match.
4. The buyer receives a 6-digit handover code. The seller enters it at handover
   to complete the order.

A wrong amount, a second charge for the same order, or a payment that arrives
after the order closed is never treated as a normal payment: it is recorded as
needing a refund and written to the audit log.

## Fees

Fees are settings in the `platform_settings` table, in basis points (200 = 2%):

- `buyer_protection_fee_bps`, added to the buyer's total. Currently 200.
- `seller_commission_bps`, deducted from what is due to the seller. Currently 0.
- `order_payment_window_minutes`, how long an unpaid order holds the item. Currently 30.

## Not built yet

- **Paying sellers out.** A completed order records the amount due to the
  seller in the ledger. Moving that money (provider sub-accounts and split
  settlement, or transfers) needs each seller's payout details and is the next
  piece of payments work.
- **Refunds from the dashboard.** Payments marked as needing a refund are
  refunded from the provider's own dashboard for now.
- **Disputes.** They open with the moderation tools in Sprint 5.

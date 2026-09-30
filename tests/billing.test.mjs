import { test } from 'node:test';
import assert from 'node:assert/strict';
import { billingConfig } from '../billing/config.mjs';
import { paymentReadiness, reconcilePayment, domesticInvoiceDraft } from '../billing/accounting.mjs';

const confirmedTax = structuredClone(billingConfig);
confirmedTax.tax.inpsSurchargeRate = 0;
confirmedTax.tax.stampChargedToCustomer = false;

test('incomplete merchant cannot activate payments with a frontend flag', () => {
  const config = structuredClone(billingConfig);
  config.launch.paymentsEnabled = true;
  assert.equal(paymentReadiness(config).ready, false);
  assert.ok(paymentReadiness(config).missing.includes('launch.merchantDetailsConfirmed'));
});
test('unconfirmed surcharge does not become an automatic 4% charge', () => {
  assert.throws(() => domesticInvoiceDraft({ serviceCents: 1999 }), /Confirm surcharge/);
});
test('stamp duty threshold is strictly greater than 77.47 euros', () => {
  assert.equal(domesticInvoiceDraft({ serviceCents: 7747 }, confirmedTax).stampDutyCents, 0);
  const draft = domesticInvoiceDraft({ serviceCents: 7748 }, confirmedTax);
  assert.equal(draft.stampDutyCents, 200);
  assert.equal(draft.customerTotalCents, 7748);
  confirmedTax.tax.stampChargedToCustomer = true;
  assert.equal(domesticInvoiceDraft({ serviceCents: 7748 }, confirmedTax).customerTotalCents, 7948);
  confirmedTax.tax.stampChargedToCustomer = false;
});
test('foreign tax treatment is never inherited from domestic settings', () => {
  assert.throws(() => domesticInvoiceDraft({ serviceCents: 1999, customerCountry: 'FR' }, confirmedTax), /Foreign sales/);
});
test('refunds and fees remain distinct from gross receipts', () => {
  const result = reconcilePayment({ grossCents: 1999, refundedCents: 500, feeCents: 55 });
  assert.equal(result.retainedGrossCents, 1499);
  assert.equal(result.netSettlementCents, 1444);
  assert.equal(reconcilePayment({ grossCents: 1999, refundedCents: 1999, feeCents: 55 }).netSettlementCents, -55);
  assert.throws(() => reconcilePayment({ grossCents: 1999, refundedCents: 2000 }), /Refund exceeds/);
  assert.throws(() => reconcilePayment({ grossCents: 19.99 }), /integer cents/);
});

// Preparation utilities; these do not collect money or issue fiscal invoices.
import { billingConfig } from './config.mjs';

function cents(value, label) {
  if (!Number.isSafeInteger(value) || value < 0) throw new TypeError(`${label}: expected non-negative integer cents`);
  return value;
}

export function paymentReadiness(config = billingConfig) {
  const missing = [];
  for (const key of ['legalName', 'vatNumber', 'fiscalAddress', 'supportEmail']) {
    if (typeof config.merchant[key] !== 'string' || !config.merchant[key].trim()) missing.push(`merchant.${key}`);
  }
  if (!/^\d{11}$/.test(config.merchant.vatNumber || '')) missing.push('merchant.validVatNumber');
  for (const [key, value] of Object.entries(config.launch)) {
    if (key.endsWith('Confirmed') || key.endsWith('Approved') || key.endsWith('Reviewed') || key.endsWith('Ready')) {
      if (value !== true) missing.push(`launch.${key}`);
    }
  }
  if (config.tax.inpsSurchargeRate === null) missing.push('tax.inpsSurchargeRate');
  if (typeof config.tax.stampChargedToCustomer !== 'boolean') missing.push('tax.stampChargedToCustomer');
  return { ready: config.launch.paymentsEnabled === true && missing.length === 0, missing };
}

export function reconcilePayment({ grossCents, refundedCents = 0, feeCents = 0 }) {
  cents(grossCents, 'gross'); cents(refundedCents, 'refund'); cents(feeCents, 'fee');
  if (refundedCents > grossCents) throw new RangeError('Refund exceeds gross payment');
  const retainedGrossCents = grossCents - refundedCents;
  return {
    grossCents, refundedCents, retainedGrossCents, feeCents,
    netSettlementCents: retainedGrossCents - feeCents,
    // Net settlement is not taxable revenue or disposable profit.
    status: 'reconciliation_only',
  };
}

export function domesticInvoiceDraft({ serviceCents, customerCountry = 'IT' }, config = billingConfig) {
  cents(serviceCents, 'service');
  if (customerCountry !== 'IT') throw new RangeError('Foreign sales need a separate confirmed tax treatment');
  if (config.tax.regime !== 'forfettario' || config.tax.domesticVatRate !== 0) throw new Error('Unsupported tax configuration');
  const rate = config.tax.inpsSurchargeRate;
  if (typeof rate !== 'number' || !Number.isFinite(rate) || rate < 0 || rate > 1 || typeof config.tax.stampChargedToCustomer !== 'boolean') {
    throw new Error('Confirm surcharge and stamp treatment before quoting an invoice total');
  }
  const surchargeCents = Math.round(serviceCents * rate);
  const subtotalCents = serviceCents + surchargeCents;
  if (!Number.isSafeInteger(subtotalCents)) throw new RangeError('Amount too large');
  const stampDutyCents = subtotalCents > config.tax.stampThresholdCents ? config.tax.stampDutyCents : 0;
  return {
    status: 'draft_not_sent_to_sdi', currency: 'EUR',
    serviceCents, surchargeCents, vatCents: 0, stampDutyCents,
    customerTotalCents: subtotalCents + (config.tax.stampChargedToCustomer ? stampDutyCents : 0),
    fiscalRegime: config.tax.domesticInvoiceRegime, nature: config.tax.domesticInvoiceNature,
    legalNote: 'Operazione senza applicazione dell’IVA ai sensi dell’art. 1, commi 54–89, L. 190/2014.',
  };
}

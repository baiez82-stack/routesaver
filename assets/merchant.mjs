import { billingConfig } from '../billing/config.mjs';
const { legalName, vatNumber } = billingConfig.merchant;
for (const element of document.querySelectorAll('[data-merchant]')) {
  element.textContent = vatNumber ? `${legalName} · P. IVA ${vatNumber}` : `${legalName} · dati fiscali commerciali in preparazione`;
}

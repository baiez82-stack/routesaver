// Public preparation only. No credentials, customer records or tax code here.
export const billingConfig = {
  merchant: {
    legalName: 'Samuele Baietta',
    brand: 'RouteSaver',
    legalForm: 'individual',
    country: 'IT',
    vatNumber: null,
    fiscalAddress: null,
    sourceDocumentDate: '2024-04-30',
    supportEmail: 'dovesibaeccociqua@gmail.com',
  },
  tax: {
    regime: 'forfettario',
    domesticInvoiceRegime: 'RF19',
    domesticInvoiceNature: 'N2.2',
    domesticVatRate: 0,
    stampThresholdCents: 7747,
    stampDutyCents: 200,
    // Neither the surcharge nor who bears stamp duty has been approved.
    inpsSurchargeRate: null,
    stampChargedToCustomer: null,
  },
  launch: {
    paymentsEnabled: false,
    allowedCustomerCountries: ['IT'],
    fiscalTreatmentConfirmed: false,
    merchantDetailsConfirmed: false,
    activityCompatibilityConfirmed: false,
    commercialTermsApproved: false,
    providerPrivacyReviewed: false,
    commercialDataLicensesConfirmed: false,
    invoicingProviderReady: false,
    verifiedWebhookBackendReady: false,
  },
};

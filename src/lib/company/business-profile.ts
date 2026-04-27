export const companyBusinessProfile = {
  name: "Cattle Guard Forms",
  statementDescriptor: "CATTLE GUARD FORMS",
  supportEmail: "support@cattleguardforms.com",
  ordersEmail: "orders@cattleguardforms.com",
  address: {
    line1: "1070 Montgomery Rd",
    line2: "Unit C #2047",
    city: "Altamonte Springs",
    state: "FL",
    postalCode: "32714",
    country: "United States",
  },
};

export function formatCompanyAddress() {
  const { address } = companyBusinessProfile;
  return [
    address.line1,
    address.line2,
    `${address.city}, ${address.state} ${address.postalCode}`,
    address.country,
  ].join("\n");
}

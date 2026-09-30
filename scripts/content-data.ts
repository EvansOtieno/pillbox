/** Fictional site content for the Afya Corner demo: page text, delivery areas and FAQs. */

export const pageText = {
  about_text: `Afya Corner is a neighbourhood pharmacy in Kilimani, Nairobi. Our registered pharmacists help you choose the right medicine, answer questions on WhatsApp and deliver across the city.

We keep everyday medicines, vitamins, skin care and baby essentials in stock, and we are happy to talk through prescriptions with you.

(Afya Corner is a fictional pharmacy: this site is a portfolio demo and does not sell anything.)`,
  delivery_intro: `We deliver across Nairobi, and you can always collect your order from our Kilimani pharmacy for free. You pay when your order arrives, by M-Pesa or cash.`,
  delivery_times: `Orders confirmed before 5:00 PM are delivered the same day. Orders confirmed later go out the next morning.

Pharmacy-only medicines are dispatched once our pharmacist has spoken to you.`,
  terms_text: `SAMPLE TEXT for a portfolio demo.

Orders placed on this site are requests: a pharmacist confirms each order before it is dispatched. Prescription-only medicines are never sold online. Prices may change until your order is confirmed.`,
  privacy_text: `SAMPLE TEXT for a portfolio demo.

We use your name, phone number and address only to confirm and deliver your order. We do not sell your data. Contact us to see or delete the details we hold about you.`,
};

/** [name, fee in KES, is pick-up] */
export const deliveryAreas: Array<[string, number, boolean]> = [
  ["Pick-up at our Kilimani pharmacy", 0, true],
  ["Kilimani", 150, false],
  ["Hurlingham", 150, false],
  ["Kileleshwa", 200, false],
  ["Upper Hill", 250, false],
  ["Lavington", 250, false],
  ["Westlands", 350, false],
  ["Parklands", 350, false],
  ["South B", 350, false],
  ["Lang'ata", 400, false],
  ["Kasarani", 450, false],
  ["Karen", 500, false],
  ["Ruaka", 500, false],
];

export const faqs: Array<[string, string]> = [
  [
    "How do I order?",
    "Add products to your cart and check out. We save your order, then you send it to our pharmacist on WhatsApp (or call us) to confirm.",
  ],
  ["How much is delivery?", "It depends on where you are:\n\n{delivery_fees}\n\nPick-up from our pharmacy is always free."],
  ["When are you open?", "{hours}\n\nYou can send us a WhatsApp message any time; we reply when we open."],
  ["How do I pay?", "You pay on delivery or at pick-up, by M-Pesa or cash. Nothing is charged online."],
  [
    "Can I buy prescription medicines?",
    "Prescription-only medicines can't be ordered online. Tap \"Consult pharmacist\" on the product and we will guide you.",
  ],
  [
    "What does \"pharmacy-only\" mean?",
    "Some medicines can be sold without a prescription but only after a pharmacist has checked they are right for you. We will contact you before dispatch.",
  ],
];

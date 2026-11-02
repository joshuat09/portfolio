/* Mock data for the complaint-handling demo. All people, orders and policies are fictional. */
(function (root) {
  'use strict';

  const policy = {
    returnWindowDays: 30,
    lateAfterDays: 0,
    autoReplacementMaxValue: 100,
    allowedResolveActions: ['send_tracking_update', 'arrange_replacement', 'send_information']
  };

  const customers = {
    'C-201': { id: 'C-201', name: 'Amelia Hart', tier: 'standard', vulnerable: false },
    'C-202': { id: 'C-202', name: 'Ravi Patel', tier: 'priority', vulnerable: false },
    'C-203': { id: 'C-203', name: 'Eleanor Gray', tier: 'standard', vulnerable: true },
    'C-204': { id: 'C-204', name: 'Tom Brennan', tier: 'standard', vulnerable: false }
  };

  // daysAgo / dueDaysAgo are relative so the demo never goes stale.
  const orders = {
    'ORD-1001': { id: 'ORD-1001', customerId: 'C-201', item: 'Wireless earbuds', value: 34.99, status: 'in_transit', carrier: 'ParcelPoint', dueDaysAgo: 3 },
    'ORD-1002': { id: 'ORD-1002', customerId: 'C-202', item: 'Ceramic desk lamp', value: 42.0, status: 'delivered', deliveredDaysAgo: 2 },
    'ORD-1003': { id: 'ORD-1003', customerId: 'C-204', item: 'Ultrawide monitor', value: 389.0, status: 'delivered', deliveredDaysAgo: 4 },
    'ORD-1004': { id: 'ORD-1004', customerId: 'C-201', item: 'Trail running shoes', value: 85.0, status: 'in_transit', carrier: 'ParcelPoint', dueDaysAgo: 6 },
    'ORD-1005': { id: 'ORD-1005', customerId: 'C-203', item: 'Annual subscription box', value: 59.0, status: 'delivered', deliveredDaysAgo: 12 },
    'ORD-1006': { id: 'ORD-1006', customerId: 'C-204', item: 'Bluetooth speaker', value: 64.5, status: 'delivered', deliveredDaysAgo: 62 }
  };

  const scenarios = [
    { id: 'late', label: 'Late delivery', text: 'My order ORD-1001 was meant to arrive three days ago and it still hasn\'t turned up. Where is it?' },
    { id: 'damaged', label: 'Damaged item', text: 'The lamp from order ORD-1002 arrived smashed. Can you send a replacement please?' },
    { id: 'highvalue', label: 'High-value replacement', text: 'My monitor (ORD-1003) arrived with a cracked screen. I need a replacement sent out.' },
    { id: 'vague', label: 'Vague complaint', text: 'Honestly your service is terrible and nobody ever helps me.' },
    { id: 'unknown', label: 'Unknown order', text: 'Order ORD-9999 never arrived and I am very frustrated.' },
    { id: 'legal', label: 'Legal threat', text: 'ORD-1004 is a week late. If I don\'t hear back today I will be speaking to my solicitor and trading standards.' },
    { id: 'vulnerable', label: 'Vulnerable customer', text: 'I was charged twice for ORD-1005 and I can\'t afford this right now, I\'m really struggling.' },
    { id: 'refund', label: 'Refund, outside window', text: 'I want my money back for the speaker on ORD-1006, it stopped working.' }
  ];

  const api = { policy, customers, orders, scenarios };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.ComplaintData = api;
})(typeof window !== 'undefined' ? window : globalThis);

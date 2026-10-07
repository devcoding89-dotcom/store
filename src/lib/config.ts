export const MARKETPLACE_CONFIG = {
  name: 'SHOPLY TOWN',
  tagline: 'One market. Every corner of the city.',
  orderPrefix: 'ORD',
  currency: '₦',
  ownerWhatsApp: import.meta.env.VITE_OWNER_WHATSAPP || '2349045660915',
  concierge: {
    name: 'Amaka',
    role: 'Personal Shopper & Store Concierge',
    greeting: "Hello there! 👋 I'm Amaka, your personal market shopper. Looking for something specific, a gift, or need to verify sizes and same-day delivery? Let me know and I'll check our live stalls for you right away!",
    status: 'Online · Active at stalls',
  },
  support: {
    phone: '+234 800 000 0000',
    whatsapp: 'https://wa.me/2348000000000?text=Hello%2C%20I%20want%20to%20list%20my%20shop%20on%20SHOPLY TOWN',
    email: 'hello@townsquare.market',
  },
  deliveryZones: [
    { zone: 'Zone 1 (Central / Downtown)', fee: 800, time: '2–4 hours' },
    { zone: 'Zone 2 (Inner Ring & Suburbs)', fee: 1200, time: 'Same day' },
    { zone: 'Zone 3 (Outer Districts)', fee: 1800, time: 'Same day / Next morning' },
    { zone: 'Zone 4 (Inter-city)', fee: 2500, time: '24–48 hours' },
  ],
}

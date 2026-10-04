export type Product = {
  id: string
  name: string
  price: number
  seller: string
  area: string
  image: string
  category: string
  badge?: string
}

export type CartItem = {
  product: Product
  qty: number
}

export const CATEGORIES = [
  { name: 'Fashion & Tailoring', image: '/img/ankara-dress.jpg', stalls: 4 },
  { name: 'Aso-Oke & Textiles', image: '/img/aso-oke.jpg', stalls: 3 },
  { name: 'Food & Provisions', image: '/img/kilishi.jpg', stalls: 6 },
  { name: 'Beauty & Skincare', image: '/img/shea-butter.jpg', stalls: 3 },
  { name: 'Leather & Crafts', image: '/img/sandals.jpg', stalls: 2 },
  { name: 'Phones & Accessories', image: '/img/charger.jpg', stalls: 3 },
  { name: 'Home & Living', image: '/img/pillows.jpg', stalls: 2 },
  { name: 'Jewellery', image: '/img/jewelry.jpg', stalls: 2 },
] as const

export const PRODUCTS: Product[] = [
  {
    id: 'ankara-maxi-dress',
    name: 'Ankara maxi dress, teal & orange',
    price: 18500,
    seller: 'Adire & Co.',
    area: 'West District',
    image: '/img/ankara-dress.jpg',
    category: 'Fashion & Tailoring',
    badge: 'NEW',
  },
  {
    id: 'aso-oke-gele',
    name: 'Aso-oke gele, burgundy & gold',
    price: 7200,
    seller: 'Heritage Aso-Oke House',
    area: 'Old Market Quarter',
    image: '/img/aso-oke.jpg',
    category: 'Aso-Oke & Textiles',
    badge: 'SELLING FAST',
  },
  {
    id: 'raw-shea-butter',
    name: 'Raw shea butter, 500ml calabash',
    price: 3800,
    seller: 'Olooru Naturals',
    area: 'Garden District',
    image: '/img/shea-butter.jpg',
    category: 'Beauty & Skincare',
  },
  {
    id: 'clay-cooking-pot',
    name: 'Hand-thrown clay cooking pot',
    price: 12000,
    seller: 'Artisan Pottery Co-op',
    area: 'Artisan Quarter',
    image: '/img/clay-pot.jpg',
    category: 'Home & Living',
  },
  {
    id: 'kilishi-250g',
    name: 'Kilishi, spiced dried beef 250g',
    price: 4500,
    seller: 'Prime Kilishi House',
    area: 'Central Market',
    image: '/img/kilishi.jpg',
    category: 'Food & Provisions',
    badge: 'FEW LEFT',
  },
  {
    id: 'leather-half-shoes',
    name: 'Hand-stitched leather half shoes, tan',
    price: 25000,
    seller: 'Mubarak Leatherworks',
    area: 'Craftsmen Lane',
    image: '/img/sandals.jpg',
    category: 'Leather & Crafts',
  },
  {
    id: 'fast-charger',
    name: '33W fast charger + braided cable',
    price: 9500,
    seller: 'BrightTech Phones',
    area: 'Tech Boulevard',
    image: '/img/charger.jpg',
    category: 'Phones & Accessories',
  },
  {
    id: 'smoked-catfish',
    name: 'Smoked catfish, medium',
    price: 6000,
    seller: 'Harbour Fish Depot',
    area: 'Riverside Market',
    image: '/img/catfish.jpg',
    category: 'Food & Provisions',
  },
  {
    id: 'gold-pendant-set',
    name: 'Gold-plated pendant & earrings set',
    price: 15000,
    seller: "Alhaja's Treasures",
    area: 'Old Market Quarter',
    image: '/img/jewelry.jpg',
    category: 'Jewellery',
  },
  {
    id: 'guinea-brocade',
    name: 'Guinea brocade, white — 5 yards',
    price: 22000,
    seller: 'Sulu Textiles',
    area: 'Textile Haven',
    image: '/img/brocade.jpg',
    category: 'Aso-Oke & Textiles',
  },
  {
    id: 'oud-perfume-oil',
    name: 'Perfume oil “Royal Amber & Oud”, 12ml',
    price: 5500,
    seller: 'Marhaba Scents',
    area: 'Metro Square',
    image: '/img/perfume-oil.jpg',
    category: 'Beauty & Skincare',
    badge: 'NEW',
  },
  {
    id: 'ankara-throw-pillows',
    name: 'Ankara throw pillows, pair',
    price: 8000,
    seller: 'Iyabo Home',
    area: 'Uptown Plaza',
    image: '/img/pillows.jpg',
    category: 'Home & Living',
  },
]

export const SELLER_MARQUEE = [
  'ADIRE & CO. — WEST DISTRICT',
  'HERITAGE ASO-OKE — OLD MARKET',
  'OLOORU NATURALS — GARDEN DISTRICT',
  'ARTISAN POTTERY — ARTISAN QUARTER',
  'PRIME KILISHI — CENTRAL MARKET',
  'MUBARAK LEATHERWORKS — CRAFTSMEN LANE',
  'BRIGHTTECH PHONES — TECH BOULEVARD',
  'HARBOUR FISH DEPOT — RIVERSIDE',
  "ALHAJA'S TREASURES — OLD MARKET",
  'SULU TEXTILES — TEXTILE HAVEN',
  'MARHABA SCENTS — METRO SQUARE',
  'IYABO HOME — UPTOWN PLAZA',
]

export function formatNaira(n: number): string {
  return '₦' + n.toLocaleString('en-US')
}

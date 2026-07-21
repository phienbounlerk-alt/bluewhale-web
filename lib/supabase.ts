import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://tagjwcqulpphuhppwhio.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhZ2p3Y3F1bHBwaHVocHB3aGlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2Njg5NDIsImV4cCI6MjA5NjI0NDk0Mn0.WaTAhOMqn6GAb8vUHalMOY3YeaoIoWIy6gK5m1u1px0'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Product = {
  id: string
  name: string
  description: string
  price: number
  discount_price?: number
  image_url?: string
  images?: string[]
  video_url?: string
  category: string
  stock: number
  rating?: number
  review_count?: number
  is_cod?: boolean
  is_free_shipping?: boolean
  sold_count?: number
  variant_options?: Record<string, string[]>
}

export type ProductVariant = {
  id: string
  product_id: string
  options: Record<string, string>
  price?: number
  stock: number
}

export type CartItem = {
  product: Product
  quantity: number
}

// Seed products (same as mobile app)
export const seedProducts: Product[] = [
  { id: 's1',  name: 'ເສື້ອຍືດ BlueWhale',    description: 'ເສື້ອຍືດຄຸນນະພາບສູງ cotton 100%',    price: 120000,  discount_price: 89000,   image_url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600', category: 'ເສື້ອຜ້າ',           stock: 50,  rating: 4.8, review_count: 245 },
  { id: 's2',  name: 'ໂທລະສັບ Samsung A55',   description: 'ໂທລະສັບ Android ລຸ້ນໃໝ່ 256GB',      price: 4500000, discount_price: 3990000, image_url: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=600', category: 'ອີເລັກໂທຣນິກ',      stock: 12,  rating: 4.6, review_count: 89  },
  { id: 's3',  name: 'ກາເຟລາວ Bolaven',        description: 'ກາເຟດຳລາວແທ້ຈາກທົ່ງໂບລາເວນ 200g',  price: 55000,   discount_price: 45000,   image_url: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=600', category: 'ອາຫານ & ເຄື່ອງດື່ມ', stock: 200, rating: 4.9, review_count: 512 },
  { id: 's4',  name: 'ໝໍ້ຫຸງເຂົ້າ Panasonic', description: 'ໝໍ້ຫຸງເຂົ້າໄຟຟ້າ 1.8L ລຸ້ນ Premium', price: 850000,  discount_price: 720000,  image_url: 'https://images.unsplash.com/photo-1585664811087-47f65abbad64?w=600', category: 'ຂອງໃຊ້ໃນບ້ານ',      stock: 20,  rating: 4.7, review_count: 156 },
  { id: 's5',  name: 'ຄຣີມບຳລຸງຜິວ Korean',   description: 'ຄຣີມບຳລຸງຜິວໜ້າ K-Beauty 50ml',     price: 180000,  discount_price: 149000,  image_url: 'https://images.unsplash.com/photo-1556228852-6d35a585d566?w=600', category: 'ຄວາມງາມ',            stock: 75,  rating: 4.5, review_count: 334 },
  { id: 's6',  name: 'ກາງເກງຢີນ Slim Fit',     description: 'ກາງເກງຢີນທັນສະໄໝ Slim Fit',            price: 250000,  discount_price: 199000,  image_url: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=600', category: 'ເສື້ອຜ້າ',           stock: 35,  rating: 4.4, review_count: 178 },
  { id: 's7',  name: 'Laptop Lenovo IdeaPad',  description: 'Laptop Core i5 RAM 16GB SSD 512GB',   price: 9800000, discount_price: 8500000, image_url: 'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=600', category: 'ອີເລັກໂທຣນິກ',      stock: 5,   rating: 4.6, review_count: 67  },
  { id: 's8',  name: 'ແຊມພູ Dove 700ml',       description: 'ແຊມພູບຳລຸງຜົມ Dove ຂວດໃຫຍ່',          price: 65000,   discount_price: 52000,   image_url: 'https://images.unsplash.com/photo-1631729371254-42c2892f0e6e?w=600', category: 'ຄວາມງາມ',            stock: 100, rating: 4.3, review_count: 423 },
  { id: 's9',  name: 'ເຂົ້າໜຽວ ນາ 5kg',        description: 'ເຂົ້າໜຽວລາວໃໝ່ ຄຸນນະພາບດີ',            price: 45000,                            image_url: 'https://images.unsplash.com/photo-1536304993881-ff86e0c9e75a?w=600', category: 'ອາຫານ & ເຄື່ອງດື່ມ', stock: 500, rating: 4.8, review_count: 789 },
  { id: 's10', name: 'Nike Air Force 1',        description: 'ລອງເກີບ Nike Air Force 1 ສີຂາວ',       price: 1200000, discount_price: 990000,  image_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600', category: 'ເສື້ອຜ້າ',           stock: 18,  rating: 4.7, review_count: 234 },
  { id: 's11', name: 'AirPods Pro 2',           description: 'ຫູຟັງ Apple AirPods Pro Gen 2',         price: 4200000, discount_price: 3800000, image_url: 'https://images.unsplash.com/photo-1588423771073-b8903fbb85b5?w=600', category: 'ອີເລັກໂທຣນິກ',      stock: 8,   rating: 4.9, review_count: 445 },
  { id: 's12', name: 'ຊຸດເຄື່ອງນອນ Linen',     description: 'ຜ້າປູທີ່ນອນ Linen ສີໄຂ່ ນຸ່ມສະບາຍ',  price: 350000,  discount_price: 280000,  image_url: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600', category: 'ຂອງໃຊ້ໃນບ້ານ',      stock: 30,  rating: 4.5, review_count: 92  },
]

export async function getProducts(category?: string): Promise<Product[]> {
  try {
    let query = supabase.from('products').select('*')
    if (category && category !== 'ທັງໝົດ') query = query.eq('category', category)
    const { data } = await query.order('created_at', { ascending: false })
    if (data && data.length > 0) return data
    return category && category !== 'ທັງໝົດ'
      ? seedProducts.filter(p => p.category === category)
      : seedProducts
  } catch {
    return category && category !== 'ທັງໝົດ'
      ? seedProducts.filter(p => p.category === category)
      : seedProducts
  }
}

export async function getProduct(id: string): Promise<Product | null> {
  try {
    const { data } = await supabase.from('products').select('*').eq('id', id).single()
    if (data) return data
  } catch {}
  return seedProducts.find(p => p.id === id) ?? null
}

export function fmt(n: number) {
  return '₭' + n.toLocaleString('en')
}

export function discountPct(p: Product) {
  if (!p.discount_price) return 0
  return Math.round((1 - p.discount_price / p.price) * 100)
}

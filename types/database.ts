export type UserRole = 'super_admin' | 'org_admin' | 'gerente' | 'cajera' | 'cocina'

export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled'

export type OrderType = 'dine_in' | 'pickup'

export type TableStatus = 'available' | 'occupied' | 'reserved'

export interface Organization {
  id: string
  name: string
  slug: string
  logo_url: string | null
  created_at: string
  updated_at: string
}

export interface Restaurant {
  id: string
  org_id: string
  name: string
  slug: string
  address: string | null
  phone: string | null
  logo_url: string | null
  cover_url: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface UserProfile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface UserOrganizationRole {
  id: string
  user_id: string
  org_id: string
  role: Extract<UserRole, 'super_admin' | 'org_admin'>
  created_at: string
}

export interface UserRestaurantRole {
  id: string
  user_id: string
  restaurant_id: string
  role: Extract<UserRole, 'gerente' | 'cajera' | 'cocina'>
  created_at: string
}

export interface Category {
  id: string
  restaurant_id: string
  name: string
  description: string | null
  sort_order: number
  is_active: boolean
  created_at: string
}

export interface MenuItem {
  id: string
  restaurant_id: string
  category_id: string
  name: string
  description: string | null
  price: number
  image_url: string | null
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface RestaurantTable {
  id: string
  restaurant_id: string
  number: string
  capacity: number
  status: TableStatus
  qr_code: string | null
  created_at: string
}

export interface Order {
  id: string
  restaurant_id: string
  table_id: string | null
  order_number: string
  type: OrderType
  status: OrderStatus
  customer_name: string | null
  customer_phone: string | null
  notes: string | null
  total: number
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface OrderItem {
  id: string
  order_id: string
  menu_item_id: string
  quantity: number
  unit_price: number
  notes: string | null
  created_at: string
}

export interface OrderItemWithDetails extends OrderItem {
  menu_item: MenuItem
}

export interface OrderWithDetails extends Order {
  items: OrderItemWithDetails[]
  table: RestaurantTable | null
}

export interface UserWithRoles extends UserProfile {
  org_roles: UserOrganizationRole[]
  restaurant_roles: UserRestaurantRole[]
}

export interface OrganizationSettings {
  id: string
  org_id: string
  stripe_publishable_key: string | null
  stripe_secret_key: string | null
  stripe_webhook_secret: string | null
  stripe_enabled: boolean
  created_at: string
  updated_at: string
}

export interface RestaurantSettings {
  id: string
  restaurant_id: string
  ticket_header: string | null
  ticket_footer: string | null
  ticket_show_logo: boolean
  ticket_show_address: boolean
  ticket_show_phone: boolean
  created_at: string
  updated_at: string
}

export interface WebhookEndpoint {
  id: string
  restaurant_id: string
  url: string
  events: string[]
  is_active: boolean
  secret: string
  created_at: string
}

export type PaymentPlan = 'transferencia' | 'anticipo' | 'efectivo';
export type DeliveryMethod = 'recoger' | 'domicilio' | 'paqueteria';
export type OrderStatus =
  | 'por_confirmar' | 'confirmado' | 'en_transito' | 'espera' | 'recibido'
  | 'preparando' | 'enviado' | 'entregado' | 'cancelado';
export type PaymentStatus = 'pendiente' | 'revision' | 'aprobado' | 'rechazado';

export interface DeliveryOption {
  enabled?: boolean;
  cost?: number | null;
  label?: string;
  details?: string;
  min_pieces?: number;
  quote?: boolean;
}

export interface Policy {
  title: string;
  items: string[];
}

export interface Company {
  id: string;
  name: string;
  slug: string;
  whatsapp: string | null;
  city: string | null;
  settings: {
    tagline?: string;
    payment_plans?: PaymentPlan[];
    max_no_shows?: number;
    delivery?: Partial<Record<DeliveryMethod, DeliveryOption>>;
    policies?: Policy[];
  };
}

export interface PaymentSettings {
  bank_name: string | null;
  beneficiary: string | null;
  clabe: string | null;
  account_number: string | null;
  instructions: string | null;
}

export interface Variant {
  id: string;
  name: string;
  kind: 'color' | 'talla';
  stock_qty: number | null;
  reserved_qty: number;
  position: number;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  price: number;
  goal_qty: number;
  reserved_qty: number;
  max_per_customer: number | null;
  status: string;
  expected_arrival: string | null;
  details: Record<string, string>;
  product_variants: Variant[];
  product_images: { storage_path: string; alt: string | null; position: number }[];
}

export interface Customer {
  id: string;
  full_name: string;
  business_name: string | null;
  whatsapp: string;
  no_show_count: number;
  status: string;
}

export interface OrderItem {
  id?: string;
  qty: number;
  unit_price: number;
  subtotal?: number;
  product_name: string;
  variant_name: string | null;
  sku?: string;
  product_id?: string;
}

export interface Payment {
  id: string;
  amount_expected: number;
  amount_reported: number | null;
  proof_path: string | null;
  status: PaymentStatus;
  rejection_reason: string | null;
  created_at: string;
  bank?: string | null;
  reference?: string | null;
}

export interface Order {
  id: string;
  number: number;
  status: OrderStatus;
  status_reason: string | null;
  payment_status: PaymentStatus;
  payment_plan: PaymentPlan | null;
  delivery_method: DeliveryMethod | null;
  subtotal: number;
  shipping_cost: number;
  total: number;
  deposit_amount: number | null;
  amount_paid: number;
  payment_due_at: string | null;
  address_snapshot: Record<string, string> | null;
  delivery_notes: string | null;
  created_at: string;
  order_items: OrderItem[];
  payments?: Payment[];
  shipments?: { carrier: string; tracking_number: string; shipped_on: string; status: string }[];
  customers?: { full_name: string; whatsapp: string; no_show_count: number; business_name: string | null };
}

export interface ActivityEvent {
  id: number;
  kind: string;
  title: string;
  detail: string | null;
  actor_label: string | null;
  created_at: string;
}

export interface CartItem {
  productId: string;
  variantId: string | null;
  sku: string;
  name: string;
  size: string | null;
  price: number;
  image: string | null;
  qty: number;
}

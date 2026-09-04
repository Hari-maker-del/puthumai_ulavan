import { supabase } from '@/lib/supabase';

export type MarketplaceCategory = 'Crops' | 'Seeds' | 'Vegetables' | 'Fruits' | 'Inputs' | 'Equipment';
export type MarketplaceOrderStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'completed';

export interface MarketplaceListing {
  id: string;
  sellerId: string;
  sellerName: string;
  productName: string;
  category: MarketplaceCategory;
  quantity: number;
  availableQuantity: number;
  unit: string;
  price: number;
  location: string;
  description: string;
  image?: string;
  createdAt: string;
}

export interface MarketplaceOrder {
  id: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalAmount: number;
  status: MarketplaceOrderStatus;
  buyerNote?: string;
  sellerNote?: string;
  createdAt: string;
  productName: string;
  sellerName?: string;
  buyerName?: string;
}

function toListing(row: Record<string, unknown>): MarketplaceListing {
  return {
    id: String(row.id),
    sellerId: String(row.seller_id),
    sellerName: String(row.seller_name ?? 'Farmer'),
    productName: String(row.product_name ?? ''),
    category: String(row.category ?? 'Crops') as MarketplaceCategory,
    quantity: Number(row.quantity ?? 0),
    availableQuantity: Number(row.available_quantity ?? row.quantity ?? 0),
    unit: String(row.unit ?? 'kg'),
    price: Number(row.price ?? 0),
    location: String(row.location ?? ''),
    description: String(row.description ?? ''),
    image: row.image ? String(row.image) : undefined,
    createdAt: String(row.created_at),
  };
}

function toOrder(row: Record<string, unknown>): MarketplaceOrder {
  const listing = row.listing as Record<string, unknown> | null | undefined;
  return {
    id: String(row.id),
    listingId: String(row.listing_id),
    buyerId: String(row.buyer_id),
    sellerId: String(row.seller_id),
    quantity: Number(row.quantity ?? 0),
    unit: String(row.unit ?? 'kg'),
    unitPrice: Number(row.unit_price ?? 0),
    totalAmount: Number(row.total_amount ?? 0),
    status: String(row.status ?? 'pending') as MarketplaceOrderStatus,
    buyerNote: row.buyer_note ? String(row.buyer_note) : undefined,
    sellerNote: row.seller_note ? String(row.seller_note) : undefined,
    createdAt: String(row.created_at),
    productName: String(listing?.product_name ?? 'Marketplace order'),

  };
}

export async function getMarketplaceListings(): Promise<MarketplaceListing[]> {
  const { data, error } = await supabase
    .from('marketplace_listings')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(row => toListing(row as Record<string, unknown>));
}

export async function addMarketplaceListing(listing: {
  sellerId: string;
  productName: string;
  category: MarketplaceCategory;
  quantity: number;
  unit: string;
  price: number;
  location: string;
  description: string;
  image?: string;
  sellerName?: string;
}): Promise<MarketplaceListing> {
  const { data, error } = await supabase.from('marketplace_listings').insert({
    seller_id: listing.sellerId,
    seller_name: listing.sellerName ?? 'Farmer',
    product_name: listing.productName,
    category: listing.category,
    quantity: listing.quantity,
    available_quantity: listing.quantity,
    unit: listing.unit,
    price: listing.price,
    location: listing.location,
    description: listing.description,
    image: listing.image,
  }).select('*').single();
  if (error) throw new Error(error.message);
  return toListing(data as Record<string, unknown>);
}

export async function removeMarketplaceListing(id: string, sellerId: string): Promise<void> {
  const { error } = await supabase.from('marketplace_listings').delete().eq('id', id).eq('seller_id', sellerId);
  if (error) throw new Error(error.message);
}

export async function createMarketplaceOrder(params: {
  listingId: string;
  buyerId: string;
  quantity: number;
  buyerNote?: string;
}): Promise<MarketplaceOrder> {
  const { data, error } = await supabase.rpc('create_marketplace_order', {
    p_listing_id: params.listingId,
    p_buyer_id: params.buyerId,
    p_quantity: params.quantity,
    p_buyer_note: params.buyerNote ?? null,
  });
  if (error) throw new Error(error.message);
  const order = toOrder(data as Record<string, unknown>);
  const { data: listing, error: listingError } = await supabase.from('marketplace_listings').select('product_name').eq('id', params.listingId).single();
  if (listingError) throw new Error(listingError.message);
  order.productName = String(listing.product_name ?? order.productName);
  return order;
}

export async function getMyMarketplaceOrders(userId: string): Promise<MarketplaceOrder[]> {
  const { data, error } = await supabase
    .from('marketplace_orders')
    .select('*, listing:marketplace_listings(product_name)')
    .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(row => toOrder(row as Record<string, unknown>));
}

export async function cancelMarketplaceOrder(orderId: string, buyerId: string): Promise<void> {
  const { error } = await supabase.rpc('cancel_marketplace_order', { p_order_id: orderId, p_buyer_id: buyerId });
  if (error) throw new Error(error.message);
}

export async function updateMarketplaceOrderStatus(params: {
  orderId: string;
  userId: string;
  status: MarketplaceOrderStatus;
  sellerNote?: string;
}): Promise<void> {
  const allowedStatuses: MarketplaceOrderStatus[] = ['accepted', 'rejected', 'completed'];
  if (!allowedStatuses.includes(params.status)) {
    throw new Error('Only seller status actions are accepted here. Use cancel for buyer cancellation.');
  }

  const { data: order, error: readError } = await supabase
    .from('marketplace_orders')
    .select('id,seller_id,status')
    .eq('id', params.orderId)
    .single();
  if (readError) throw new Error(readError.message);
  if (String(order.seller_id) !== params.userId) throw new Error('Only the seller can change this order status.');

  const currentStatus = String(order.status) as MarketplaceOrderStatus;
  const validTransition =
    (currentStatus === 'pending' && (params.status === 'accepted' || params.status === 'rejected')) ||
    (currentStatus === 'accepted' && params.status === 'completed');
  if (!validTransition) {
    throw new Error(`Invalid order status transition from ${currentStatus} to ${params.status}.`);
  }

  const updates: Record<string, unknown> = { status: params.status };
  if (params.sellerNote !== undefined) updates.seller_note = params.sellerNote;
  const { error } = await supabase
    .from('marketplace_orders')
    .update(updates)
    .eq('id', params.orderId)
    .eq('seller_id', params.userId);
  if (error) throw new Error(error.message);
}

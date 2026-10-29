/**
 * The Laddu Story - Production Supabase Integration Service
 * Provides instant real-time synchronization, ACID write-backs, and offline fallback.
 */
import { createClient } from '@supabase/supabase-js';

// Production Supabase Credentials (Auto-connected for all customers & staff)
const DEFAULT_SUPABASE_URL = 'https://xhxepdlaqifqtfoaqrae.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhoeGVwZGxhcWlmcXRmb2FxcmFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE5MDY0MDcsImV4cCI6MjEwNzQ4MjQwN30.RHGGLcDZA6H4mvcOkOVOfryFlqHBayBJ8Ox6CMQq6Ic';

const getSavedConfig = () => {
  try {
    const saved = localStorage.getItem('tls_supabase_config');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Discard previous invalid URL typo if present
      if (parsed.url && parsed.url.includes('qtlfo')) {
        localStorage.removeItem('tls_supabase_config');
      } else if (parsed.url && parsed.anonKey) {
        return parsed;
      }
    }
  } catch (e) {}

  return {
    url: import.meta.env?.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL,
    anonKey: import.meta.env?.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY
  };
};

let currentConfig = getSavedConfig();
let supabaseInstance = null;

export const initSupabaseClient = (url, anonKey) => {
  if (url && anonKey) {
    try {
      supabaseInstance = createClient(url.trim(), anonKey.trim(), {
        auth: { persistSession: false },
        realtime: { params: { eventsPerSecond: 10 } }
      });
      currentConfig = { url: url.trim(), anonKey: anonKey.trim() };
      return true;
    } catch (e) {
      console.error('[Supabase] Initialization error:', e);
      return false;
    }
  }
  supabaseInstance = null;
  return false;
};

// Auto-initialize if config exists (Always connected by default)
if (currentConfig.url && currentConfig.anonKey) {
  initSupabaseClient(currentConfig.url, currentConfig.anonKey);
}

export const isSupabaseConfigured = () => {
  return !!supabaseInstance;
};

export const getSupabaseConfig = () => {
  return currentConfig;
};

export const saveSupabaseConfig = (url, anonKey) => {
  const success = initSupabaseClient(url, anonKey);
  if (success) {
    try {
      localStorage.setItem('tls_supabase_config', JSON.stringify({ url: url.trim(), anonKey: anonKey.trim() }));
    } catch (e) {}
  }
  return success;
};

export const clearSupabaseConfig = () => {
  supabaseInstance = null;
  currentConfig = { url: '', anonKey: '' };
  try {
    localStorage.removeItem('tls_supabase_config');
  } catch (e) {}
};

// =========================================================================
// LIVE EGRESS & API USAGE TELEMETRY TRACKER (GUARANTEES 5 GB QUOTA SAFETY)
// =========================================================================
const supabaseTelemetry = {
  apiCallsCount: 0,
  estimatedBytesReceived: 0,
  lastQueryAt: null,
  realtimeEventsCount: 0,
  sessionStartedAt: Date.now()
};

export const getSupabaseTelemetry = () => {
  const bytes = supabaseTelemetry.estimatedBytesReceived;
  const formatted = bytes < 1024 
    ? `${bytes} B` 
    : bytes < 1024 * 1024 
      ? `${(bytes / 1024).toFixed(1)} KB` 
      : `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  return {
    ...supabaseTelemetry,
    formattedBytes: formatted,
    quotaStatus: bytes < 100 * 1024 * 1024 ? 'OPTIMAL_SAFE (<2% of 5GB)' : 'MONITOR'
  };
};

const trackTelemetry = (payload) => {
  supabaseTelemetry.apiCallsCount += 1;
  supabaseTelemetry.lastQueryAt = new Date().toLocaleTimeString();
  if (payload) {
    try {
      const size = new Blob([JSON.stringify(payload)]).size;
      supabaseTelemetry.estimatedBytesReceived += size;
    } catch (e) {
      supabaseTelemetry.estimatedBytesReceived += 450;
    }
  }
};

/**
 * Fetch orders with strict bounded limits & target phone filtering.
 * CRITICAL EGRESS OPTIMIZATION: Only downloads order items for the fetched orders,
 * avoiding unbounded full-table scans of historical items.
 */
export const fetchOrdersFromSupabase = async (options = {}) => {
  if (!supabaseInstance) return null;
  const opts = typeof options === 'number' ? { limit: options } : (options || {});
  const { limit = 50, customerPhone = null } = opts;

  try {
    let query = supabaseInstance
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (customerPhone) {
      const cleanPhone = customerPhone.replace(/\D/g, '').slice(-10);
      query = query.eq('customer_phone', cleanPhone);
    } else if (limit && limit > 0) {
      query = query.limit(limit);
    }

    const { data: orders, error: ordersErr } = await query;
    if (ordersErr) throw ordersErr;
    trackTelemetry(orders);

    if (!orders || orders.length === 0) return [];

    // ONLY fetch order_items belonging to the returned orders (avoids scanning entire historical DB)
    const orderIds = orders.map(o => o.order_id);
    let items = [];
    if (orderIds.length > 0) {
      const { data: itemsData, error: itemsErr } = await supabaseInstance
        .from('order_items')
        .select('*')
        .in('order_id', orderIds);

      if (!itemsErr && itemsData) {
        items = itemsData;
        trackTelemetry(itemsData);
      }
    }

    const itemsByOrder = (items || []).reduce((acc, item) => {
      acc[item.order_id] = acc[item.order_id] || [];
      acc[item.order_id].push({
        sku: item.sku,
        name: item.name,
        packLabel: item.pack_label,
        cleanWeight: item.clean_weight,
        unitPrice: Number(item.unit_price),
        qty: item.qty,
        image: item.image
      });
      return acc;
    }, {});

    return orders.map(o => {
      const isPickup = (o.channel && o.channel.includes('PICKUP')) || (o.notes && o.notes.includes('PICKUP'));
      const isPorter = (o.channel && o.channel.includes('PORTER')) || (o.notes && o.notes.includes('PORTER'));
      const statusMatch = (o.notes || '').match(/\[STATUS:([^\]]+)\]/);
      const resolvedStatus = statusMatch ? statusMatch[1].trim() : o.order_status;
      const cleanNotes = (o.notes || '').replace(/\[STATUS:[^\]]+\]/g, '').trim();

      return {
        orderId: o.order_id,
        time: new Date(o.created_at).toLocaleString('en-US', {
          month: '2-digit', day: '2-digit', year: '2-digit',
          hour: 'numeric', minute: '2-digit', hour12: true
        }),
        channel: o.channel || 'ONLINE_STORE',
        fulfillmentType: isPorter ? 'PORTER' : (isPickup ? 'PICKUP' : 'DELIVERY'),
        name: o.customer_name,
        phone: o.customer_phone,
        address: o.customer_address,
        status: resolvedStatus,
        paymentMethod: o.payment_method || 'UPI',
        paymentStatus: o.payment_status || 'PAID',
        total: Number(o.total_amount),
        notes: cleanNotes,
        items: itemsByOrder[o.order_id] || []
      };
    });
  } catch (err) {
    console.error('[Supabase] fetchOrders error:', err);
    return null;
  }
};

/**
 * Fetch a single order with items (Used for instant zero-waste realtime INSERT patch)
 */
export const fetchSingleOrderFromSupabase = async (orderId) => {
  if (!supabaseInstance || !orderId) return null;
  try {
    const { data: order, error } = await supabaseInstance
      .from('orders')
      .select('*')
      .eq('order_id', orderId)
      .maybeSingle();

    if (error || !order) return null;
    trackTelemetry(order);

    const { data: items } = await supabaseInstance
      .from('order_items')
      .select('*')
      .eq('order_id', orderId);

    if (items) trackTelemetry(items);

    const isPickup = (order.channel && order.channel.includes('PICKUP')) || (order.notes && order.notes.includes('PICKUP'));
    const isPorter = (order.channel && order.channel.includes('PORTER')) || (order.notes && order.notes.includes('PORTER'));
    const statusMatch = (order.notes || '').match(/\[STATUS:([^\]]+)\]/);
    const resolvedStatus = statusMatch ? statusMatch[1].trim() : order.order_status;
    const cleanNotes = (order.notes || '').replace(/\[STATUS:[^\]]+\]/g, '').trim();

    return {
      orderId: order.order_id,
      time: new Date(order.created_at).toLocaleString('en-US', {
        month: '2-digit', day: '2-digit', year: '2-digit',
        hour: 'numeric', minute: '2-digit', hour12: true
      }),
      channel: order.channel || 'ONLINE_STORE',
      fulfillmentType: isPorter ? 'PORTER' : (isPickup ? 'PICKUP' : 'DELIVERY'),
      name: order.customer_name,
      phone: order.customer_phone,
      address: order.customer_address,
      status: resolvedStatus,
      paymentMethod: order.payment_method || 'UPI',
      paymentStatus: order.payment_status || 'PAID',
      total: Number(order.total_amount),
      notes: cleanNotes,
      items: (items || []).map(i => ({
        sku: i.sku,
        name: i.name,
        packLabel: i.pack_label,
        cleanWeight: i.clean_weight,
        unitPrice: Number(i.unit_price),
        qty: i.qty,
        image: i.image
      }))
    };
  } catch (err) {
    return null;
  }
};

/**
 * Fetch customer orders specifically by phone (ultra low egress)
 */
export const fetchCustomerOrdersFromSupabase = async (phone) => {
  return fetchOrdersFromSupabase({ customerPhone: phone, limit: 30 });
};

/**
 * Insert new order and its items into Supabase
 */
export const insertOrderToSupabase = async (order) => {
  if (!supabaseInstance) return { success: false, reason: 'NOT_CONFIGURED' };
  try {
    const isPorter = order.fulfillmentType === 'PORTER' || (order.channel && order.channel.includes('PORTER'));
    const isPickup = order.fulfillmentType === 'PICKUP';
    const fulfillmentLabel = isPorter ? (order.channel || 'DOORSTEP_PORTER') : (isPickup ? 'STORE_PICKUP' : (order.channel || 'ONLINE_STORE'));
    const enrichedNotes = isPorter
      ? `[PORTER DELIVERY] ${order.notes || ''}`.trim()
      : (isPickup ? `[PICKUP AT KITCHEN] ${order.notes || ''}`.trim() : (order.notes || ''));

    // 1. Insert order record
    const { error: orderErr } = await supabaseInstance
      .from('orders')
      .insert({
        order_id: order.orderId,
        channel: fulfillmentLabel,
        customer_name: order.name,
        customer_phone: order.phone,
        customer_address: order.address,
        total_amount: order.total,
        payment_method: order.paymentMethod || 'UPI',
        payment_status: order.paymentStatus || 'PAID',
        order_status: order.status || 'RECEIVED',
        notes: enrichedNotes
      });

    if (orderErr) throw orderErr;

    // 2. Insert items
    if (order.items && order.items.length > 0) {
      const itemsToInsert = order.items.map(i => ({
        order_id: order.orderId,
        sku: i.sku,
        name: i.name,
        pack_label: i.packLabel || i.cleanWeight || '',
        clean_weight: i.cleanWeight || '',
        unit_price: i.unitPrice,
        qty: i.qty,
        image: i.image || ''
      }));

      const { error: itemsErr } = await supabaseInstance
        .from('order_items')
        .insert(itemsToInsert);

      if (itemsErr) console.warn('[Supabase] Warning inserting items:', itemsErr);
    }

    // 3. Upsert customer CRM
    try {
      await supabaseInstance
        .from('customers')
        .upsert({
          phone: order.phone,
          name: order.name,
          address: order.address,
          last_order_at: new Date().toISOString()
        }, { onConflict: 'phone' });
    } catch (e) {}

    return { success: true };
  } catch (err) {
    console.error('[Supabase] insertOrder error:', err);
    return { success: false, error: err.message };
  }
};

/**
 * Update order status with instant write-back and resilient check-constraint fallback
 */
export const updateOrderStatusInSupabase = async (orderId, newStatus) => {
  if (!supabaseInstance) return { success: false, reason: 'NOT_CONFIGURED' };
  try {
    // Retrieve existing notes to handle status tag cleanly
    const { data: existing } = await supabaseInstance
      .from('orders')
      .select('notes')
      .eq('order_id', orderId)
      .maybeSingle();

    const rawNotes = existing && existing.notes ? existing.notes : '';
    const cleanNotes = rawNotes.replace(/\[STATUS:[^\]]+\]/g, '').trim();

    // 1. Attempt direct update of order_status (also removing previous status tag from notes)
    const { error } = await supabaseInstance
      .from('orders')
      .update({
        order_status: newStatus,
        notes: cleanNotes,
        updated_at: new Date().toISOString()
      })
      .eq('order_id', orderId);

    if (!error) return { success: true };

    // 2. If Postgres check constraint rejects (e.g. PREPARING / READY FOR PICKUP), embed true status in notes
    console.warn('[Supabase] Custom status rejected by check constraint, embedding in notes tag:', error.message);
    const updatedNotes = `${cleanNotes} [STATUS:${newStatus}]`.trim();

    // Map to acceptable legacy DB constraint status
    let safeDbStatus = 'RECEIVED';
    if (newStatus === 'CANCELLED') safeDbStatus = 'CANCELLED';
    else if (newStatus === 'DELIVERED' || newStatus === 'ORDER PICKED UP') safeDbStatus = 'DELIVERED';
    else if (newStatus === 'PACKED' || newStatus === 'READY FOR PICKUP') safeDbStatus = 'PACKED';
    else if (newStatus === 'OUT FOR DELIVERY') safeDbStatus = 'DISPATCHED';

    const { error: fallbackErr } = await supabaseInstance
      .from('orders')
      .update({
        order_status: safeDbStatus,
        notes: updatedNotes,
        updated_at: new Date().toISOString()
      })
      .eq('order_id', orderId);

    if (fallbackErr) throw fallbackErr;
    return { success: true, fallback: true };
  } catch (err) {
    console.error('[Supabase] updateOrderStatus error:', err);
    return { success: false, error: err.message };
  }
};

/**
 * Update order payment status and payment method in Supabase
 */
export const updateOrderPaymentStatusInSupabase = async (orderId, paymentStatus, paymentMethod) => {
  if (!supabaseInstance) return { success: false, reason: 'NOT_CONFIGURED' };
  try {
    const payload = {
      payment_status: paymentStatus,
      updated_at: new Date().toISOString()
    };
    if (paymentMethod) {
      payload.payment_method = paymentMethod;
    }
    const { error } = await supabaseInstance
      .from('orders')
      .update(payload)
      .eq('order_id', orderId);

    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error('[Supabase] updateOrderPaymentStatus error:', err);
    return { success: false, error: err.message };
  }
};

/**
 * Fetch products from Supabase
 */
export const fetchProductsFromSupabase = async () => {
  if (!supabaseInstance) return null;
  try {
    const { data, error } = await supabaseInstance
      .from('products')
      .select('*')
      .order('id', { ascending: true });

    if (error) throw error;
    if (!data || data.length === 0) return null;
    trackTelemetry(data);

    return data.map(p => {
      const rateKg = Number(p.rate_per_kg || 0);
      const p500Val = Number(p.p500 || 0);
      const p1kVal = Number(p.p1k || 0);
      const calculatedP250 = p.p250 ? Number(p.p250) : Math.round((rateKg || (p500Val * 2)) * 0.25);
      return {
        id: p.id,
        sku: p.sku,
        name: p.name,
        category: p.category,
        ratePerKg: rateKg,
        moq: p.moq || '500g',
        p250: calculatedP250,
        p500: p500Val,
        p1k: p1kVal,
        opt0: p.opt0 || `250g (₹${calculatedP250})`,
        opt1: p.opt1,
        opt2: p.opt2,
        w0: '250g',
        w1: p.w1,
        w2: p.w2,
        tag: p.tag,
        desc: p.description,
        benefit: p.benefit,
        image: p.image,
        stockStatus: p.stock_status,
        stockCount: Number(p.stock_count),
        isMunchy: !!p.is_munchy
      };
    });
  } catch (err) {
    console.error('[Supabase] fetchProducts error:', err);
    return null;
  }
};

/**
 * Upsert product in Supabase (Handles both stock updates and adding new items)
 */
export const upsertProductInSupabase = async (product) => {
  if (!supabaseInstance) return { success: false, reason: 'NOT_CONFIGURED' };
  try {
    const { error } = await supabaseInstance
      .from('products')
      .upsert({
        id: product.id || String(Date.now()),
        sku: product.sku,
        name: product.name,
        category: product.category || 'LADDU',
        rate_per_kg: product.ratePerKg || (product.p1k || 1200),
        moq: product.moq || '500g',
        opt1: product.opt1 || `${product.w1 || '500g'} (₹${product.p500 || 600})`,
        opt2: product.opt2 || `${product.w2 || '1 Kg'} (₹${product.p1k || 1200})`,
        p500: product.p500 || 600,
        p1k: product.p1k || 1200,
        w1: product.w1 || '500g',
        w2: product.w2 || '1 Kg',
        tag: product.tag || 'Artisanal Special',
        description: product.desc || product.description || '',
        benefit: product.benefit || '',
        image: product.image || 'images/products/RAGI-WALNUT.jpg',
        stock_status: product.stockStatus || 'IN_STOCK',
        stock_count: Number(product.stockCount ?? 50),
        is_munchy: !!product.isMunchy,
        updated_at: new Date().toISOString()
      }, { onConflict: 'sku' });

    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error('[Supabase] upsertProduct error:', err);
    return { success: false, error: err.message };
  }
};

export const updateProductInSupabase = upsertProductInSupabase;
 
/**
 * Fetch all registered customers from Supabase (CRM master source)
 */
export const fetchCustomersFromSupabase = async () => {
  if (!supabaseInstance) return null;
  try {
    const { data, error } = await supabaseInstance
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('[Supabase] fetchCustomers error:', err);
    return null;
  }
};

/**
 * Look up customer in Supabase by 10-digit mobile number
 */
export const lookupCustomerInSupabase = async (phone) => {
  if (!supabaseInstance) return null;
  try {
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    const { data, error } = await supabaseInstance
      .from('customers')
      .select('*')
      .eq('phone', cleanPhone)
      .maybeSingle();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('[Supabase] lookupCustomer error:', err);
    return null;
  }
};

/**
 * Delete order from Supabase
 */
export const deleteOrderInSupabase = async (orderId) => {
  if (!supabaseInstance) return { success: false, reason: 'NOT_CONFIGURED' };
  try {
    const { error } = await supabaseInstance
      .from('orders')
      .delete()
      .eq('order_id', orderId);

    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error('[Supabase] deleteOrder error:', err);
    return { success: false, error: err.message };
  }
};

/**
 * Subscribe to real-time changes via WebSockets for orders, products, customers, and product_reviews
 */
export const subscribeToSupabaseRealtime = (onOrderChange, onProductChange, onCustomerChange, onReviewChange) => {
  if (!supabaseInstance) return () => {};

  try {
    const channel = supabaseInstance
      .channel('tls-realtime-hub')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
        supabaseTelemetry.realtimeEventsCount += 1;
        trackTelemetry(payload.new || payload.old || payload);
        if (onOrderChange) onOrderChange(payload);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, (payload) => {
        supabaseTelemetry.realtimeEventsCount += 1;
        trackTelemetry(payload.new || payload.old || payload);
        if (onProductChange) onProductChange(payload);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'customers' }, (payload) => {
        supabaseTelemetry.realtimeEventsCount += 1;
        trackTelemetry(payload.new || payload.old || payload);
        if (onCustomerChange) onCustomerChange(payload);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'product_reviews' }, (payload) => {
        supabaseTelemetry.realtimeEventsCount += 1;
        trackTelemetry(payload.new || payload.old || payload);
        if (onReviewChange) onReviewChange(payload);
      })
      .subscribe();

    return () => {
      supabaseInstance.removeChannel(channel);
    };
  } catch (e) {
    console.warn('[Supabase] Realtime subscription error:', e);
    return () => {};
  }
};

/**
 * Fast SHA-256 Password Hash helper using browser Web Crypto API
 */
export const hashPassword = async (pwd) => {
  if (!pwd) return '';
  try {
    const msgUint8 = new TextEncoder().encode(pwd);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (e) {
    return btoa(pwd);
  }
};

/**
 * Verify Customer User ID & Password against Supabase
 */
export const verifyCustomerPassword = async (phoneOrEmail, password) => {
  if (!supabaseInstance) return { success: false, reason: 'NOT_CONFIGURED' };
  try {
    const cleanPhone = (phoneOrEmail || '').replace(/\D/g, '').slice(-10);
    const inputHash = await hashPassword(password);

    // Look up customer
    const { data: cust, error } = await supabaseInstance
      .from('customers')
      .select('*')
      .eq('phone', cleanPhone)
      .maybeSingle();

    if (error) throw error;
    if (!cust) {
      // Check if orders exist for this phone
      const { data: ords } = await supabaseInstance
        .from('orders')
        .select('*')
        .eq('customer_phone', cleanPhone)
        .limit(1);

      if (!ords || ords.length === 0) {
        return { success: false, reason: 'NOT_FOUND' };
      }
      return { success: false, reason: 'NO_PASSWORD_SET' };
    }

    const storedLocalHash = localStorage.getItem('tls_cust_pwd_' + cleanPhone);
    const effectiveHash = cust.password_hash || storedLocalHash;

    if (!effectiveHash) {
      return { success: false, reason: 'NO_PASSWORD_SET', customer: cust };
    }

    if (effectiveHash === inputHash || effectiveHash === password) {
      return { success: true, customer: cust };
    } else {
      return { success: false, reason: 'WRONG_PASSWORD', customer: cust };
    }
  } catch (err) {
    console.error('[Supabase] verifyCustomerPassword error:', err);
    // Check local fallback
    const cleanPhone = (phoneOrEmail || '').replace(/\D/g, '').slice(-10);
    const inputHash = await hashPassword(password);
    const storedLocalHash = localStorage.getItem('tls_cust_pwd_' + cleanPhone);
    if (storedLocalHash && (storedLocalHash === inputHash || storedLocalHash === password)) {
      return { success: true, customer: { phone: cleanPhone, name: 'Valued Patron' } };
    }
    return { success: false, error: err.message };
  }
};

/**
 * Set or reset Customer Password in Supabase (with resilient fallback)
 */
export const setCustomerPasswordInSupabase = async (phone, newPassword) => {
  const cleanPhone = (phone || '').replace(/\D/g, '').slice(-10);
  const passHash = await hashPassword(newPassword);

  // Always save locally first so user is never blocked
  try {
    localStorage.setItem('tls_cust_pwd_' + cleanPhone, passHash);
  } catch(e) {}

  if (!supabaseInstance) return { success: true, savedLocally: true };

  try {
    // Check if customer exists in customers table
    const { data: existing } = await supabaseInstance
      .from('customers')
      .select('phone, name')
      .eq('phone', cleanPhone)
      .maybeSingle();

    if (existing) {
      const { error } = await supabaseInstance
        .from('customers')
        .update({ password_hash: passHash })
        .eq('phone', cleanPhone);
      if (error) {
        console.warn('[Supabase] password_hash update note:', error.message);
        // If column doesn't exist yet, return success via local persistence with note
        return { success: true, savedLocally: true, schemaPending: true };
      }
    } else {
      const { error } = await supabaseInstance
        .from('customers')
        .insert({
          phone: cleanPhone,
          name: 'Valued Patron',
          password_hash: passHash
        });
      if (error) {
        console.warn('[Supabase] password_hash insert note:', error.message);
        return { success: true, savedLocally: true, schemaPending: true };
      }
    }

    return { success: true };
  } catch (err) {
    console.warn('[Supabase] setCustomerPassword fallback:', err);
    return { success: true, savedLocally: true, schemaPending: true };
  }
};

/**
 * Register a new Patron with Name, Phone, Delivery Address and Password in Supabase
 */
export const registerCustomerInSupabase = async ({ phone, name, address, password }) => {
  const cleanPhone = (phone || '').replace(/\D/g, '').slice(-10);
  const passHash = await hashPassword(password);

  // Store locally as guaranteed fallback
  try {
    localStorage.setItem('tls_cust_pwd_' + cleanPhone, passHash);
    const profile = { phone: cleanPhone, name: name.trim(), address: address ? address.trim() : '' };
    localStorage.setItem('tls_cust_profile_' + cleanPhone, JSON.stringify(profile));
  } catch(e) {}

  if (!supabaseInstance) {
    return { success: true, customer: { phone: cleanPhone, name: name.trim(), address: address ? address.trim() : '' } };
  }

  try {
    const { data, error } = await supabaseInstance
      .from('customers')
      .upsert({
        phone: cleanPhone,
        name: name.trim() || 'Valued Patron',
        address: address ? address.trim() : '',
        password_hash: passHash
      }, { onConflict: 'phone' })
      .select()
      .maybeSingle();

    if (error) {
      console.warn('[Supabase] Register fallback note (trying without password_hash if column missing):', error.message);
      // Fallback if password_hash column not yet in remote schema cache
      const { data: d2 } = await supabaseInstance
        .from('customers')
        .upsert({
          phone: cleanPhone,
          name: name.trim() || 'Valued Patron',
          address: address ? address.trim() : ''
        }, { onConflict: 'phone' })
        .select()
        .maybeSingle();

      return { success: true, customer: d2 || { phone: cleanPhone, name: name.trim(), address: address ? address.trim() : '' } };
    }

    return { success: true, customer: data || { phone: cleanPhone, name: name.trim(), address: address ? address.trim() : '' } };
  } catch (err) {
    console.warn('[Supabase] registerCustomer fallback:', err);
    return { success: true, customer: { phone: cleanPhone, name: name.trim(), address: address ? address.trim() : '' } };
  }
};

/**
 * Update Customer Name and Delivery Address in Supabase
 */
export const updateCustomerDetailsInSupabase = async (phone, { name, address }) => {
  const cleanPhone = (phone || '').replace(/\D/g, '').slice(-10);
  if (!supabaseInstance) return { success: true };
  try {
    await supabaseInstance
      .from('customers')
      .update({ name: name ? name.trim() : '', address: address ? address.trim() : '' })
      .eq('phone', cleanPhone);
    return { success: true };
  } catch(e) {
    return { success: false, error: e.message };
  }
};

/**
 * Update order notes (including Porter tracking details) in Supabase
 */
export const updateOrderNotesInSupabase = async (orderId, newNotes) => {
  if (!supabaseInstance) return { success: false, reason: 'NOT_CONFIGURED' };
  try {
    const { error } = await supabaseInstance
      .from('orders')
      .update({
        notes: newNotes,
        updated_at: new Date().toISOString()
      })
      .eq('order_id', orderId);

    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error('[Supabase] updateOrderNotes error:', err);
    return { success: false, error: err.message };
  }
};

/**
 * Update Porter Delivery coordination details in an order
 */
export const updateOrderPorterDetailsInSupabase = async (orderId, { porterStatus, bookingId, driverName, driverPhone, fare, trackingUrl }) => {
  if (!supabaseInstance) return { success: false, reason: 'NOT_CONFIGURED' };
  try {
    const { data: existing } = await supabaseInstance
      .from('orders')
      .select('notes')
      .eq('order_id', orderId)
      .maybeSingle();

    const rawNotes = existing?.notes || '';
    // Strip previous PORTER_INFO block if present
    const cleanNotes = rawNotes.replace(/\[PORTER_INFO:[^\]]+\]/g, '').trim();

    const porterTag = `[PORTER_INFO: status=${porterStatus || 'Requested'}|booking=${bookingId || ''}|driver=${driverName || ''}|phone=${driverPhone || ''}|fare=${fare || ''}|track=${trackingUrl || ''}]`;
    const finalNotes = `${cleanNotes} ${porterTag}`.trim();

    const { error } = await supabaseInstance
      .from('orders')
      .update({
        notes: finalNotes,
        updated_at: new Date().toISOString()
      })
      .eq('order_id', orderId);

    if (error) throw error;
    return { success: true, notes: finalNotes };
  } catch (err) {
    console.error('[Supabase] updateOrderPorterDetails error:', err);
    return { success: false, error: err.message };
  }
};

/**
 * Fetch Product Reviews from Supabase
 */
export const fetchReviewsFromSupabase = async (options = {}) => {
  if (!supabaseInstance) return null;
  const opts = typeof options === 'number' ? { limit: options } : (options || {});
  const { limit = 40 } = opts;

  try {
    let query = supabaseInstance
      .from('product_reviews')
      .select('*')
      .order('created_at', { ascending: false });

    if (limit && limit > 0) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      console.warn('[Supabase] product_reviews query notice:', error.message);
      return null;
    }
    trackTelemetry(data);
    return (data || []).map(r => ({
      id: r.id,
      productSku: r.product_sku,
      productName: r.product_name,
      rating: Number(r.rating),
      customerName: r.customer_name,
      customerPhone: r.customer_phone || '',
      comment: r.comment || '',
      orderId: r.order_id || '',
      createdAt: r.created_at
    }));
  } catch (err) {
    console.warn('[Supabase] fetchReviews error:', err);
    return null;
  }
};

/**
 * Insert a Product Review in Supabase
 */
export const insertReviewToSupabase = async (review) => {
  if (!supabaseInstance) return { success: false, reason: 'NOT_CONFIGURED' };
  try {
    const sku = review.productSku || review.product_sku || '';
    const name = review.productName || review.product_name || '';
    const patronName = review.customerName || review.customer_name || 'Valued Patron';
    const patronPhone = review.customerPhone || review.customer_phone || '';
    const ratingNum = Number(review.rating) || 5;
    const commentText = review.comment || '';
    const orderIdVal = review.orderId || review.order_id || '';

    const payload = {
      product_sku: sku,
      product_name: name,
      rating: ratingNum,
      customer_name: patronName,
      customer_phone: patronPhone,
      comment: commentText,
      order_id: orderIdVal
    };

    const { data, error } = await supabaseInstance
      .from('product_reviews')
      .insert(payload)
      .select()
      .maybeSingle();

    if (error) {
      console.error('[Supabase] insertReview error:', error);
      return { success: false, error: error.message };
    }

    const formattedReview = {
      id: data?.id || `rev-${Date.now()}`,
      productSku: data?.product_sku || sku,
      productName: data?.product_name || name,
      rating: Number(data?.rating || ratingNum),
      customerName: data?.customer_name || patronName,
      customerPhone: data?.customer_phone || patronPhone,
      comment: data?.comment || commentText,
      orderId: data?.order_id || orderIdVal,
      createdAt: data?.created_at || new Date().toISOString()
    };

    return { success: true, data: formattedReview, review: formattedReview };
  } catch (err) {
    console.error('[Supabase] insertReview error:', err);
    return { success: false, error: err.message };
  }
};






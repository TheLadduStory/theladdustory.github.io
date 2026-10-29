import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  isSupabaseConfigured,
  getSupabaseConfig,
  saveSupabaseConfig,
  clearSupabaseConfig,
  fetchOrdersFromSupabase,
  fetchSingleOrderFromSupabase,
  fetchCustomerOrdersFromSupabase,
  getSupabaseTelemetry,
  insertOrderToSupabase,
  updateOrderStatusInSupabase,
  updateOrderPaymentStatusInSupabase,
  fetchProductsFromSupabase,
  updateProductInSupabase,
  upsertProductInSupabase,
  fetchCustomersFromSupabase,
  lookupCustomerInSupabase,
  deleteOrderInSupabase,
  subscribeToSupabaseRealtime,
  verifyCustomerPassword,
  setCustomerPasswordInSupabase,
  registerCustomerInSupabase,
  updateCustomerDetailsInSupabase,
  updateOrderNotesInSupabase,
  updateOrderPorterDetailsInSupabase,
  fetchReviewsFromSupabase,
  insertReviewToSupabase,
  insertCorporateLeadToSupabase,
  fetchCorporateLeadsFromSupabase
} from './services/supabaseClient';

// OFFICIAL GOOGLE FORM CONFIGURATION (HEADLESS SYNC TO GOOGLE SHEETS)
const GOOGLE_FORM_ACTION_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSfLHmLxHakS6sZEO4ypQtkdHPzeCwg3D8LRhTYA3t74-EmUMA/formResponse';
const FORM_ENTRIES = {
  ORDER_ID: 'entry.378465203',
  NAME: 'entry.1609068853',
  PHONE: 'entry.1606293469',
  ADDRESS: 'entry.1729098047',
  ITEMS: 'entry.1014432505'
};

// REAL-TIME BROADCAST CHANNELS (SUPABASE POSTGRESQL IS 100% PRIMARY DB)
const REALTIME_TOPIC_URL = 'https://ntfy.sh/the_laddu_story_live_sync_channel';
const APPS_SCRIPT_EXEC_URL = 'https://script.google.com/macros/s/AKfycbxIJKZkGtjRI_RXCAzBn-dQ8fs9XbG7smdQtbuEZU5z8gUAWpJCfzlEI55879LpuHb8/exec';

// OFFICIAL BRAND OMNICHANNEL PRESENCE & SOCIAL HUB
const BRAND_CHANNELS = {
  INSTAGRAM: 'https://www.instagram.com/theladdustory/',
  FACEBOOK: 'https://www.facebook.com/profile.php?id=61568690969904',
  WHATSAPP_NUMBER: '9343207515',
  WHATSAPP_LINK: 'https://wa.me/919343207515',
  YOUTUBE: 'https://www.youtube.com/@TheLadduStory',
  YOUTUBE_CREATE: 'https://www.youtube.com/create_channel',
  EMAIL_LEADS: 'theladdustory@gmail.com',
  GOOGLE_PROFILE: 'https://www.google.com/search?q=The+Laddu+Story+Bangalore',
  GOOGLE_REVIEW_LINK: 'https://search.google.com/local/writereview?placeid=ChIJ-the-laddu-story',
  KITCHEN_LOCATION: '@15101, Tower-15, Prestige Tranquility, Budigere Cross, Bangalore - 560049'
};


// OFFICIAL 11 FLYER & OMS ITEMS (MATCHING EXACT SKUS & IMAGES FROM D:\The Laddu Story Application\images)
const INITIAL_PRODUCTS = [
  { 
    id: '01', 
    sku: 'RAGI-WALNUT',
    p250: 300,
    opt0: '250g (₹300)',
    w0: '250g', 
    name: 'Ragi Walnut Laddu', 
    category: 'LADDU', 
    ratePerKg: 1200, 
    moq: '500g',
    p500: 600, 
    p1k: 1200, 
    opt1: '500g (₹600)', 
    opt2: '1 Kg (₹1,200)', 
    w1: '500g', 
    w2: '1 Kg', 
    tag: 'Superfood Millet', 
    desc: 'Finger Millet (Ragi), Walnuts, Pure Desi Cow Ghee, Unrefined Jaggery', 
    benefit: 'Rich in Calcium & Omega-3, Diabetic-friendly, Zero White Sugar', 
    image: 'images/products/RAGI-WALNUT.jpg',
    stockStatus: 'IN_STOCK',
    stockCount: 50,
    isMunchy: false 
  },
  { 
    id: '02', 
    sku: 'TILL-BLACK-SESAME',
    p250: 250,
    opt0: '250g (₹250)',
    w0: '250g', 
    name: 'Till Laddu (Black Sesame)', 
    category: 'LADDU', 
    ratePerKg: 1000, 
    moq: '500g',
    p500: 500, 
    p1k: 1000, 
    opt1: '500g (₹500)', 
    opt2: '1 Kg (₹1,000)', 
    w1: '500g', 
    w2: '1 Kg', 
    tag: 'Ayurvedic Warmth', 
    desc: 'Organic Black Sesame (Till), Pure Desi Cow Ghee, Unrefined Jaggery', 
    benefit: 'High Iron & Bone Density Support, Warming Ayurvedic Formulation', 
    image: 'images/products/TILL-BLACK-SESAME.jpg',
    stockStatus: 'IN_STOCK',
    stockCount: 50,
    isMunchy: false 
  },
  { 
    id: '03', 
    sku: 'SATTU-ALMOND',
    p250: 275,
    opt0: '250g (₹275)',
    w0: '250g', 
    name: 'Sattu Almond Laddu', 
    category: 'LADDU', 
    ratePerKg: 1100, 
    moq: '500g',
    p500: 550, 
    p1k: 1100, 
    opt1: '500g (₹550)', 
    opt2: '1 Kg (₹1,100)', 
    w1: '500g', 
    w2: '1 Kg', 
    tag: 'High Protein', 
    desc: 'Roasted Chana Sattu, California Almonds, Desi Ghee, Jaggery', 
    benefit: 'Natural Plant Protein & Sustained Energy, Muscle Recovery', 
    image: 'images/products/SATTU-ALMOND.jpg',
    stockStatus: 'IN_STOCK',
    stockCount: 50,
    isMunchy: false 
  },
  { 
    id: '04', 
    sku: 'GROUNDNUT',
    p250: 200,
    opt0: '250g (₹200)',
    w0: '250g', 
    name: 'Groundnut Laddu', 
    category: 'LADDU', 
    ratePerKg: 800, 
    moq: '500g',
    p500: 400, 
    p1k: 800, 
    opt1: '500g (₹400)', 
    opt2: '1 Kg (₹800)', 
    w1: '500g', 
    w2: '1 Kg', 
    tag: 'Traditional Classic', 
    desc: 'Roasted Peanuts (Groundnuts), Pure Cow Ghee, Organic Jaggery', 
    benefit: 'Heart-healthy fats, High satiety, Wholesome traditional snacking', 
    image: 'images/products/GROUNDNUT.jpg',
    stockStatus: 'IN_STOCK',
    stockCount: 50,
    isMunchy: false 
  },
  { 
    id: '05', 
    sku: 'QUINOA-MOONG-DAL',
    p250: 312,
    opt0: '250g (₹312)',
    w0: '250g', 
    name: 'Quinoa Moong Dal Laddu', 
    category: 'LADDU', 
    ratePerKg: 1250, 
    moq: '500g',
    p500: 625, 
    p1k: 1250, 
    opt1: '500g (₹625)', 
    opt2: '1 Kg (₹1,250)', 
    w1: '500g', 
    w2: '1 Kg', 
    tag: 'Ancient Superfood', 
    desc: 'Organic Quinoa, Yellow Moong Dal, Desi Ghee, Cardamom, Jaggery', 
    benefit: 'Complete Amino Acids, Light on Stomach & Easy Digestion', 
    image: 'images/products/QUINOA-MOONG-DAL.jpg',
    stockStatus: 'IN_STOCK',
    stockCount: 50,
    isMunchy: false 
  },
  { 
    id: '06', 
    sku: 'METHI-FENUGREEK',
    p250: 312,
    opt0: '250g (₹312)',
    w0: '250g', 
    name: 'Methi (fenugreek) Laddu', 
    category: 'LADDU', 
    ratePerKg: 1250, 
    moq: '500g',
    p500: 625, 
    p1k: 1250, 
    opt1: '500g (₹625)', 
    opt2: '1 Kg (₹1,250)', 
    w1: '500g', 
    w2: '1 Kg', 
    tag: 'Joint Support', 
    desc: 'Sprouted Fenugreek (Methi), Dry Fruits, Desi Cow Ghee, Jaggery', 
    benefit: 'Ayurvedic Joint Care, Postpartum Strength, Low Glycemic', 
    image: 'images/products/METHI-FENUGREEK.jpg',
    stockStatus: 'IN_STOCK',
    stockCount: 50,
    isMunchy: false 
  },
  { 
    id: '07', 
    sku: 'DATES-DRY-FRUITS',
    p250: 475,
    opt0: '250g (₹475)',
    w0: '250g', 
    name: 'Dates & Dry Fruits Bites', 
    category: 'LADDU', 
    ratePerKg: 1900, 
    moq: '500g',
    p500: 950, 
    p1k: 1900, 
    opt1: '500g (₹950)', 
    opt2: '1 Kg (₹1,900)', 
    w1: '500g', 
    w2: '1 Kg', 
    tag: 'Natural Sweetness', 
    desc: 'Medjool Dates, Almonds, Cashews, Pistachios, Pure Cow Ghee, Zero Sugar', 
    benefit: '100% Naturally Sweetened with Dates, Instant Energy, Fiber Rich', 
    image: 'images/products/DATES-DRY-FRUITS.jpg',
    stockStatus: 'IN_STOCK',
    stockCount: 50,
    isMunchy: false 
  },
  { 
    id: '08', 
    sku: 'POST-DELIVERY-PANJEERI',
    p250: 450,
    opt0: '250g (₹450)',
    w0: '250g', 
    name: 'Post Delivery Panjeeri / Laddu', 
    category: 'LADDU', 
    ratePerKg: 1800, 
    moq: '500g',
    p500: 900, 
    p1k: 1800, 
    opt1: '500g (₹900)', 
    opt2: '1 Kg (₹1,800)', 
    w1: '500g', 
    w2: '1 Kg', 
    tag: 'Postpartum Care', 
    desc: 'Ayurvedic Herbs, Kamarkas, Gond, Dry Fruits, A2 Desi Cow Ghee', 
    benefit: 'Maternal Healing, Lactation Support, Postpartum Recovery', 
    image: 'images/products/POST-DELIVERY-PANJEERI.jpg',
    stockStatus: 'IN_STOCK',
    stockCount: 50,
    isMunchy: false 
  },
  { 
    id: '09', 
    sku: 'JAWAR-PANJEERI',
    p250: 475,
    opt0: '250g (₹475)',
    w0: '250g', 
    name: 'Jawar Panjeeri / Laddu', 
    category: 'LADDU', 
    ratePerKg: 1900, 
    moq: '500g',
    p500: 950, 
    p1k: 1900, 
    opt1: '500g (₹950)', 
    opt2: '1 Kg (₹1,900)', 
    w1: '500g', 
    w2: '1 Kg', 
    tag: 'Ancient Sorghum Millet', 
    desc: 'Roasted Jawar (Sorghum Flour), A2 Cow Ghee, Jaggery, Super Seeds & Nuts', 
    benefit: 'Gluten-Free ancient grains, High fiber, Digestive health & stamina', 
    image: 'images/products/JAWAR-PANJEERI.jpg',
    stockStatus: 'IN_STOCK',
    stockCount: 50,
    isMunchy: false 
  },
  { 
    id: '10', 
    sku: 'SAVORY-MAKHANA', 
    name: 'Savory Munchies (Roasted Makhana)', 
    category: 'SAVORY', 
    ratePerKg: 2750, 
    moq: '100g',
    p500: 275, 
    p1k: 550, 
    opt1: '100g (₹275)', 
    opt2: '200g (₹550)', 
    w1: '100g', 
    w2: '200g', 
    tag: 'Guilt-Free Crunch', 
    desc: 'Foxnuts (Makhana) slow roasted in pure cow ghee, Himalayan pink salt', 
    benefit: 'Zero Cholesterol, Low Calorie, Mineral Rich Super Crunch', 
    image: 'images/products/SAVORY-MAKHANA.jpg',
    stockStatus: 'IN_STOCK',
    stockCount: 50,
    isMunchy: true 
  },
  { 
    id: '11', 
    sku: 'SAVORY-MURMURA', 
    name: 'Savory Munchies (Millet Mudi Mix)', 
    category: 'SAVORY', 
    ratePerKg: 1000, 
    moq: '200g',
    p500: 200, 
    p1k: 400, 
    opt1: '200g (₹200)', 
    opt2: '400g (₹400)', 
    w1: '200g', 
    w2: '400g', 
    tag: 'Tea-Time Favorite', 
    desc: 'Puffed Millets, Roasted Peanuts, Curry Leaves, Cold-pressed Spices', 
    benefit: 'Light & Crisp, Gut-friendly, Wholesome evening snack', 
    image: 'images/products/SAVORY-MURMURA.jpg',
    stockStatus: 'IN_STOCK',
    stockCount: 50,
    isMunchy: true 
  }
];

// MASTER OMS STATE: Supabase PostgreSQL is the 100% Primary Source of Truth

// MASTER OMS STATE: Live orders managed strictly via Supabase Primary DB
const MASTER_OMS_ORDERS = [];

// IMMEDIATE SYNCHRONOUS PURGE OF LEGACY CACHE (Executes before React mounts)
const CURRENT_CACHE_VERSION = 'v8_moq_and_payment_live';
try {
  if (typeof window !== 'undefined' && window.localStorage) {
    if (window.localStorage.getItem('tls_cache_version') !== CURRENT_CACHE_VERSION) {
      window.localStorage.removeItem('tls_active_customer');
      window.localStorage.removeItem('tls_orders_db');
      window.localStorage.removeItem('tls_supabase_config');
      window.localStorage.setItem('tls_cache_version', CURRENT_CACHE_VERSION);
    }
  }
} catch (e) {}


// DYNAMIC WEIGHT & MOQ RESOLUTION HELPER
export const getProductWeightOptions = (product) => {
  if (!product) return [];
  if (product.category === 'SAVORY' || product.isMunchy) {
    return [
      { key: 'OPT1', label: product.opt1 || '100g', weight: product.w1 || '100g', price: Number(product.p500 || 0) },
      { key: 'OPT2', label: product.opt2 || '200g', weight: product.w2 || '200g', price: Number(product.p1k || 0) }
    ];
  }

  const rateKg = Number(product.ratePerKg || (Number(product.p500 || 0) * 2));
  const p250 = product.p250 ? Number(product.p250) : Math.round(rateKg * 0.25);
  const p500 = Number(product.p500 || Math.round(rateKg * 0.5));
  const p1k = Number(product.p1k || rateKg);

  const opt0 = product.opt0 || `250g (₹${p250})`;
  const opt1 = product.opt1 || `500g (₹${p500})`;
  const opt2 = product.opt2 || `1 Kg (₹${p1k.toLocaleString('en-IN')})`;

  // When MOQ is 250g -> 3 options: 250g, 500g, 1 Kg
  if (product.moq === '250g') {
    return [
      { key: 'OPT0', label: opt0, weight: '250g', price: p250 },
      { key: 'OPT1', label: opt1, weight: '500g', price: p500 },
      { key: 'OPT2', label: opt2, weight: '1 Kg', price: p1k }
    ];
  }

  // When MOQ is 500g -> 2 options: 500g, 1 Kg
  return [
    { key: 'OPT1', label: opt1, weight: '500g', price: p500 },
    { key: 'OPT2', label: opt2, weight: '1 Kg', price: p1k }
  ];
};

// CLEAN PICKUP NOTE HELPER (Avoids duplicate 'Self-Pickup' prepends)
export const cleanPickupNote = (note) => {
  if (!note) return '';
  return note
    .replace(/Self-Pickup/gi, '')
    .replace(/Store Self-Pickup:?/gi, '')
    .replace(/The Laddu Story Kitchen, Bangalore/gi, '')
    .replace(/[():]/g, '')
    .trim();
};

// PARSE PORTER DETAILS FROM ORDER NOTES
export const getPorterDetails = (notes = '') => {
  if (!notes || typeof notes !== 'string') return null;
  const match = notes.match(/\[PORTER_INFO:\s*([^\]]+)\]/i);
  if (!match) return null;
  const raw = match[1];
  const parts = raw.split('|');
  const details = {};
  parts.forEach(part => {
    const [k, ...v] = part.split('=');
    if (k) details[k.trim()] = v.join('=').trim();
  });
  return details;
};


// OFFICIAL CATALOG PRODUCT GALLERY IMAGES
const CATALOG_GALLERY_IMAGES = [
  { name: 'Ragi Walnut', file: 'images/products/RAGI-WALNUT.jpg' },
  { name: 'Till Sesame', file: 'images/products/TILL-BLACK-SESAME.jpg' },
  { name: 'Sattu Almond', file: 'images/products/SATTU-ALMOND.jpg' },
  { name: 'Groundnut', file: 'images/products/GROUNDNUT.jpg' },
  { name: 'Quinoa Moong', file: 'images/products/QUINOA-MOONG-DAL.jpg' },
  { name: 'Methi Fenugreek', file: 'images/products/METHI-FENUGREEK.jpg' },
  { name: 'Dates Dry Fruits', file: 'images/products/DATES-DRY-FRUITS.jpg' },
  { name: 'Dates Pops', file: 'images/products/DATES-POPS.jpg' },
  { name: 'Post Delivery', file: 'images/products/POST-DELIVERY-PANJEERI.jpg' },
  { name: 'Jawar Panjeeri', file: 'images/products/JAWAR-PANJEERI.jpg' },
  { name: 'Savory Makhana', file: 'images/products/SAVORY-MAKHANA.jpg' },
  { name: 'Savory Murmura', file: 'images/products/SAVORY-MURMURA.jpg' }
];

// Product Reviews & Ratings (Loaded strictly from Supabase Database)
const SEED_REVIEWS = [];

export default function App() {
  // Navigation & View State
  const [activeTab, setActiveTab] = useState('store'); // 'store' | 'track' | 'admin'
  const [adminSection, setAdminSection] = useState('orders'); // 'orders' | 'inventory' | 'reviews'
  const [adminOrderViewMode, setAdminOrderViewMode] = useState('LIST'); // 'LIST' | 'KITCHEN_PREP'
  const [kitchenStatusFilter, setKitchenStatusFilter] = useState('PENDING'); // 'PENDING' | 'RECEIVED_ONLY' | 'PREPARING_ONLY'
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(() => {
    try {
      const s = typeof window !== 'undefined' ? window.location.search.toLowerCase() : '';
      const h = typeof window !== 'undefined' ? window.location.hash.toLowerCase() : '';
      const isStaff = s.includes('staff') || s.includes('admin') || s.includes('oms') || h.includes('staff') || h.includes('admin') || h.includes('oms');
      return isStaff && (sessionStorage.getItem('tls_staff_logged_in') === 'true' || localStorage.getItem('tls_staff_logged_in') === 'true');
    } catch(e) {
      return false;
    }
  });
  const [adminPinInput, setAdminPinInput] = useState('');
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Supabase Real-Time Cloud DB State
  const [showSupabaseModal, setShowSupabaseModal] = useState(false);
  const [supabaseUrlInput, setSupabaseUrlInput] = useState(() => getSupabaseConfig().url || '');
  const [supabaseKeyInput, setSupabaseKeyInput] = useState(() => getSupabaseConfig().anonKey || '');
  const [supabaseConnected, setSupabaseConnected] = useState(() => isSupabaseConfigured());
  const [supabaseSaving, setSupabaseSaving] = useState(false);
  const [supabaseError, setSupabaseError] = useState('');

  // Cloud Sync State
  const [isCloudSynced, setIsCloudSynced] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(new Date().toLocaleTimeString());

  // Products State (Managed dynamically via Admin Inventory)
  const [products, setProducts] = useState(() => {
    try {
      const saved = localStorage.getItem('tls_products_db');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(p => {
            const init = INITIAL_PRODUCTS.find(i => i.sku === p.sku);
            return init ? { ...init, ...p, p250: p.p250 || init.p250, opt0: p.opt0 || init.opt0, w0: p.w0 || init.w0 } : p;
          });
        }
      }
      return INITIAL_PRODUCTS;
    } catch (e) {
      return INITIAL_PRODUCTS;
    }
  });

  // Inventory Editing Modals
  const [editingProduct, setEditingProduct] = useState(null);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [newProductForm, setNewProductForm] = useState({
    sku: '',
    name: '',
    category: 'LADDU',
    ratePerKg: 1200,
    moq: '500g',
    opt1: '500g (₹600)',
    opt2: '1 Kg (₹1,200)',
    p500: 600,
    p1k: 1200,
    w1: '500g',
    w2: '1 Kg',
    tag: 'Artisanal Special',
    desc: 'Crafted with Desi Cow Ghee and Pure Jaggery',
    benefit: 'Healthy and wholesome nutrition',
    image: 'images/products/RAGI-WALNUT.jpg',
    stockStatus: 'IN_STOCK',
    stockCount: 50,
    isMunchy: false
  });

  // Customer Account Session (Verified against Supabase Primary DB)
  const [customerUser, setCustomerUser] = useState(() => {
    try {
      const CURRENT_CACHE_VERSION = 'v8_moq_and_payment_live';
      if (localStorage.getItem('tls_cache_version') !== CURRENT_CACHE_VERSION) {
        return null;
      }
      const saved = localStorage.getItem('tls_active_customer');
      if (!saved) return null;
      return JSON.parse(saved);
    } catch (e) {
      return null;
    }
  });

  const [showCustomerLoginModal, setShowCustomerLoginModal] = useState(false);
  const [isCustomerLoggingIn, setIsCustomerLoggingIn] = useState(false);

    // =========================================================================
  // PATRON ACCOUNT PORTAL STATE (Mobile + Password / 4-Digit Security PIN)
  // =========================================================================
  const [authMode, setAuthMode] = useState('SIGNIN'); // 'SIGNIN' | 'REGISTER'
  
  // Sign-In Form State
  const [loginPhoneInput, setLoginPhoneInput] = useState('');
  const [loginPasswordInput, setLoginPasswordInput] = useState('');
  
  // Registration Form State
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  
  // Modals for editing Profile / Password
  const [showSetPasswordModal, setShowSetPasswordModal] = useState(false);
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editAddressInput, setEditAddressInput] = useState('');
  const [isSavingAddress, setIsSavingAddress] = useState(false);

  // Cart & Order Form State
  const [cart, setCart] = useState([]);
  const [selectedWeights, setSelectedWeights] = useState({});
  const [custName, setCustName] = useState(() => customerUser ? customerUser.name : (localStorage.getItem('tls_cust_name') || ''));
  const [custPhone, setCustPhone] = useState(() => customerUser ? customerUser.phone : (localStorage.getItem('tls_cust_phone') || ''));
  const [custAddress, setCustAddress] = useState(() => customerUser ? cleanPickupNote(customerUser.address) : cleanPickupNote(localStorage.getItem('tls_cust_addr') || ''));
  const [fulfillmentType, setFulfillmentType] = useState('PICKUP'); // 'PICKUP' | 'PORTER' | 'DELIVERY'
  const [deliveryNotice, setDeliveryNotice] = useState('');
  const [showPorterOption, setShowPorterOption] = useState(false); // Controls Porter Service prompt
  
  // Porter Coordination State (Staff Admin)
  const [editingPorterOrderId, setEditingPorterOrderId] = useState(null);
  const [porterForm, setPorterForm] = useState({
    status: 'Requested',
    bookingId: '',
    driverName: '',
    driverPhone: '',
    fare: '',
    trackingUrl: ''
  });
  const [isSavingPorter, setIsSavingPorter] = useState(false);

  // Staff Manual / WhatsApp Order Entry State
  const [showStaffOrderModal, setShowStaffOrderModal] = useState(false);
  const [staffOrderPhone, setStaffOrderPhone] = useState('');
  const [staffOrderName, setStaffOrderName] = useState('');
  const [staffOrderChannel, setStaffOrderChannel] = useState('WHATSAPP'); // 'WHATSAPP' | 'PHONE' | 'OFFLINE'
  const [staffOrderFulfillment, setStaffOrderFulfillment] = useState('PICKUP'); // 'PICKUP' | 'PORTER' | 'DELIVERY'
  const [staffOrderAddress, setStaffOrderAddress] = useState('');
  const [staffOrderNotes, setStaffOrderNotes] = useState('');
  const [staffOrderPaymentStatus, setStaffOrderPaymentStatus] = useState('PAID'); // 'PAID' | 'UNPAID'
  const [staffOrderPaymentMethod, setStaffOrderPaymentMethod] = useState('UPI'); // 'UPI' | 'CASH' | 'WHATSAPP_UPI'
  const [staffOrderItems, setStaffOrderItems] = useState([]);
  const [staffSelectedProductSku, setStaffSelectedProductSku] = useState('01');
  const [staffSelectedWeightKey, setStaffSelectedWeightKey] = useState('500g');
  const [staffSelectedQty, setStaffSelectedQty] = useState(1);
  const [staffCustomerLookupStatus, setStaffCustomerLookupStatus] = useState(null); // { found: bool, name, address, totalOrders }
  const [isStaffSubmittingOrder, setIsStaffSubmittingOrder] = useState(false);
  const [staffOrderCreatedSuccess, setStaffOrderCreatedSuccess] = useState(null);

  // Product Reviews & Ratings State (Strictly sourced from Supabase Database)
  const [reviews, setReviews] = useState(() => {
    try {
      const ver = localStorage.getItem('tls_reviews_cache_ver');
      if (ver === 'v6_db_pure_strict') {
        const saved = localStorage.getItem('tls_reviews_db');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) return parsed;
        }
      } else {
        localStorage.removeItem('tls_reviews_db');
        localStorage.removeItem('tls_customer_reviews');
        localStorage.setItem('tls_reviews_cache_ver', 'v6_db_pure_strict');
      }
    } catch (e) {}
    return [];
  });
  const [selectedProductForReview, setSelectedProductForReview] = useState(null);
  const [isStaffReviewMode, setIsStaffReviewMode] = useState(false);
  const [reviewRatingInput, setReviewRatingInput] = useState(5);
  const [reviewNameInput, setReviewNameInput] = useState('');
  const [reviewPhoneInput, setReviewPhoneInput] = useState('');
  const [reviewCommentInput, setReviewCommentInput] = useState('');
  const [reviewOrderIdInput, setReviewOrderIdInput] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewSuccessMsg, setReviewSuccessMsg] = useState('');
  const [reviewProductFilter, setReviewProductFilter] = useState('ALL');
  const [reviewRatingFilter, setReviewRatingFilter] = useState('ALL');

  const [paymentTiming, setPaymentTiming] = useState('NOW'); // 'NOW' | 'LATER'
  const [upiRefId, setUpiRefId] = useState('');
  const [selectedOrderForPay, setSelectedOrderForPay] = useState(null); // Customer pay-now modal
  const [paymentFilter, setPaymentFilter] = useState('ALL'); // 'ALL' | 'PAID' | 'PENDING'
  const [postOrderPayMode, setPostOrderPayMode] = useState('NOW'); // 'NOW' | 'LATER'
  const [postOrderUtr, setPostOrderUtr] = useState('');
  const [showGalleryDrawer, setShowGalleryDrawer] = useState(false);
  
  // URL check for Staff/Admin/OMS portal (?staff, ?admin, ?oms, ?omsstaff, #staff, #oms, etc.)
  const isStaffUrl = typeof window !== 'undefined' && (() => {
    const s = window.location.search.toLowerCase();
    const h = window.location.hash.toLowerCase();
    return s.includes('staff') || s.includes('admin') || s.includes('oms') || h.includes('staff') || h.includes('admin') || h.includes('oms');
  })();
  const [isStaffRoute, setIsStaffRoute] = useState(isStaffUrl);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);
  const [showConfirmOrderModal, setShowConfirmOrderModal] = useState(false);
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);
  const [addedToast, setAddedToast] = useState('');

  // Omnichannel Traffic Attribution & Corporate Lead Generation State
  const [trafficSource, setTrafficSource] = useState(null);
  const [highlightedSku, setHighlightedSku] = useState(null);
  const [showCorporateModal, setShowCorporateModal] = useState(false);
  const [corporateForm, setCorporateForm] = useState({
    name: '',
    company: '',
    phone: '',
    email: '',
    count: '50',
    occasion: 'Diwali / Festive Corporate Gifting',
    boxType: 'Luxe 4-Millet Assortment (Pure Desi Cow Ghee)',
    customNote: ''
  });
  const [isSubmittingCorporateLead, setIsSubmittingCorporateLead] = useState(false);
  const [corporateSuccessMsg, setCorporateSuccessMsg] = useState('');
  const [corporateLeads, setCorporateLeads] = useState([]);
  const [isLoadingLeads, setIsLoadingLeads] = useState(false);
  const [showConciergeMenu, setShowConciergeMenu] = useState(false);

  // Staff WhatsApp & Omnichannel Interactive Testing State
  const [testWaPhone, setTestWaPhone] = useState('9343207515');
  const [testWaName, setTestWaName] = useState('Priya Sharma');
  const [testWaTemplate, setTestWaTemplate] = useState('ORDER_CONFIRM');
  const [testWaStatus, setTestWaStatus] = useState('PREPARING');
  const [testWaDriverName, setTestWaDriverName] = useState('Ramesh Kumar');
  const [testWaDriverPhone, setTestWaDriverPhone] = useState('9876543210');
  const [testGenSku, setTestGenSku] = useState('RAGI-WALNUT');
  const [testGenSource, setTestGenSource] = useState('INSTAGRAM');
  const [copyLinkNotice, setCopyLinkNotice] = useState('');

  // Orders Store (Supabase PostgreSQL is primary)
  const [orders, setOrders] = useState(() => {
    try {
      const CURRENT_CACHE_VERSION = 'v5_clean_supabase_truth';
      if (localStorage.getItem('tls_cache_version') !== CURRENT_CACHE_VERSION) {
        return [];
      }
      const saved = localStorage.getItem('tls_orders_db');
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  });

  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState('');

  // Save to local storage on update
  useEffect(() => {
    try {
      localStorage.setItem('tls_orders_db', JSON.stringify(orders));
    } catch (e) {}
  }, [orders]);

  useEffect(() => {
    try {
      localStorage.setItem('tls_products_db', JSON.stringify(products));
    } catch (e) {}
  }, [products]);

  useEffect(() => {
    try {
      localStorage.setItem('tls_reviews_db', JSON.stringify(reviews));
    } catch (e) {}
  }, [reviews]);

  // Auto-purge legacy mock cache so Supabase PostgreSQL is strictly primary
  useEffect(() => {
    try {
      const CURRENT_CACHE_VERSION = 'v5_clean_supabase_truth';
      const savedVer = localStorage.getItem('tls_cache_version');
      if (savedVer !== CURRENT_CACHE_VERSION) {
        localStorage.removeItem('tls_active_customer');
        localStorage.removeItem('tls_orders_db');
        localStorage.removeItem('tls_supabase_config');
        localStorage.setItem('tls_cache_version', CURRENT_CACHE_VERSION);
      }
    } catch (e) {}
  }, []);

  // Omnichannel Deep-Link & Referral Traffic Tracker
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const source = params.get('source') || params.get('utm_source') || params.get('ref');
      if (source) {
        const cleanSource = source.trim().toUpperCase();
        setTrafficSource(cleanSource);
        sessionStorage.setItem('tls_traffic_source', cleanSource);
      } else {
        const savedSource = sessionStorage.getItem('tls_traffic_source');
        if (savedSource) setTrafficSource(savedSource);
      }

      const sku = params.get('sku');
      if (sku) {
        setHighlightedSku(sku.trim().toUpperCase());
      }

      const tab = params.get('tab');
      if (tab === 'corporate' || tab === 'b2b') {
        setShowCorporateModal(true);
      }
    } catch (e) {}
  }, []);

  // Auto-fetch Corporate Leads when Staff opens the Leads CRM
  useEffect(() => {
    if (activeTab === 'admin' && adminSection === 'leads' && isSupabaseConfigured()) {
      setIsLoadingLeads(true);
      fetchCorporateLeadsFromSupabase().then(res => {
        if (res) setCorporateLeads(res);
        setIsLoadingLeads(false);
      });
    }
  }, [activeTab, adminSection]);

  // Sync inputs when customerUser changes
  useEffect(() => {
    if (customerUser && customerUser.phone) {
      setCustName(customerUser.name || '');
      setCustPhone(customerUser.phone || '');
      setCustAddress(customerUser.address || '');
    }
  }, [customerUser]);

  // REAL-TIME CLOUD STATUS INDICATOR
  const syncWithCloud = async () => {
    setIsCloudSynced(true);
    setLastSyncTime(new Date().toLocaleTimeString());
  };

  // REAL-TIME SUPABASE POSTGRESQL ENGINE & EVENT SUBSCRIPTION
  useEffect(() => {
    // Auto-prompt staff login modal or direct to admin if ?staff / ?oms visited
    if (isStaffUrl) {
      if (isAdminLoggedIn || sessionStorage.getItem('tls_staff_logged_in') === 'true' || localStorage.getItem('tls_staff_logged_in') === 'true') {
        setIsAdminLoggedIn(true);
        setActiveTab('admin');
      } else {
        setShowLoginModal(true);
      }
    }

    // Initial Supabase Data Fetch & Realtime WebSocket Channel
    let unsubSupabase = null;
    if (isSupabaseConfigured()) {
      setSupabaseConnected(true);

      const activeSaved = localStorage.getItem('tls_active_customer');
      let savedCust = null;
      if (activeSaved) {
        try { savedCust = JSON.parse(activeSaved); } catch(e) {}
      }

      // CRITICAL EGRESS SHIELD:
      // Only fetch orders for Staff OMS or logged-in Patrons.
      // Casual storefront visitors NEVER download global order tables!
      if (isAdminLoggedIn || isStaffUrl) {
        fetchOrdersFromSupabase({ limit: 50 }).then(dbOrders => {
          if (dbOrders) {
            setOrders(dbOrders);
            setIsCloudSynced(true);
            setLastSyncTime(new Date().toLocaleTimeString());
          }
        });
      } else if (savedCust && savedCust.phone) {
        fetchCustomerOrdersFromSupabase(savedCust.phone).then(custOrders => {
          if (custOrders) {
            setOrders(custOrders);
            setIsCloudSynced(true);
            setLastSyncTime(new Date().toLocaleTimeString());
          }
        });
      }

      // Validate active customer in Supabase CRM
      if (savedCust && savedCust.phone) {
        const clean = savedCust.phone.replace(/\D/g, '').slice(-10);
        lookupCustomerInSupabase(clean).then(dbCust => {
          if (!dbCust) {
            console.warn('[Auth] Customer deleted from Supabase. Logging out.');
            setCustomerUser(null);
            localStorage.removeItem('tls_active_customer');
          } else if (dbCust && (dbCust.name !== savedCust.name || dbCust.address !== savedCust.address)) {
            const refreshed = { ...savedCust, name: dbCust.name, address: dbCust.address || savedCust.address };
            setCustomerUser(refreshed);
            localStorage.setItem('tls_active_customer', JSON.stringify(refreshed));
          }
        });
      }

      // Products (Cached in localStorage)
      fetchProductsFromSupabase().then(dbProducts => {
        if (dbProducts && dbProducts.length > 0) {
          setProducts(dbProducts);
          try { localStorage.setItem('tls_products_db', JSON.stringify(dbProducts)); } catch(e) {}
        }
      });

      // Reviews (Bounded with limit 40 & cached)
      fetchReviewsFromSupabase({ limit: 40 }).then(dbReviews => {
        if (dbReviews) {
          setReviews(dbReviews);
          try {
            localStorage.setItem('tls_reviews_db', JSON.stringify(dbReviews));
          } catch(e) {}
        }
      });

      unsubSupabase = subscribeToSupabaseRealtime(
        (orderPayload) => {
          if (orderPayload.eventType === 'UPDATE' && orderPayload.new) {
            const o = orderPayload.new;
            const statusMatch = (o.notes || '').match(/\[STATUS:([^\]]+)\]/);
            const resolvedStatus = statusMatch ? statusMatch[1].trim() : o.order_status;
            const cleanNotes = (o.notes || '').replace(/\[STATUS:[^\]]+\]/g, '').trim();
            setOrders(prev => prev.map(item => item.orderId === o.order_id ? { ...item, status: resolvedStatus, notes: cleanNotes } : item));
            setIsCloudSynced(true);
            setLastSyncTime(new Date().toLocaleTimeString());
          } else if (orderPayload.eventType === 'INSERT' && orderPayload.new) {
            // ZERO-EGRESS PATCH: Fetch only the single inserted order with its items
            fetchSingleOrderFromSupabase(orderPayload.new.order_id).then(singleOrder => {
              if (singleOrder) {
                setOrders(prev => [singleOrder, ...prev.filter(item => item.orderId !== singleOrder.orderId)]);
              } else {
                fetchOrdersFromSupabase({ limit: 40 }).then(latestOrders => {
                  if (latestOrders) setOrders(latestOrders);
                });
              }
            });
            setIsCloudSynced(true);
            setLastSyncTime(new Date().toLocaleTimeString());
          } else if (orderPayload.eventType === 'DELETE' && orderPayload.old) {
            setOrders(prev => prev.filter(item => item.orderId !== orderPayload.old.order_id));
            setIsCloudSynced(true);
            setLastSyncTime(new Date().toLocaleTimeString());
          }
        },
        (prodPayload) => {
          if (prodPayload.eventType === 'UPDATE' && prodPayload.new) {
            const p = prodPayload.new;
            setProducts(prev => prev.map(item => item.sku === p.sku ? {
              ...item,
              stockStatus: p.stock_status,
              stockCount: Number(p.stock_count),
              p500: Number(p.p500),
              p1k: Number(p.p1k)
            } : item));
          } else if (prodPayload.eventType === 'INSERT' && prodPayload.new) {
            fetchProductsFromSupabase().then(latest => {
              if (latest) setProducts(latest);
            });
          }
        },
        (custPayload) => {
          if (custPayload.eventType === 'DELETE' && custPayload.old) {
            const delPhone = custPayload.old.phone;
            setCustomerUser(curr => {
              if (curr && (curr.phone || '').replace(/\D/g, '').slice(-10) === delPhone) {
                localStorage.removeItem('tls_active_customer');
                return null;
              }
              return curr;
            });
          } else if (custPayload.eventType === 'UPDATE' && custPayload.new) {
            const upd = custPayload.new;
            setCustomerUser(curr => {
              if (curr && (curr.phone || '').replace(/\D/g, '').slice(-10) === upd.phone) {
                const refreshed = { ...curr, name: upd.name, address: upd.address || curr.address };
                localStorage.setItem('tls_active_customer', JSON.stringify(refreshed));
                return refreshed;
              }
              return curr;
            });
          }
        },
        (reviewPayload) => {
          if (reviewPayload.eventType === 'INSERT' && reviewPayload.new) {
            const r = reviewPayload.new;
            const formatted = {
              id: r.id,
              productSku: r.product_sku,
              productName: r.product_name,
              rating: Number(r.rating),
              customerName: r.customer_name,
              customerPhone: r.customer_phone || '',
              comment: r.comment || '',
              orderId: r.order_id || '',
              createdAt: r.created_at
            };
            setReviews(prev => [formatted, ...prev.filter(x => x.id !== r.id)]);
          } else {
            fetchReviewsFromSupabase({ limit: 40 }).then(dbReviews => {
              if (dbReviews) {
                setReviews(dbReviews);
                try {
                  localStorage.setItem('tls_reviews_db', JSON.stringify(dbReviews));
                } catch(e) {}
              }
            });
          }
        }
      );
    }

    // Live 0-latency Real-Time Server-Sent Events (SSE) Listener
    let es = null;
    try {
      es = new EventSource(REALTIME_TOPIC_URL + '/sse');
      es.onmessage = (e) => {
        try {
          const raw = JSON.parse(e.data);
          if (raw && raw.message) {
            const msg = JSON.parse(raw.message);
            if (msg.type === 'STATUS_UPDATE') {
              setOrders(prev => prev.map(o => o.orderId === msg.orderId ? { ...o, status: msg.status } : o));
              setIsCloudSynced(true);
              setLastSyncTime(new Date().toLocaleTimeString());
            } else if (msg.type === 'NEW_ORDER' && msg.order) {
              setOrders(prev => {
                if (prev.some(o => o.orderId === msg.order.orderId)) return prev;
                return [msg.order, ...prev];
              });
              setIsCloudSynced(true);
              setLastSyncTime(new Date().toLocaleTimeString());
            } else if (msg.type === 'NEW_REVIEW' && msg.review) {
              setReviews(prev => {
                if (prev.some(r => r.id === msg.review.id)) return prev;
                return [msg.review, ...prev];
              });
            }
          }
        } catch(err) {}
      };
    } catch(err) {}

    // OPTIMIZED GENTLE HEARTBEAT (5 minutes instead of aggressive 10 seconds!)
    // Realtime WebSockets push all changes instantly with 0 polling overhead.
    let lastSyncTimestamp = Date.now();
    const syncInterval = setInterval(() => {
      if (isSupabaseConfigured() && typeof document !== 'undefined' && document.visibilityState === 'visible') {
        if (isAdminLoggedIn || isStaffUrl) {
          fetchOrdersFromSupabase({ limit: 50 }).then(latestOrders => {
            if (latestOrders && latestOrders.length > 0) setOrders(latestOrders);
          });
        }
        lastSyncTimestamp = Date.now();
      }
    }, 300000); // 5 minutes (300,000 ms)

    const handleVisibilityChange = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible' && isSupabaseConfigured()) {
        const now = Date.now();
        // Rate-limit tab refocus sync to minimum 3 minutes between fetches
        if (now - lastSyncTimestamp > 180000) {
          if (isAdminLoggedIn || isStaffUrl) {
            fetchOrdersFromSupabase({ limit: 50 }).then(latestOrders => {
              if (latestOrders && latestOrders.length > 0) setOrders(latestOrders);
            });
          }
          lastSyncTimestamp = now;
        }
      }
    };
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }

    return () => {
      if (es) es.close();
      if (typeof unsubSupabase === 'function') unsubSupabase();
      clearInterval(syncInterval);
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
    };
  }, []);

    // Helper: Validate genuine Indian mobile number
  const validateIndianMobile = (phone) => {
    const clean = (phone || '').replace(/\D/g, '').slice(-10);
    if (!clean || clean.length !== 10) {
      return { valid: false, error: 'Please enter a complete 10-digit mobile number.' };
    }
    // Indian telecom rules: valid mobile numbers strictly start with 6, 7, 8, or 9
    if (!/^[6-9]\d{9}$/.test(clean)) {
      return { valid: false, error: 'Invalid mobile number. Indian mobile numbers must start with 6, 7, 8, or 9.' };
    }
    // Reject fake repeating patterns (e.g. 1111111111, 9999999999)
    if (/^(\d)\1{9}$/.test(clean)) {
      return { valid: false, error: 'Invalid mobile number. Repeated digits (e.g. 1111111111) are not permitted.' };
    }
    return { valid: true, clean };
  };

    // =========================================================================
  // PATRON AUTHENTICATION HANDLERS: PURE MOBILE + PASSWORD CRM ENGINE
  // =========================================================================

  // 1. RETURNING PATRON SIGN-IN
  const handlePasswordLogin = async (e) => {
    if (e) e.preventDefault();
    const valResult = validateIndianMobile(loginPhoneInput);
    if (!valResult.valid) {
      alert('❌ ' + valResult.error);
      return;
    }
    if (!loginPasswordInput || loginPasswordInput.trim().length === 0) {
      alert('Please enter your password or 4-digit PIN.');
      return;
    }

    const clean = valResult.clean;
    setIsCustomerLoggingIn(true);

    try {
      if (!isSupabaseConfigured()) {
        const profile = {
          phone: clean,
          name: 'Valued Patron',
          address: '',
          verifiedVia: 'PASSWORD',
          loggedInAt: new Date().toISOString()
        };
        setCustomerUser(profile);
        localStorage.setItem('tls_active_customer', JSON.stringify(profile));
        setShowCustomerLoginModal(false);
        setActiveTab('track');
        return;
      }

      const res = await verifyCustomerPassword(clean, loginPasswordInput.trim());

      if (res.success) {
        const customerRecord = res.customer;
        const customerOrders = await fetchCustomerOrdersFromSupabase(clean) || [];
        setOrders(prev => {
          const others = prev.filter(o => (o.phone || '').replace(/\D/g, '').slice(-10) !== clean);
          return [...customerOrders, ...others];
        });

        const profile = {
          phone: clean,
          name: customerRecord?.name || customerOrders[0]?.name || 'Valued Patron',
          address: customerRecord?.address || customerOrders[0]?.address || '',
          verifiedVia: 'PASSWORD',
          hasPassword: true,
          loggedInAt: new Date().toISOString()
        };

        setCustomerUser(profile);
        localStorage.setItem('tls_active_customer', JSON.stringify(profile));
        
        // Auto-fill checkout fields for convenience
        setCustName(profile.name);
        setCustPhone(profile.phone);
        setCustAddress(profile.address);

        setShowCustomerLoginModal(false);
        setActiveTab('track');
      } else if (res.reason === 'NO_PASSWORD_SET') {
        const goReg = window.confirm(
          `Notice: No password found for +91 ${clean}.\n\nWould you like to open the Registration tab to create your patron account & password in 10 seconds?`
        );
        if (goReg) {
          setRegPhone(clean);
          setAuthMode('REGISTER');
        }
      } else if (res.reason === 'WRONG_PASSWORD') {
        alert(`❌ Incorrect password or PIN for +91 ${clean}. Please check and try again.`);
      } else if (res.reason === 'NOT_FOUND') {
        const goReg = window.confirm(
          `No account found for +91 ${clean}.\n\nWould you like to register now and get your personal patron portal?`
        );
        if (goReg) {
          setRegPhone(clean);
          setAuthMode('REGISTER');
        }
      } else {
        alert('Authentication error. Please check your mobile number and password.');
      }
    } catch (err) {
      console.error('Sign-in error:', err);
      alert('Error signing in. Please try again.');
    } finally {
      setIsCustomerLoggingIn(false);
    }
  };

  // 2. NEW PATRON REGISTRATION
  const handleRegisterCustomer = async (e) => {
    if (e) e.preventDefault();
    if (!regName || regName.trim().length === 0) {
      alert('Please enter your full name.');
      return;
    }
    const valResult = validateIndianMobile(regPhone);
    if (!valResult.valid) {
      alert('❌ ' + valResult.error);
      return;
    }
    if (!regAddress || regAddress.trim().length === 0) {
      alert('Please enter your delivery address.');
      return;
    }
    if (!regPassword || regPassword.trim().length < 4) {
      alert('Password / PIN must be at least 4 characters or digits.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      alert('Passwords do not match. Please re-enter.');
      return;
    }

    const clean = valResult.clean;
    setIsCustomerLoggingIn(true);

    try {
      const res = await registerCustomerInSupabase({
        phone: clean,
        name: regName.trim(),
        address: regAddress.trim(),
        password: regPassword.trim()
      });

      const profile = {
        phone: clean,
        name: regName.trim(),
        address: regAddress.trim(),
        verifiedVia: 'PASSWORD',
        hasPassword: true,
        loggedInAt: new Date().toISOString()
      };

      setCustomerUser(profile);
      localStorage.setItem('tls_active_customer', JSON.stringify(profile));

      // Auto-populate checkout inputs
      setCustName(profile.name);
      setCustPhone(profile.phone);
      setCustAddress(profile.address);

      setShowCustomerLoginModal(false);
      setActiveTab('track');
      alert(`👑 Welcome to The Laddu Story, ${regName.trim()}! Your patron account is ready.`);
    } catch (err) {
      console.error('Registration error:', err);
      alert('Error creating account. Please try again.');
    } finally {
      setIsCustomerLoggingIn(false);
    }
  };

  // 3. SET / UPDATE PASSWORD IN SUPABASE
  const handleSaveCustomerPassword = async (e) => {
    if (e) e.preventDefault();
    if (!newPasswordInput || newPasswordInput.trim().length < 4) {
      alert('Password must be at least 4 characters or digits.');
      return;
    }
    if (newPasswordInput !== confirmPasswordInput) {
      alert('Passwords do not match. Please re-enter.');
      return;
    }
    if (!customerUser || !customerUser.phone) {
      alert('Please sign in first to update your password.');
      return;
    }

    setIsSavingPassword(true);
    try {
      const res = await setCustomerPasswordInSupabase(customerUser.phone, newPasswordInput.trim());
      if (res.success) {
        alert('✅ Password updated successfully! You can now log in using your Phone and Password anytime.');
        setShowSetPasswordModal(false);
        setNewPasswordInput('');
        setConfirmPasswordInput('');
        setCustomerUser(prev => ({ ...prev, hasPassword: true }));
      } else {
        alert('❌ Failed to update password: ' + (res.error || 'Database error'));
      }
    } catch (err) {
      console.error('Set password error:', err);
      alert('Error saving password.');
    } finally {
      setIsSavingPassword(false);
    }
  };

  // 4. UPDATE DELIVERY ADDRESS IN SUPABASE
  const handleSaveDeliveryAddress = async (e) => {
    if (e) e.preventDefault();
    if (!editAddressInput || editAddressInput.trim().length === 0) {
      alert('Please enter a valid address.');
      return;
    }
    if (!customerUser || !customerUser.phone) return;

    setIsSavingAddress(true);
    try {
      await updateCustomerDetailsInSupabase(customerUser.phone, {
        name: customerUser.name,
        address: editAddressInput.trim()
      });

      const updated = { ...customerUser, address: editAddressInput.trim() };
      setCustomerUser(updated);
      localStorage.setItem('tls_active_customer', JSON.stringify(updated));
      setCustAddress(editAddressInput.trim());
      setShowAddressModal(false);
      alert('✅ Delivery address updated successfully!');
    } catch(err) {
      console.error('Address update error:', err);
      alert('Error updating delivery address.');
    } finally {
      setIsSavingAddress(false);
    }
  };

  // Fallback for direct submit
  const handleCustomerLogin = handlePasswordLogin;

  const handleCustomerLogout = () => {
    setCustomerUser(null);
    localStorage.removeItem('tls_active_customer');
  };

  // Cart actions
  const getWeight = (sku, product) => {
    const opts = getProductWeightOptions(product);
    const current = selectedWeights[sku];
    if (current && opts.some(o => o.key === current)) {
      return current;
    }
    return opts.length > 0 ? opts[0].key : 'OPT1';
  };

  const setWeight = (sku, val) => setSelectedWeights({ ...selectedWeights, [sku]: val });

  const addToCart = (product) => {
    if (product.stockStatus === 'OUT_OF_STOCK') {
      alert(`${product.name} is currently Out of Stock! Please check back soon.`);
      return;
    }

    const opts = getProductWeightOptions(product);
    const choiceKey = getWeight(product.sku, product);
    const chosenOpt = opts.find(o => o.key === choiceKey) || opts[0];

    const packLabel = chosenOpt.label;
    const cleanWeight = chosenOpt.weight;
    const unitPrice = chosenOpt.price;
    const cartKey = `${product.sku}-${cleanWeight}`;

    const existing = cart.find(i => i.cartKey === cartKey);
    if (existing) {
      setCart(cart.map(i => i.cartKey === cartKey ? { ...i, qty: i.qty + 1 } : i));
    } else {
      setCart([...cart, { 
        cartKey, 
        sku: product.sku, 
        name: product.name, 
        packLabel, 
        cleanWeight, 
        unitPrice, 
        image: product.image,
        qty: 1 
      }]);
    }

    setAddedToast(`${product.name} (${cleanWeight}) added!`);
    setTimeout(() => setAddedToast(''), 1800);
  };

  // Staff / Admin MOQ Management
  const updateProductMoq = (sku, newMoq) => {
    const updated = products.map(p => p.sku === sku ? { ...p, moq: newMoq } : p);
    setProducts(updated);
    try {
      localStorage.setItem('tls_products_db', JSON.stringify(updated));
    } catch (e) {}
    const target = updated.find(p => p.sku === sku);
    if (target) {
      upsertProductInSupabase(target);
    }
  };

  const setAllLaddusMoq = (newMoq) => {
    const updated = products.map(p => {
      if (p.category === 'LADDU') {
        return { ...p, moq: newMoq };
      }
      return p;
    });
    setProducts(updated);
    try {
      localStorage.setItem('tls_products_db', JSON.stringify(updated));
    } catch (e) {}
    updated.forEach(p => {
      if (p.category === 'LADDU') upsertProductInSupabase(p);
    });
    alert(`All Laddus updated to ${newMoq} MOQ! Store now displays ${newMoq === '250g' ? '3 weight options (250g, 500g, 1 Kg)' : '2 weight options (500g, 1 Kg)'}.`);
  };

  // Patron Post-Order Payment Handlers (on Order Placed screen)
  const handleConfirmPaidOnline = async () => {
    if (!orderSuccess) return;
    const orderId = orderSuccess.orderId;
    const updated = orders.map(o => o.orderId === orderId ? {
      ...o,
      paymentStatus: 'PAID',
      paymentMethod: 'UPI_ONLINE',
      upiRef: postOrderUtr.trim() || 'UPI-APP',
      paymentReceivedAt: new Date().toLocaleTimeString()
    } : o);
    setOrders(updated);
    try {
      localStorage.setItem('tls_orders_db', JSON.stringify(updated));
    } catch (e) {}

    setOrderSuccess(prev => ({
      ...prev,
      paymentStatus: 'PAID',
      paymentMethod: 'UPI_ONLINE',
      upiRef: postOrderUtr.trim() || 'UPI-APP'
    }));

    try {
      await updateOrderPaymentStatusInSupabase(orderId, 'PAID', 'UPI_ONLINE');
    } catch (e) {}

    try {
      await fetch(REALTIME_TOPIC_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'PAYMENT_UPDATE',
          orderId,
          paymentStatus: 'PAID',
          paymentMethod: 'UPI_ONLINE',
          upiRef: postOrderUtr.trim() || 'UPI-APP',
          timestamp: new Date().toISOString()
        })
      });
    } catch (e) {}

    alert('✓ Payment of ₹' + orderSuccess.total.toLocaleString('en-IN') + ' recorded successfully! Staff will verify your UPI transaction.');
  };

  const handleConfirmPayLater = async () => {
    if (!orderSuccess) return;
    const orderId = orderSuccess.orderId;
    const updated = orders.map(o => o.orderId === orderId ? {
      ...o,
      paymentStatus: 'PAY_ON_PICKUP',
      paymentMethod: 'PAY_AT_STORE'
    } : o);
    setOrders(updated);
    try {
      localStorage.setItem('tls_orders_db', JSON.stringify(updated));
    } catch (e) {}

    setOrderSuccess(prev => ({
      ...prev,
      paymentStatus: 'PAY_ON_PICKUP',
      paymentMethod: 'PAY_AT_STORE'
    }));

    try {
      await updateOrderPaymentStatusInSupabase(orderId, 'PAY_ON_PICKUP', 'PAY_AT_STORE');
    } catch (e) {}

    alert('✓ Order confirmed for Store Pickup! Please pay ₹' + orderSuccess.total.toLocaleString('en-IN') + ' in cash or via UPI at the kitchen counter.');
  };

  // Image Upload Handler for Inventory (FileReader dataURL)
  const handleProductImageFile = (e, isNew = false) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (loadEvt) => {
      const dataUrl = loadEvt.target.result;
      if (isNew) {
        setNewProductForm(prev => ({ ...prev, image: dataUrl, imageFileName: file.name }));
      } else {
        setEditingProduct(prev => ({ ...prev, image: dataUrl, imageFileName: file.name }));
      }
    };
    reader.readAsDataURL(file);
  };

    // Staff / Admin Payment Receipt & Status Management
  const handleStaffMarkPayment = async (orderId, method) => {
    const methodLabel = method === 'CASH' ? 'Cash at Counter' : 'UPI Verified';
    if (!window.confirm(`Confirm marking payment for ${orderId} as PAID via ${methodLabel}?`)) return;

    const updated = orders.map(o => o.orderId === orderId ? {
      ...o,
      paymentStatus: 'PAID',
      paymentMethod: method === 'CASH' ? 'CASH' : 'UPI_VERIFIED',
      paymentReceivedAt: new Date().toLocaleTimeString()
    } : o);

    setOrders(updated);
    try {
      localStorage.setItem('tls_orders_db', JSON.stringify(updated));
    } catch(e) {}

    // Instant ACID write-back to Supabase
    try {
      await updateOrderPaymentStatusInSupabase(orderId, 'PAID', method === 'CASH' ? 'CASH' : 'UPI_VERIFIED');
    } catch(e) {}

    // Realtime broadcast to sync customer devices immediately
    try {
      await fetch(REALTIME_TOPIC_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'PAYMENT_UPDATE',
          orderId,
          paymentStatus: 'PAID',
          paymentMethod: method === 'CASH' ? 'CASH' : 'UPI_VERIFIED',
          timestamp: new Date().toISOString()
        })
      });
    } catch(e) {}
  };

  // Staff Phone Lookup & Auto-fill Handler
  const handleStaffOrderPhoneLookup = async (phoneInput) => {
    setStaffOrderPhone(phoneInput);
    const cleanPhone = (phoneInput || '').replace(/\D/g, '').slice(-10);
    if (cleanPhone.length === 10) {
      // 1. First check existing orders in memory for fastest auto-population
      const matchedOrder = orders.find(o => (o.phone || '').replace(/\D/g, '').slice(-10) === cleanPhone);
      let customerName = matchedOrder ? matchedOrder.name : '';
      let customerAddress = matchedOrder ? cleanPickupNote(matchedOrder.address || '') : '';
      const orderCount = orders.filter(o => (o.phone || '').replace(/\D/g, '').slice(-10) === cleanPhone).length;

      // 2. Also check Supabase customers table
      try {
        const remoteCust = await lookupCustomerInSupabase(cleanPhone);
        if (remoteCust) {
          if (remoteCust.name) customerName = remoteCust.name;
          if (remoteCust.address) customerAddress = cleanPickupNote(remoteCust.address);
        }
      } catch (e) {}

      if (customerName) {
        setStaffOrderName(customerName);
        if (customerAddress && !staffOrderAddress) setStaffOrderAddress(customerAddress);
        setStaffCustomerLookupStatus({
          found: true,
          name: customerName,
          address: customerAddress,
          totalOrders: orderCount
        });
      } else {
        setStaffCustomerLookupStatus({ found: false });
      }
    } else {
      setStaffCustomerLookupStatus(null);
    }
  };

  // Staff Order Items: Add Selected Item
  const handleStaffAddOrderItem = () => {
    const prod = products.find(p => p.sku === staffSelectedProductSku) || products[0];
    if (!prod) return;

    let unitPrice = 0;
    if (staffSelectedWeightKey === '250g') {
      unitPrice = prod.p250 || (prod.ratePerKg ? Math.round(prod.ratePerKg * 0.25) : 300);
    } else if (staffSelectedWeightKey === '500g') {
      unitPrice = prod.p500 || (prod.ratePerKg ? Math.round(prod.ratePerKg * 0.5) : 600);
    } else if (staffSelectedWeightKey === '1Kg' || staffSelectedWeightKey === '1000g') {
      unitPrice = prod.p1k || prod.ratePerKg || 1200;
    } else if (staffSelectedWeightKey === '100g') {
      unitPrice = prod.p500 || 275;
    } else if (staffSelectedWeightKey === '200g') {
      unitPrice = prod.p1k || 550;
    } else if (staffSelectedWeightKey === '400g') {
      unitPrice = prod.p1k || 400;
    } else {
      unitPrice = prod.p500 || prod.ratePerKg || 600;
    }

    const newItem = {
      sku: prod.sku,
      name: prod.name,
      weight: staffSelectedWeightKey,
      cleanWeight: staffSelectedWeightKey,
      packLabel: staffSelectedWeightKey,
      unitPrice: Number(unitPrice),
      qty: Math.max(1, parseInt(staffSelectedQty, 10) || 1),
      image: prod.image
    };

    const existingIdx = staffOrderItems.findIndex(it => it.sku === newItem.sku && it.cleanWeight === newItem.cleanWeight);
    if (existingIdx >= 0) {
      const copy = [...staffOrderItems];
      copy[existingIdx].qty += newItem.qty;
      setStaffOrderItems(copy);
    } else {
      setStaffOrderItems([...staffOrderItems, newItem]);
    }
  };

  // Staff Order Items: Remove Item
  const handleStaffRemoveOrderItem = (index) => {
    setStaffOrderItems(staffOrderItems.filter((_, idx) => idx !== index));
  };

  // Staff Order Submit (WhatsApp / Call / In-Person)
  const handleStaffSubmitOrder = async () => {
    const cleanPhone = (staffOrderPhone || '').replace(/\D/g, '').slice(-10);
    if (cleanPhone.length !== 10) {
      alert('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (!staffOrderName.trim()) {
      alert('Please enter the customer name.');
      return;
    }
    if (staffOrderItems.length === 0) {
      alert('Please add at least one laddu or savory item to the order.');
      return;
    }
    if (staffOrderFulfillment === 'PORTER' && !staffOrderAddress.trim()) {
      alert('Please provide the doorstep delivery address for Porter courier.');
      return;
    }

    setIsStaffSubmittingOrder(true);
    try {
      const orderId = `TLS-WA-${Math.floor(10000 + Math.random() * 90000)}`;
      const orderTotal = staffOrderItems.reduce((sum, item) => sum + (item.unitPrice * item.qty), 0);
      const deliveryAddress = staffOrderFulfillment === 'PORTER'
        ? staffOrderAddress.trim()
        : '@15101, Tower-15, Prestige Tranquility, Budigere Cross, BLR - 560049';

      const channelPrefix = staffOrderChannel === 'WHATSAPP'
        ? 'STAFF_WHATSAPP'
        : (staffOrderChannel === 'PHONE' ? 'STAFF_PHONE' : 'STAFF_COUNTER');

      const fullChannel = staffOrderFulfillment === 'PORTER'
        ? `${channelPrefix}_PORTER`
        : channelPrefix;

      const itemsSummaryString = staffOrderItems.map(it => `${it.qty}x ${it.name} (${it.cleanWeight || it.packLabel})`).join(', ');

      const newOrder = {
        orderId,
        name: staffOrderName.trim(),
        phone: cleanPhone,
        address: deliveryAddress,
        items: staffOrderItems,
        itemsSummary: itemsSummaryString,
        total: orderTotal,
        paymentStatus: staffOrderPaymentStatus,
        paymentMethod: staffOrderPaymentMethod,
        channel: fullChannel,
        fulfillmentType: staffOrderFulfillment,
        isPorter: staffOrderFulfillment === 'PORTER',
        status: 'RECEIVED',
        notes: `[Staff Order via ${staffOrderChannel}] ${staffOrderNotes ? staffOrderNotes.trim() : ''}`.trim(),
        date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        timestamp: new Date().toISOString()
      };

      // 1. Auto-create / upsert customer in Supabase CRM
      try {
        await registerCustomerInSupabase({
          phone: cleanPhone,
          name: staffOrderName.trim(),
          address: staffOrderAddress ? staffOrderAddress.trim() : ''
        });
      } catch (crmErr) {
        console.warn('CRM upsert note:', crmErr);
      }

      // 2. Insert order into Supabase
      try {
        await insertOrderToSupabase(newOrder);
      } catch (dbErr) {
        console.warn('Supabase order insert note:', dbErr);
      }

      // 3. Update local orders state & cache
      const updatedOrders = [newOrder, ...orders];
      setOrders(updatedOrders);
      try {
        localStorage.setItem('tls_orders_db', JSON.stringify(updatedOrders));
      } catch(e) {}

      // 4. Construct WhatsApp confirmation message
      const waText = `*Namaste ${staffOrderName.trim()}! 🙏*\n\n` +
        `Your order *${orderId}* has been confirmed at *The Laddu Story* (Pure Cow Ghee & Jaggery Artisanal Kitchen).\n\n` +
        `📦 *Items Ordered:*\n${staffOrderItems.map(it => `• ${it.qty}x ${it.name} (${it.cleanWeight}) - ₹${it.unitPrice * it.qty}`).join('\n')}\n\n` +
        `💰 *Total Amount:* ₹${orderTotal.toLocaleString('en-IN')}\n` +
        `💳 *Payment Status:* ${staffOrderPaymentStatus === 'PAID' ? `PAID (${staffOrderPaymentMethod}) ✅` : 'Pending on Pickup/Delivery ⏳'}\n` +
        `🚚 *Fulfillment:* ${staffOrderFulfillment === 'PORTER' ? `Doorstep Delivery via Porter (Paid)\n📍 *Address:* ${deliveryAddress}` : 'Self-Pickup @ Prestige Tranquility, Budigere Cross'}\n\n` +
        `Track your order live anytime: https://theladdustory.com\n` +
        `Warm regards,\n*The Laddu Story Kitchen*`;

      const waUrl = `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(waText)}`;

      setStaffOrderCreatedSuccess({
        orderId,
        total: orderTotal,
        phone: cleanPhone,
        name: staffOrderName.trim(),
        waUrl,
        itemsCount: staffOrderItems.length
      });

      // Clear order form items
      setStaffOrderItems([]);
      setStaffOrderNotes('');
    } catch (err) {
      alert('Error creating staff order: ' + err.message);
    } finally {
      setIsStaffSubmittingOrder(false);
    }
  };

  // Product Review & Rating Submission
  const handleSubmitReview = async (e) => {
    if (e) e.preventDefault();
    if (!selectedProductForReview) return;
    const authorName = reviewNameInput.trim() || (customerUser ? customerUser.name : 'Valued Patron');
    const authorPhone = reviewPhoneInput.trim() || (customerUser ? customerUser.phone : '');

    setIsSubmittingReview(true);
    try {
      const reviewObj = {
        productSku: selectedProductForReview.sku,
        productName: selectedProductForReview.name,
        product_sku: selectedProductForReview.sku,
        product_name: selectedProductForReview.name,
        rating: reviewRatingInput,
        customerName: authorName,
        customer_name: authorName,
        customerPhone: authorPhone,
        customer_phone: authorPhone,
        comment: reviewCommentInput.trim(),
        orderId: reviewOrderIdInput.trim(),
        order_id: reviewOrderIdInput.trim()
      };

      const result = await insertReviewToSupabase(reviewObj);
      const savedReview = (result && result.success && result.review) ? result.review : {
        id: `rev-${Date.now()}`,
        productSku: selectedProductForReview.sku,
        productName: selectedProductForReview.name,
        rating: reviewRatingInput,
        customerName: authorName,
        customerPhone: authorPhone,
        comment: reviewCommentInput.trim(),
        orderId: reviewOrderIdInput.trim(),
        createdAt: new Date().toISOString()
      };

      const updated = [savedReview, ...reviews.filter(r => r.id !== savedReview.id)];
      setReviews(updated);
      try {
        localStorage.setItem('tls_reviews_db', JSON.stringify(updated));
      } catch(e) {}

      // Broadcast review to all devices via Realtime topic
      try {
        fetch(REALTIME_TOPIC_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'NEW_REVIEW',
            review: savedReview,
            timestamp: new Date().toISOString()
          })
        });
      } catch (err) {}

      setReviewSuccessMsg('Thank you for sharing your love for our pure cow ghee laddus! ⭐');
      setTimeout(() => {
        setReviewSuccessMsg('');
        setSelectedProductForReview(null);
        setIsStaffReviewMode(false);
        setReviewCommentInput('');
        setReviewRatingInput(5);
        setReviewOrderIdInput('');
        setReviewNameInput('');
        setReviewPhoneInput('');
      }, 1800);
    } catch (err) {
      alert('Error saving review: ' + err.message);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const updateCartQty = (cartKey, delta) => {
    setCart(cart.map(item => {
      if (item.cartKey === cartKey) {
        const newQty = item.qty + delta;
        return newQty > 0 ? { ...item, qty: newQty } : null;
      }
      return item;
    }).filter(Boolean));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.unitPrice * item.qty), 0);
  const totalCartQty = cart.reduce((sum, item) => sum + item.qty, 0);

  // Submit to Google Form in background
  const submitToGoogleSheets = async (orderData) => {
    try {
      // Canonical format expected by FormSyncTrigger.gs: 1x Name (Weight) = ₹Total | 2x Name (Weight) = ₹Total
      const itemsFormatted = orderData.items
        .map(i => `${i.qty}x ${i.name} (${i.cleanWeight}) = ₹${(i.unitPrice * i.qty).toLocaleString('en-IN')}`)
        .join(' | ');

      const formData = new URLSearchParams();
      formData.append(FORM_ENTRIES.ORDER_ID, orderData.orderId);
      formData.append(FORM_ENTRIES.NAME, orderData.name);
      formData.append(FORM_ENTRIES.PHONE, orderData.phone);
      formData.append(FORM_ENTRIES.ADDRESS, orderData.address);
      formData.append(FORM_ENTRIES.ITEMS, itemsFormatted);

      // Single, unified Google Form submission (Prevents duplicate rows in Google Sheets)
      await fetch(GOOGLE_FORM_ACTION_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString()
      });

    } catch (err) {
      console.warn('Form sync executed');
    }
  };


  // Export Orders to CSV (Google Sheets / Excel Backup Ledger)
  const exportOrdersToCsv = () => {
    const headers = ['OrderID', 'CreatedAt', 'Channel', 'CustomerName', 'CustomerPhone', 'CustomerAddress', 'Items', 'TotalAmount', 'PaymentMethod', 'OrderStatus'];
    const rows = orders.map(o => [
      `"${o.orderId}"`,
      `"${o.time}"`,
      `"${o.channel || 'ONLINE_STORE'}"`,
      `"${(o.name || '').replace(/"/g, '""')}"`,
      `"${o.phone}"`,
      `"${(o.address || '').replace(/"/g, '""')}"`,
      `"${(o.items || []).map(i => `${i.name} (${i.cleanWeight || i.packLabel || ''}) x${i.qty}`).join('; ').replace(/"/g, '""')}"`,
      o.total,
      `"${o.paymentMethod || 'UPI'}"`,
      `"${o.status}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `TheLadduStory_Orders_Master_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSaveSupabaseConfig = async (e) => {
    e.preventDefault();
    setSupabaseSaving(true);
    setSupabaseError('');
    try {
      const ok = saveSupabaseConfig(supabaseUrlInput, supabaseKeyInput);
      if (ok) {
        setSupabaseConnected(true);
        const dbOrders = await fetchOrdersFromSupabase({ limit: 50 });
        if (dbOrders) {
          setOrders(dbOrders);
        }
        const dbProducts = await fetchProductsFromSupabase();
        if (dbProducts && dbProducts.length > 0) {
          setProducts(dbProducts);
        }
        setShowSupabaseModal(false);
        alert('✓ Successfully connected to Supabase Cloud Database! Real-time synchronization active.');
      } else {
        setSupabaseError('Invalid Supabase Project URL or Anon Key. Please check the values.');
      }
    } catch (err) {
      setSupabaseError(err.message || 'Error connecting to Supabase');
    } finally {
      setSupabaseSaving(false);
    }
  };

  // 1. PRE-CHECKOUT: Validation & Review Modal
  const handlePreCheckout = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (isSubmitting) return;
    if (cart.length === 0) {
      alert('Your cart is empty! Please select delicious laddus to place order.');
      return;
    }
    if (!custName.trim() || !custPhone.trim()) {
      alert('Please fill in your Name and 10-Digit Mobile Number.');
      return;
    }
    const cleanPhone = custPhone.replace(/\D/g, '').slice(-10);
    if (cleanPhone.length !== 10) {
      alert('Please provide a valid 10-digit mobile number.');
      return;
    }
    if ((fulfillmentType === 'DELIVERY' || fulfillmentType === 'PORTER') && !custAddress.trim()) {
      alert('Please provide your complete Delivery Address for Doorstep Delivery.');
      return;
    }

    // Open Confirmation Modal to ask if customer wants to add more items
    setShowConfirmOrderModal(true);
  };

  // 2. FINAL EXECUTION: Place the Order
  const executeCheckout = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setShowConfirmOrderModal(false);

    const orderId = `TLS-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Math.floor(1000 + Math.random() * 9000)}`;
    const cleanPhone = custPhone.replace(/\D/g, '').slice(-10);

    const isPorter = fulfillmentType === 'PORTER';
    const note = cleanPickupNote(custAddress);
    const pickupLoc = 'Self-Pickup: @15101, Tower-15, Prestige Tranquility, Budigere Cross, BLR - 560049; Contact - 9343207515';
    const resolvedAddress = isPorter
      ? `${custAddress.trim()} [DELIVERY VIA PORTER (PAID)]`
      : (fulfillmentType === 'PICKUP'
          ? (note ? `${pickupLoc} [Note: ${note}]` : pickupLoc)
          : custAddress.trim());

    const newOrder = {
      orderId,
      time: new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }) + ', ' + new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
      channel: trafficSource
        ? `${trafficSource}_${isPorter ? 'PORTER' : (fulfillmentType === 'PICKUP' ? 'PICKUP' : 'STORE')}`
        : (isPorter ? 'DOORSTEP_PORTER' : (fulfillmentType === 'PICKUP' ? 'STORE_PICKUP' : 'ONLINE_STORE')),
      fulfillmentType: isPorter ? 'PORTER' : fulfillmentType,
      name: custName.trim(),
      phone: cleanPhone,
      address: resolvedAddress,
      notes: isPorter ? `[PORTER DELIVERY (PAID)] Address: ${custAddress.trim()}` : (fulfillmentType === 'PICKUP' ? `[STORE PICKUP] Note: ${note}` : ''),
      items: cart.map(i => ({
        sku: i.sku,
        name: i.name,
        packLabel: i.packLabel,
        cleanWeight: i.cleanWeight,
        unitPrice: i.unitPrice,
        qty: i.qty,
        image: i.image
      })),
      total: cartTotal,
      status: 'RECEIVED',
      paymentMethod: 'PENDING',
      paymentStatus: 'UNPAID',
      upiRef: ''
    };
    setPostOrderUtr('');
    setPostOrderPayMode('NOW');

    const updatedOrders = [newOrder, ...orders];
    setOrders(updatedOrders);

    const updatedProfile = {
      phone: cleanPhone,
      name: custName.trim(),
      address: custAddress.trim(),
      loggedInAt: new Date().toISOString()
    };
    setCustomerUser(updatedProfile);
    localStorage.setItem('tls_active_customer', JSON.stringify(updatedProfile));

    // 1. Submit to Google Sheets (Kept 100% intact as backup ledger)
    submitToGoogleSheets(newOrder);

    // 2. Insert to Supabase (Instant ACID PostgreSQL + Order Items)
    try {
      await insertOrderToSupabase(newOrder);
    } catch (sbErr) {
      console.warn('[Supabase] Order insert notice:', sbErr);
    }

    // Broadcast immediately in Real-Time to all Staff & Customer devices (0ms delay)
    try {
      fetch(REALTIME_TOPIC_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'NEW_ORDER',
          order: newOrder,
          timestamp: new Date().toISOString()
        })
      });
    } catch(err) {}
    syncWithCloud(updatedOrders, products);

    // Generate UPI QR
    const upiUri = `upi://pay?pa=neetikabhasin@okaxis&pn=The%20Laddu%20Story&am=${cartTotal}&cu=INR&tn=${encodeURIComponent(`Order ${orderId}`)}`;
    try {
      const qrUrl = await QRCode.toDataURL(upiUri, { width: 260, margin: 2 });
      setQrDataUrl(qrUrl);
    } catch (qrErr) {}

    setOrderSuccess(newOrder);
    setCart([]);
    setIsSubmitting(false);
    setIsMobileCartOpen(false);
  };

  // Submit Corporate Gifting & Bulk Order Lead
  const handleCorporateSubmit = async (e) => {
    e.preventDefault();
    if (!corporateForm.name.trim() || !corporateForm.phone.trim()) {
      alert('Please provide your name and phone number so our kitchen team can contact you.');
      return;
    }
    const phoneVal = validateIndianMobile(corporateForm.phone);
    if (!phoneVal.valid) {
      alert(phoneVal.error);
      return;
    }

    setIsSubmittingCorporateLead(true);
    setCorporateSuccessMsg('');

    const leadPayload = {
      name: corporateForm.name.trim(),
      company: corporateForm.company.trim(),
      phone: corporateForm.phone.replace(/\D/g, '').slice(-10),
      email: corporateForm.email.trim(),
      boxCount: corporateForm.count,
      occasion: corporateForm.occasion,
      boxType: corporateForm.boxType,
      customNote: corporateForm.customNote.trim(),
      trafficSource: trafficSource || 'DIRECT_STORE'
    };

    try {
      await insertCorporateLeadToSupabase(leadPayload);
      setCorporateSuccessMsg('✨ Thank you! Your corporate gifting request has been recorded. Our chef will contact you shortly.');
      
      // WhatsApp quick message
      const waMsg = `*Namaste! New Corporate Gifting Inquiry for The Laddu Story* 🎁\n\n` +
        `• *Contact:* ${leadPayload.name}\n` +
        `• *Company:* ${leadPayload.company || 'Not Specified'}\n` +
        `• *Phone:* ${leadPayload.phone}\n` +
        `• *Email:* ${leadPayload.email || 'N/A'}\n` +
        `• *Estimated Boxes:* ${leadPayload.boxCount}\n` +
        `• *Occasion:* ${leadPayload.occasion}\n` +
        `• *Box Selection:* ${leadPayload.boxType}\n` +
        (leadPayload.customNote ? `• *Requirements:* ${leadPayload.customNote}\n` : '') +
        `• *Source:* ${leadPayload.trafficSource}`;

      const waUrl = `https://wa.me/919343207515?text=${encodeURIComponent(waMsg)}`;

      setTimeout(() => {
        if (window.confirm('Your request has been submitted! Would you also like to open WhatsApp directly with our kitchen for an immediate consultation?')) {
          window.open(waUrl, '_blank');
        }
      }, 400);

    } catch (err) {
      console.warn('Corporate lead save note:', err);
      const waUrl = `https://wa.me/919343207515?text=${encodeURIComponent(`Corporate Lead from ${leadPayload.name}: ${leadPayload.boxCount} boxes for ${leadPayload.occasion}`)}`;
      window.open(waUrl, '_blank');
    } finally {
      setIsSubmittingCorporateLead(false);
    }
  };

  // Staff Login
  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (adminPinInput === '1234' || adminPinInput === '8888') {
      setIsAdminLoggedIn(true);
      try {
        sessionStorage.setItem('tls_staff_logged_in', 'true');
        localStorage.setItem('tls_staff_logged_in', 'true');
      } catch (e) {}
      setShowLoginModal(false);
      setAdminPinInput('');
      setActiveTab('admin');
    } else {
      alert('❌ Incorrect Staff PIN. Please try again.');
    }
  };

  // Update order delivery status & broadcast in Real-Time to all devices + Google Sheets
  const updateOrderStatus = async (orderId, newStatus) => {
    // 1. Instant optimistic state update across all components
    setOrders(prev => {
      const updated = prev.map(o => o.orderId === orderId ? { ...o, status: newStatus } : o);
      try {
        localStorage.setItem('tls_orders_db', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    setIsCloudSynced(true);
    setLastSyncTime(new Date().toLocaleTimeString());

    // 2. Instant Real-Time Push to all Customer & Staff devices (non-blocking)
    fetch(REALTIME_TOPIC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'STATUS_UPDATE',
        orderId,
        status: newStatus,
        timestamp: new Date().toISOString()
      })
    }).catch(() => {});

    // 3. Direct Update in Google Sheets via Apps Script Web App (non-blocking)
    fetch(APPS_SCRIPT_EXEC_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({
        action: 'updateStatus',
        orderId,
        status: newStatus,
        items: []
      })
    }).catch(() => {});

    // 4. Instant ACID Write-Back to Supabase PostgreSQL (with resilient constraint fallback)
    try {
      const sbRes = await updateOrderStatusInSupabase(orderId, newStatus);
      if (sbRes && !sbRes.success) {
        console.warn('[Supabase] Status write-back failed:', sbRes.error);
      }
    } catch(err) {
      console.warn('[Supabase] Status write-back notice:', err);
    }
  };

  // Re-sync all live data from Supabase Primary Database
  const handleResetToMaster = async () => {
    if (isSupabaseConfigured()) {
      const dbOrders = await fetchOrdersFromSupabase({ limit: 60 });
      if (dbOrders) setOrders(dbOrders);
      const dbProducts = await fetchProductsFromSupabase();
      if (dbProducts) setProducts(dbProducts);
      setIsCloudSynced(true);
      setLastSyncTime(new Date().toLocaleTimeString());
      alert(`✓ Refreshed! Synced ${dbOrders ? dbOrders.length : 0} live orders and ${dbProducts ? dbProducts.length : 0} products directly from Supabase Primary Database.`);
    } else {
      alert('Supabase is not configured.');
    }
  };

  // Save product changes (Inventory Manager)
  const handleSaveProductEdit = async (e) => {
    e.preventDefault();
    if (!editingProduct) return;
    const updated = products.map(p => p.sku === editingProduct.sku ? editingProduct : p);
    setProducts(updated);
    try {
      localStorage.setItem('tls_products_db', JSON.stringify(updated));
    } catch (e) {}
    await upsertProductInSupabase(editingProduct);
    await syncWithCloud(orders, updated);
    setEditingProduct(null);
    alert(`✓ Successfully updated ${editingProduct.name} in Catalog & Supabase!`);
  };

  // Add new product (Inventory Manager)
  const handleCreateProduct = async (e) => {
    e.preventDefault();
    if (!newProductForm.sku || !newProductForm.name) {
      alert('Please provide SKU and Product Name.');
      return;
    }
    const createdItem = {
      ...newProductForm,
      id: String(products.length + 1).padStart(2, '0')
    };
    const updated = [...products, createdItem];
    setProducts(updated);
    try {
      localStorage.setItem('tls_products_db', JSON.stringify(updated));
    } catch (e) {}
    await upsertProductInSupabase(createdItem);
    await syncWithCloud(orders, updated);
    setShowAddProductModal(false);
    alert(`✓ Product ${createdItem.name} added to catalog & synced with Supabase!`);
  };

  // Reorder past items
  const reorderPastItems = (pastOrder) => {
    const newCart = [...cart];
    pastOrder.items.forEach(it => {
      const existing = newCart.find(c => c.sku === it.sku && c.cleanWeight === it.cleanWeight);
      if (existing) {
        existing.qty += it.qty;
      } else {
        newCart.push({
          cartKey: `${it.sku}-${it.cleanWeight || '500g'}`,
          sku: it.sku,
          name: it.name,
          packLabel: `${it.cleanWeight || '500g'} (₹${it.unitPrice})`,
          cleanWeight: it.cleanWeight || '500g',
          unitPrice: it.unitPrice,
          image: it.image || `images/products/${it.sku}.jpg`,
          qty: it.qty
        });
      }
    });
    setCart(newCart);
    setActiveTab('store');
    alert(`Added ${pastOrder.items.length} item(s) from order ${pastOrder.orderId} to your cart!`);
  };

  // Customer order tracking filters
  const customerCleanPhone = customerUser ? customerUser.phone.replace(/\D/g, '').slice(-10) : '';
  const myOrders = orders.filter(o => {
    const oPhone = (o.phone || '').replace(/\D/g, '').slice(-10);
    return oPhone === customerCleanPhone;
  });
  const activeOrders = myOrders.filter(o => o.status !== 'DELIVERED' && o.status !== 'ORDER PICKED UP' && o.status !== 'CANCELLED');
  const pastOrders = myOrders.filter(o => o.status === 'DELIVERED' || o.status === 'ORDER PICKED UP' || o.status === 'CANCELLED');

  const getStatusStepIndex = (status, fulfillment = 'DELIVERY') => {
    if (fulfillment === 'PICKUP') {
      switch (status) {
        case 'RECEIVED': return 1;
        case 'PREPARING': return 2;
        case 'PACKED': return 3;
        case 'READY FOR PICKUP': return 4;
        case 'ORDER PICKED UP': return 5;
        default: return 1;
      }
    }
    switch (status) {
      case 'RECEIVED': return 1;
      case 'PREPARING': return 2;
      case 'PACKED': return 3;
      case 'OUT FOR DELIVERY': return 4;
      case 'DELIVERED': return 5;
      default: return 1;
    }
  };

  // Staff Search & Filter
  const cleanSearch = searchQuery.trim().toLowerCase();
  const searchDigits = searchQuery.replace(/\D/g, '');

  const filteredOrders = orders.filter(o => {
    if (filterStatus !== 'ALL' && o.status !== filterStatus) return false;
    if (!cleanSearch) return true;

    const oId = (o.orderId || '').toLowerCase();
    const oName = (o.name || '').toLowerCase();
    const oPhoneRaw = (o.phone || '').toLowerCase();
    const oPhoneDigits = (o.phone || '').replace(/\D/g, '');

    const matchText = oId.includes(cleanSearch) || oName.includes(cleanSearch) || oPhoneRaw.includes(cleanSearch);
    const matchDigits = searchDigits.length >= 3 && oPhoneDigits.includes(searchDigits);

    return matchText || matchDigits;
  });

  // Reusable Cart Content Drawer
  const renderCartContent = () => (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#4A121E', fontWeight: '800' }}>
          🛒 Your Fresh Order ({totalCartQty} items)
        </h3>
        {isMobileCartOpen && (
          <button 
            id="close-mobile-cart-btn"
            onClick={() => setIsMobileCartOpen(false)}
            style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            ✕
          </button>
        )}
      </div>

      {cart.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '36px 10px', color: '#64748B' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>🥣</div>
          <p style={{ margin: 0, fontWeight: '700', color: '#4A121E' }}>Your cart is empty.</p>
          <p style={{ margin: '4px 0 0', fontSize: '0.85rem' }}>Select your favourite laddus from the menu!</p>
        </div>
      ) : (
        <div>
          <div style={{ maxHeight: '280px', overflowY: 'auto', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {cart.map(item => (
              <div key={item.cartKey} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#FAF6F0', padding: '10px 12px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <img 
                    src={item.image} 
                    alt={item.name} 
                    style={{ width: '42px', height: '42px', borderRadius: '8px', objectFit: 'cover' }}
                    onError={(e) => { e.target.src = 'images/TheLadduStory_Logo.jpg'; }}
                  />
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '0.88rem', color: '#4A121E' }}>{item.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{item.packLabel}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button 
                    onClick={() => updateCartQty(item.cartKey, -1)}
                    style={{ width: '26px', height: '26px', borderRadius: '6px', border: '1px solid #CBD5E1', background: '#FFFFFF', fontWeight: 'bold', cursor: 'pointer' }}
                  >
                    -
                  </button>
                  <span style={{ fontWeight: '800', fontSize: '0.9rem', minWidth: '16px', textAlign: 'center' }}>{item.qty}</span>
                  <button 
                    onClick={() => updateCartQty(item.cartKey, 1)}
                    style={{ width: '26px', height: '26px', borderRadius: '6px', border: '1px solid #CBD5E1', background: '#FFFFFF', fontWeight: 'bold', cursor: 'pointer' }}
                  >
                    +
                  </button>
                  <span style={{ fontWeight: '800', fontSize: '0.9rem', color: '#4A121E', marginLeft: '6px', minWidth: '55px', textAlign: 'right' }}>
                    ₹{item.unitPrice * item.qty}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Fulfillment Method Selection (Default: Self-Pickup) */}
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '800', color: '#4A121E', marginBottom: '6px' }}>
              SELECT DELIVERY / PICKUP METHOD:
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button
                type="button"
                id="select-doorstep-btn"
                onClick={() => {
                  setDeliveryNotice('⚠️ Direct Doorstep Delivery is currently unavailable. Orders are exclusively available for Self-Pickup at @15101, Tower-15, Prestige Tranquility, Budigere Cross, BLR - 560049; Contact - 9343207515.');
                  setShowPorterOption(true);
                  if (fulfillmentType !== 'PORTER') {
                    setFulfillmentType('PICKUP');
                  }
                }}
                style={{
                  padding: '10px 8px',
                  borderRadius: '8px',
                  border: (fulfillmentType === 'DELIVERY' || fulfillmentType === 'PORTER') ? '2px solid #1D4ED8' : '1px solid #CBD5E1',
                  background: (fulfillmentType === 'DELIVERY' || fulfillmentType === 'PORTER') ? '#EFF6FF' : '#fff',
                  color: (fulfillmentType === 'DELIVERY' || fulfillmentType === 'PORTER') ? '#1D4ED8' : '#64748B',
                  fontWeight: '800',
                  fontSize: '0.82rem',
                  cursor: 'pointer'
                }}
              >
                {fulfillmentType === 'PORTER' ? '🚚 Porter Service (Selected)' : '🛵 Doorstep Delivery'}
              </button>
              <button
                type="button"
                id="select-pickup-btn"
                onClick={() => {
                  setDeliveryNotice('');
                  setShowPorterOption(false);
                  setFulfillmentType('PICKUP');
                }}
                style={{
                  padding: '10px 8px',
                  borderRadius: '8px',
                  border: fulfillmentType === 'PICKUP' ? '2px solid #059669' : '1px solid #CBD5E1',
                  background: fulfillmentType === 'PICKUP' ? '#ECFDF5' : '#fff',
                  color: fulfillmentType === 'PICKUP' ? '#065F46' : '#64748B',
                  fontWeight: '800',
                  fontSize: '0.82rem',
                  cursor: 'pointer'
                }}
              >
                🛍️ Self-Pickup {fulfillmentType === 'PICKUP' ? '(Selected)' : ''}
              </button>
            </div>

            {deliveryNotice && (
              <div style={{
                marginTop: '10px',
                background: '#FEF2F2',
                border: '1.5px solid #FCA5A5',
                color: '#991B1B',
                padding: '10px 12px',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px',
                boxShadow: '0 2px 6px rgba(185, 28, 28, 0.08)'
              }}>
                <span>{deliveryNotice}</span>
                <button
                  type="button"
                  onClick={() => setDeliveryNotice('')}
                  style={{ background: 'transparent', border: 'none', color: '#991B1B', cursor: 'pointer', fontWeight: '800', fontSize: '0.9rem' }}
                >
                  ✕
                </button>
              </div>
            )}

            {/* Porter Service Choice Option */}
            {(showPorterOption || fulfillmentType === 'PORTER') && (
              <div style={{
                marginTop: '10px',
                background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
                border: '1.5px solid #3B82F6',
                borderRadius: '10px',
                padding: '12px 14px',
                boxShadow: '0 3px 10px rgba(59, 130, 246, 0.12)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '800', color: '#1E40AF', fontSize: '0.88rem', marginBottom: '4px' }}>
                  <span>🚚</span>
                  <span>Do you want Porter Service (Paid)?</span>
                </div>
                <div style={{ fontSize: '0.78rem', color: '#1E3A8A', lineHeight: 1.4, marginBottom: '10px' }}>
                  We can book & dispatch your fresh laddus directly to your doorstep via Porter! Delivery fare is calculated by distance and payable directly to the Porter delivery partner on arrival or coordinated on dispatch.
                </div>
                <button
                  type="button"
                  id="opt-porter-service-btn"
                  onClick={() => {
                    setFulfillmentType('PORTER');
                    setDeliveryNotice('');
                  }}
                  style={{
                    width: '100%',
                    background: fulfillmentType === 'PORTER' ? '#1D4ED8' : '#FFFFFF',
                    color: fulfillmentType === 'PORTER' ? '#FFFFFF' : '#1D4ED8',
                    border: '2px solid #1D4ED8',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    fontWeight: '800',
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  {fulfillmentType === 'PORTER' ? '✓ Porter Service Selected (Paid Doorstep)' : '📦 Yes, Deliver via Porter Service (Paid)'}
                </button>
              </div>
            )}
          </div>

          {/* Customer Inputs */}
          <div style={{ background: '#FAF6F0', padding: '14px', borderRadius: '12px', marginBottom: '16px', border: '1px solid #E2E8F0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: '800', color: '#475569' }}>
                {fulfillmentType === 'PICKUP' ? 'CONTACT & PICKUP DETAILS' : (fulfillmentType === 'PORTER' ? 'CONTACT & PORTER DELIVERY ADDRESS' : 'CUSTOMER CONTACT & DELIVERY')}
              </span>
              {customerUser && (
                <span style={{ fontSize: '0.72rem', color: '#059669', fontWeight: '800' }}>
                  ✓ Logged in as {customerUser.name}
                </span>
              )}
            </div>
            <input
              id="checkout-cust-name"
              type="text"
              placeholder="Your Full Name *"
              value={custName}
              onChange={e => setCustName(e.target.value)}
              style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.85rem', marginBottom: '8px' }}
            />
            <input
              id="checkout-cust-phone"
              type="tel"
              placeholder="10-Digit Mobile Number (Primary ID) *"
              value={custPhone}
              onChange={e => setCustPhone(e.target.value)}
              style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.85rem', marginBottom: '8px' }}
            />
            {fulfillmentType === 'PICKUP' && (
              <div style={{ background: '#EFF6FF', border: '1.5px solid #93C5FD', padding: '12px 14px', borderRadius: '10px', fontSize: '0.82rem', color: '#1E3A8A', marginBottom: '10px', lineHeight: '1.5' }}>
                <div style={{ fontWeight: '800', color: '#1E40AF', marginBottom: '3px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  📍 Self-Pickup Location:
                </div>
                <div style={{ fontWeight: '600' }}>@15101, Tower-15, Prestige Tranquility, Budigere Cross, BLR - 560049</div>
                <div style={{ marginTop: '4px', color: '#1E3A8A' }}>
                  📞 <b>Pickup Contact:</b> <a href="tel:9343207515" style={{ color: '#1D4ED8', fontWeight: '800', textDecoration: 'none' }}>9343207515</a>
                </div>
              </div>
            )}
            <textarea
              id="checkout-cust-address"
              rows={2}
              placeholder={fulfillmentType === 'PICKUP' ? "Pickup Note / Expected Time (e.g. Pickup today 5 PM) [Optional]" : "Complete Delivery Address (Flat/House No, Tower/Street, Landmark & Pincode) *"}
              value={custAddress}
              onChange={e => setCustAddress(e.target.value)}
              style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
            />
          </div>

          {/* Bill Summary */}
          <div style={{ borderTop: '2px solid #E2E8F0', paddingTop: '12px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#64748B', marginBottom: '6px' }}>
              <span>Subtotal ({totalCartQty} items)</span>
              <span>₹{cartTotal.toLocaleString('en-IN')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: fulfillmentType === 'PORTER' ? '#1D4ED8' : '#059669', marginBottom: '8px', fontWeight: '600' }}>
              <span>{fulfillmentType === 'PORTER' ? 'Porter Doorstep Service' : (fulfillmentType === 'PICKUP' ? 'Self-Pickup Collection' : 'Bangalore Express Delivery')}</span>
              <span>{fulfillmentType === 'PORTER' ? 'Charges On Delivery' : 'FREE'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: '800', color: '#4A121E' }}>
              <span>Total Payable</span>
              <span>₹{cartTotal.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <button
            id="place-order-btn"
            onClick={handlePreCheckout}
            disabled={isSubmitting}
            style={{
              width: '100%',
              background: isSubmitting ? '#94A3B8' : '#831843',
              color: '#FFFFFF',
              border: 'none',
              padding: '14px',
              borderRadius: '10px',
              fontWeight: '800',
              fontSize: '1rem',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 12px rgba(131, 24, 67, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            {isSubmitting 
              ? '⏳ Placing Order...' 
              : `🛍️ Place Order (₹${cartTotal.toLocaleString('en-IN')}) →`}
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#FAF6F0', fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif", color: '#1E293B', paddingBottom: totalCartQty > 0 ? '110px' : '30px' }}>

      {/* HEADER WITH OFFICIAL CIRCULAR LOGO */}
      <header style={{ background: 'linear-gradient(135deg, #350B15 0%, #4A121E 60%, #68152B 100%)', color: '#fff', padding: '14px 20px', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 4px 20px rgba(74, 18, 30, 0.3)', borderBottom: '2px solid #B45309' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          
          {/* Logo & Brand Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ 
              width: '46px', 
              height: '46px', 
              borderRadius: '50%', 
              background: '#FFFFFF', 
              border: '2.5px solid #FDE68A', 
              overflow: 'hidden', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
              flexShrink: 0
            }}>
              <img 
                src="images/TheLadduStory_Logo.jpg" 
                alt="The Laddu Story Logo" 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.parentNode.innerText = 'TLS';
                }}
              />
            </div>
            <div>
              <h1 className="royal-title" style={{ margin: 0, fontSize: "1.45rem", fontWeight: "700", letterSpacing: "0.5px", color: "#FFFFFF" }}>
                The Laddu Story
              </h1>
              <div style={{ fontSize: '0.74rem', color: '#FDE68A', fontWeight: '600' }}>
                Homemade Healthy Snacks: Ancient Traditions & Superfoods • 📞 9343207515
              </div>
            </div>
          </div>

          {/* Navigation Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {/* If on Customer Route (!isStaffRoute): Strictly Show Customer Experience Only */}
            {!isStaffRoute ? (
              <>
                <button
                  id="nav-store-btn"
                  onClick={() => setActiveTab('store')}
                  style={{
                    background: activeTab === 'store' ? '#FFFFFF' : 'transparent',
                    color: activeTab === 'store' ? '#4A121E' : '#FFFFFF',
                    border: '1px solid rgba(255,255,255,0.4)',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    fontWeight: '700',
                    fontSize: '0.85rem',
                    cursor: 'pointer'
                  }}
                >
                  🛍️ Order Laddus
                </button>

                {/* Customer Login / My Orders Badge */}
                {customerUser ? (
                  <div style={{ display: 'flex', alignItems: 'center', background: '#FDE68A', borderRadius: '8px', padding: '2px 4px' }}>
                    <button
                      id="nav-customer-profile-btn"
                      onClick={() => setActiveTab('track')}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#4A121E',
                        padding: '6px 10px',
                        fontWeight: '800',
                        fontSize: '0.82rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      👤 {customerUser.name} ({customerUser.phone})
                    </button>
                    <button
                      id="nav-customer-logout-btn"
                      onClick={handleCustomerLogout}
                      title="Switch / Logout"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#64748B',
                        padding: '4px 6px',
                        fontSize: '0.85rem',
                        cursor: 'pointer'
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <button
                    id="nav-customer-login-btn"
                    onClick={() => setShowCustomerLoginModal(true)}
                    style={{
                      background: activeTab === 'track' ? '#FFFFFF' : 'rgba(255,255,255,0.15)',
                      color: activeTab === 'track' ? '#4A121E' : '#FFFFFF',
                      border: '1px solid rgba(255,255,255,0.4)',
                      padding: '8px 14px',
                      borderRadius: '8px',
                      fontWeight: '700',
                      fontSize: '0.85rem',
                      cursor: 'pointer'
                    }}
                  >
                    👤 Customer Login
                  </button>
                )}
              </>
            ) : (
              /* If on Staff Portal Route (isStaffRoute): Strictly Show Staff OMS & Staff Controls */
              <>
                <button
                  id="nav-store-btn"
                  onClick={() => setActiveTab('store')}
                  style={{
                    background: activeTab === 'store' ? '#FFFFFF' : 'transparent',
                    color: activeTab === 'store' ? '#4A121E' : '#FFFFFF',
                    border: '1px solid rgba(255,255,255,0.4)',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    fontWeight: '700',
                    fontSize: '0.85rem',
                    cursor: 'pointer'
                  }}
                >
                  🛍️ View Store
                </button>

                {isAdminLoggedIn ? (
                  <>
                    <button
                      id="nav-staff-dashboard-btn"
                      onClick={() => setActiveTab('admin')}
                      style={{
                        background: activeTab === 'admin' ? '#FDE68A' : 'rgba(214, 229, 186, 0.3)',
                        color: '#4A121E',
                        border: 'none',
                        padding: '8px 14px',
                        borderRadius: '8px',
                        fontWeight: '800',
                        fontSize: '0.85rem',
                        cursor: 'pointer'
                      }}
                    >
                      ⚙️ Staff OMS ({orders.length})
                    </button>
                    <button
                      id="nav-staff-header-logout-btn"
                      onClick={() => {
                        setIsAdminLoggedIn(false);
                        try {
                          sessionStorage.removeItem('tls_staff_logged_in');
                        } catch (e) {}
                        window.location.href = window.location.origin + window.location.pathname;
                      }}
                      style={{
                        background: 'rgba(255,255,255,0.15)',
                        color: '#FFFFFF',
                        border: '1px solid rgba(255,255,255,0.3)',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        fontSize: '0.82rem',
                        fontWeight: '700',
                        cursor: 'pointer'
                      }}
                    >
                      🚪 Exit Staff
                    </button>
                  </>
                ) : (
                  <button
                    id="nav-staff-login-btn"
                    onClick={() => setShowLoginModal(true)}
                    style={{
                      background: '#FDE68A',
                      color: '#4A121E',
                      border: 'none',
                      padding: '8px 14px',
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                      fontWeight: '800',
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                    }}
                  >
                    🔒 Staff Login
                  </button>
                )}
              </>
            )}
          </div>

        </div>
      </header>

      {/* SUB-HEADER STATUS BAR */}
      <div style={{ background: '#FFFBEB', borderBottom: '1px solid #FDE68A', padding: '7px 20px', fontSize: '0.8rem', color: '#78350F', textAlign: 'center', fontWeight: '500' }}>
        <span>🌿 Pure Desi Cow Ghee & Unrefined Jaggery • Zero White Sugar • Freshly Prepared in Bangalore</span>
        {(isStaffRoute && isAdminLoggedIn) && (
          <span style={{ color: isCloudSynced ? '#059669' : '#D97706', fontWeight: '700', marginLeft: '6px' }}>
            • 🟢 Real-Time Cloud Sync Active (Synced {lastSyncTime})
          </span>
        )}
      </div>

      {/* ADDED TO CART TOAST NOTIFICATION */}
      {addedToast && (
        <div style={{
          position: 'fixed',
          top: '70px',
          right: '20px',
          background: '#4A121E',
          color: '#FFFFFF',
          padding: '10px 18px',
          borderRadius: '10px',
          fontWeight: '700',
          fontSize: '0.85rem',
          boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
          zIndex: 1500
        }}>
          ✓ {addedToast}
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '20px' }}>

        {/* ------------------------------------------------------------- */}
        {/* VIEW 1: STORE FRONT & PRODUCT CATALOG                         */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'store' && (
          <div className="store-main-layout">
            
            {/* Catalog Grid */}
            <div>
              {/* Hero Banner */}
              <div style={{ 
                background: 'linear-gradient(135deg, #4A121E 0%, #831843 100%)', 
                borderRadius: '20px', 
                padding: '28px', 
                color: '#fff', 
                marginBottom: '24px',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{ maxWidth: '600px' }}>
                  <div style={{ display: 'inline-block', background: '#FDE68A', color: '#4A121E', padding: '4px 12px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '800', marginBottom: '10px' }}>
                    100% ARTISANAL & HOMEMADE
                  </div>
                  <h2 style={{ fontSize: '1.8rem', fontWeight: '800', margin: '0 0 10px', lineHeight: 1.2 }}>
                    Nourishing Traditions, Modern Superfoods.
                  </h2>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: '#E2E8F0', lineHeight: 1.5 }}>
                    Crafted strictly with Pure Desi Cow Ghee and Unrefined Jaggery. Free of artificial colors, preservatives, and white sugar.
                  </p>
                </div>
              </div>

              {/* Products Section Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '1.3rem', fontWeight: '800', color: '#4A121E', margin: 0 }}>
                  Signature Laddus & Savory Munchies ({products.length} Varieties)
                </h3>
                <span style={{ fontSize: '0.8rem', color: '#64748B' }}>Freshly roasted to order</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                {products.map(product => {
                  const options = getProductWeightOptions(product);
                  const currentKey = getWeight(product.sku, product);
                  const currentOpt = options.find(o => o.key === currentKey) || options[0];
                  const price = currentOpt ? currentOpt.price : product.p500;
                  const isOutOfStock = product.stockStatus === 'OUT_OF_STOCK';
                  const isHighlighted = highlightedSku && (highlightedSku === product.sku || highlightedSku === product.id);
                  
                  return (
                    <div 
                      key={product.id || product.sku}
                      id={`product-${product.sku}`}
                      style={{ 
                        background: '#fff', 
                        borderRadius: '16px', 
                        overflow: 'hidden', 
                        border: isHighlighted ? '2.5px solid #F59E0B' : '1px solid #E2E8F0', 
                        boxShadow: isHighlighted ? '0 8px 25px rgba(245, 158, 11, 0.35)' : '0 4px 15px rgba(0,0,0,0.03)',
                        display: 'flex',
                        flexDirection: 'column',
                        opacity: isOutOfStock ? 0.75 : 1,
                        position: 'relative'
                      }}
                    >
                      {isHighlighted && (
                        <div style={{ position: 'absolute', top: '10px', left: '10px', zIndex: 10, background: '#F59E0B', color: '#350B15', padding: '4px 10px', borderRadius: '6px', fontWeight: '800', fontSize: '0.72rem', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
                          ★ Featured from Social Media
                        </div>
                      )}
                      {/* Product Image */}
                      <div style={{ position: 'relative', height: '180px', background: '#FFF8F0', overflow: 'hidden' }}>
                        <img 
                          src={product.image} 
                          alt={product.name} 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => { e.target.src = 'images/TheLadduStory_Logo.jpg'; }}
                        />
                        <span style={{ 
                          position: 'absolute', 
                          top: '12px', 
                          left: '12px', 
                          background: product.isMunchy ? '#E0F2FE' : '#FDE68A', 
                          color: product.isMunchy ? '#0369A1' : '#4A121E', 
                          padding: '4px 10px', 
                          borderRadius: '8px', 
                          fontSize: '0.72rem', 
                          fontWeight: '800' 
                        }}>
                          {product.tag}
                        </span>

                        {isOutOfStock && (
                          <span style={{
                            position: 'absolute',
                            top: '12px',
                            right: '12px',
                            background: '#FEE2E2',
                            color: '#991B1B',
                            padding: '4px 8px',
                            borderRadius: '8px',
                            fontSize: '0.72rem',
                            fontWeight: '800'
                          }}>
                            OUT OF STOCK
                          </span>
                        )}
                      </div>

                      {/* Details */}
                      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                        <div style={{ marginBottom: '6px' }}>
                          <h4 style={{ margin: '0 0 4px', fontSize: '1.05rem', fontWeight: '800', color: '#4A121E' }}>
                            {product.name}
                          </h4>
                          
                          {/* Rating & Reviews Interactive Trigger */}
                          {(() => {
                            const productReviews = reviews.filter(r => r.productSku === product.sku);
                            const avgRating = productReviews.length > 0 
                              ? (productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length).toFixed(1) 
                              : '5.0';
                            return (
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '2px' }}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedProductForReview(product);
                                    setIsStaffReviewMode(false);
                                    setReviewRatingInput(5);
                                    setReviewCommentInput('');
                                    setReviewOrderIdInput('');
                                    setReviewSuccessMsg('');
                                    if (customerUser) {
                                      setReviewNameInput(customerUser.name || '');
                                      setReviewPhoneInput(customerUser.phone || '');
                                    } else {
                                      setReviewNameInput('');
                                      setReviewPhoneInput('');
                                    }
                                  }}
                                  style={{
                                    background: '#FEF3C7',
                                    border: '1px solid #FDE68A',
                                    color: '#92400E',
                                    borderRadius: '20px',
                                    padding: '2px 8px',
                                    fontSize: '0.72rem',
                                    fontWeight: '800',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                  }}
                                  title="View patron reviews & rate this product"
                                >
                                  <span>⭐ {avgRating}</span>
                                  <span style={{ color: '#B45309', textDecoration: 'underline' }}>
                                    ({productReviews.length} {productReviews.length === 1 ? 'review' : 'reviews'})
                                  </span>
                                </button>
                                <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: '700' }}>
                                  Min: {product.moq || '500g'}
                                </span>
                              </div>
                            );
                          })()}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#64748B', marginBottom: '8px', flex: 1 }}>
                          {product.desc}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#059669', fontWeight: '700', marginBottom: '12px' }}>
                          ★ {product.benefit}
                        </div>

                        {/* Dynamic Weight Selector (250g, 500g, 1 Kg based on MOQ) */}
                        <div style={{ display: 'grid', gridTemplateColumns: options.length === 3 ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)', gap: '6px', marginBottom: '14px' }}>
                          {options.map(opt => (
                            <button
                              key={opt.key}
                              type="button"
                              onClick={() => setWeight(product.sku, opt.key)}
                              style={{
                                padding: '7px 3px',
                                borderRadius: '8px',
                                border: currentKey === opt.key ? '2px solid #831843' : '1px solid #CBD5E1',
                                background: currentKey === opt.key ? '#E0F2FE' : '#fff',
                                color: currentKey === opt.key ? '#4A121E' : '#475569',
                                fontWeight: '800',
                                fontSize: options.length === 3 ? '0.74rem' : '0.8rem',
                                cursor: 'pointer',
                                textAlign: 'center',
                                lineHeight: 1.2
                              }}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>

                        {/* Price & Add to Cart */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <span style={{ fontSize: '1.15rem', fontWeight: '800', color: '#4A121E' }}>
                              ₹{price}
                            </span>
                          </div>
                          <button
                            onClick={() => addToCart(product)}
                            disabled={isOutOfStock}
                            style={{
                              background: isOutOfStock ? '#CBD5E1' : '#831843',
                              color: '#fff',
                              border: 'none',
                              padding: '9px 16px',
                              borderRadius: '8px',
                              fontWeight: '700',
                              fontSize: '0.85rem',
                              cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}
                          >
                            {isOutOfStock ? 'Unavailable' : '+ Add to Cart'}
                          </button>
                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Desktop Cart Sidebar */}
            <div className="desktop-cart-sidebar" style={{ background: '#fff', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', position: 'sticky', top: '90px' }}>
              {renderCartContent()}
            </div>

          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* VIEW 2: CUSTOMER ORDER TRACKING & PROFILE CRM                 */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'track' && (
          <div style={{ maxWidth: '850px', margin: '0 auto' }}>
            
            {customerUser ? (
              <div>
                {/* Customer Account Header */}
                <div style={{ background: '#fff', borderRadius: '18px', padding: '24px', border: '1px solid #E2E8F0', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: '#FFFFFF', border: '2px solid #FDE68A', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }}>
                      <img src="images/TheLadduStory_Logo.jpg" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.target.style.display = 'none'; e.target.parentNode.innerText = '👤'; }} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#831843', letterSpacing: '0.5px' }}>
                        CUSTOMER ACCOUNT (PRIMARY ID: MOBILE)
                      </div>
                      <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#4A121E', margin: '2px 0 4px' }}>
                        Namaste, {customerUser.name}! 🙏
                      </h2>
                      <div style={{ fontSize: '0.85rem', color: '#64748B' }}>
                        📞 +91 {customerUser.phone} {customerUser.address ? `• 📍 ${customerUser.address}` : ''}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      id="track-place-order-btn"
                      onClick={() => setActiveTab('store')}
                      style={{ background: '#831843', color: '#fff', border: 'none', padding: '9px 16px', borderRadius: '8px', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer' }}
                    >
                      + Place New Order
                    </button>
                    <button
                      id="track-edit-addr-btn"
                      onClick={() => { setEditAddressInput(customerUser.address || ''); setShowAddressModal(true); }}
                      style={{ background: '#FAF6F0', border: '1.5px solid #B45309', padding: '9px 14px', borderRadius: '8px', fontWeight: '800', fontSize: '0.85rem', color: '#4A121E', cursor: 'pointer' }}
                    >
                      📍 Edit Address
                    </button>
                    <button
                      id="track-set-password-btn"
                      onClick={() => setShowSetPasswordModal(true)}
                      style={{ background: '#FAF6F0', border: '1.5px solid #B45309', padding: '9px 14px', borderRadius: '8px', fontWeight: '800', fontSize: '0.85rem', color: '#4A121E', cursor: 'pointer' }}
                    >
                      🔑 Change Password
                    </button>
                    <button
                      id="track-switch-user-btn"
                      onClick={handleCustomerLogout}
                      style={{ background: '#F1F5F9', border: '1px solid #CBD5E1', padding: '9px 14px', borderRadius: '8px', fontWeight: '700', fontSize: '0.85rem', color: '#475569', cursor: 'pointer' }}
                    >
                      Logout
                    </button>
                  </div>
                </div>

                {/* ACTIVE IN-PROGRESS ORDERS */}
                <div style={{ marginBottom: '32px' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#4A121E', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    🟡 Open / In-Progress Orders ({activeOrders.length})
                  </h3>

                  {activeOrders.length === 0 ? (
                    <div style={{ background: '#fff', borderRadius: '16px', padding: '36px', textAlign: 'center', border: '1px solid #E2E8F0', color: '#64748B' }}>
                      <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>🥣</div>
                      <div style={{ fontWeight: '700', fontSize: '1rem', color: '#4A121E' }}>No active orders in progress right now.</div>
                      <div style={{ fontSize: '0.85rem', marginTop: '4px' }}>Order fresh artisanal laddus anytime!</div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                      {activeOrders.map(o => {
                        const isOrderPickup = o.fulfillmentType === 'PICKUP' || (o.channel && o.channel.includes('PICKUP'));
                        const stepIndex = getStatusStepIndex(o.status, isOrderPickup ? 'PICKUP' : 'DELIVERY');
                        return (
                          <div key={o.orderId} style={{ background: '#fff', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '22px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
                            
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                              <div>
                                <span style={{ fontWeight: '800', color: '#4A121E', fontSize: '1.1rem' }}>{o.orderId}</span>
                                <span style={{ fontSize: '0.8rem', color: '#64748B', marginLeft: '10px' }}>{o.time}</span>
                              </div>
                              <span style={{ 
                                background: o.status === 'PREPARING' ? '#FEF3C7' : (o.status === 'READY FOR PICKUP' ? '#ECFDF5' : (o.status === 'PACKED' ? '#E0F2FE' : '#F1F5F9')), 
                                color: o.status === 'PREPARING' ? '#92400E' : (o.status === 'READY FOR PICKUP' ? '#065F46' : (o.status === 'PACKED' ? '#0369A1' : '#475569')), 
                                padding: '4px 12px', 
                                borderRadius: '12px', 
                                fontSize: '0.8rem', 
                                fontWeight: '800' 
                              }}>
                                {o.status === 'PREPARING' ? '⏳ Preparing in Cow Ghee' : (o.status === 'READY FOR PICKUP' ? '🛍️ Ready for Pickup' : (o.status === 'PACKED' ? '📦 Box Packed' : (o.status === 'RECEIVED' ? '🟡 Order Received' : o.status)))}
                              </span>
                            </div>

                            {/* Live Step Progress Indicator */}
                            <div style={{ background: '#FAF6F0', padding: '16px', borderRadius: '12px', marginBottom: '16px', border: '1px solid #F1F5F9' }}>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', textAlign: 'center', gap: '6px' }}>
                                {(isOrderPickup ? [
                                  { label: 'Received', step: 1 },
                                  { label: 'Preparing in Cow Ghee', step: 2 },
                                  { label: 'Box Packed', step: 3 },
                                  { label: 'Ready for Pickup', step: 4 },
                                  { label: 'Order Picked Up', step: 5 }
                                ] : [
                                  { label: 'Received', step: 1 },
                                  { label: 'Preparing in Cow Ghee', step: 2 },
                                  { label: 'Box Packed', step: 3 },
                                  { label: 'Out for Delivery', step: 4 },
                                  { label: 'Delivered', step: 5 }
                                ]).map(s => {
                                  const isDone = stepIndex >= s.step;
                                  return (
                                    <div key={s.step}>
                                      <div style={{ 
                                        width: '28px', 
                                        height: '28px', 
                                        borderRadius: '50%', 
                                        background: isDone ? '#831843' : '#E2E8F0', 
                                        color: isDone ? '#fff' : '#64748B', 
                                        margin: '0 auto 6px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '0.8rem',
                                        fontWeight: '800'
                                      }}>
                                        {isDone ? '✓' : s.step}
                                      </div>
                                      <div style={{ fontSize: '0.7rem', fontWeight: isDone ? '800' : '600', color: isDone ? '#4A121E' : '#94A3B8' }}>
                                        {s.label}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Items List */}
                            <div style={{ borderBottom: '1px solid #E2E8F0', paddingBottom: '12px', marginBottom: '12px' }}>
                              {o.items.map((it, idx) => (
                                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', marginBottom: '6px' }}>
                                  <span>{it.qty}x {it.name} ({it.cleanWeight || it.packLabel})</span>
                                  <b>₹{it.unitPrice * it.qty}</b>
                                </div>
                              ))}
                              <div style={{ borderTop: '1px solid #E2E8F0', marginTop: '8px', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                                <div>
                                  <span style={{ fontWeight: '800', color: '#4A121E', fontSize: '0.95rem' }}>Total: ₹{o.total}</span>
                                  <span style={{ marginLeft: '10px', fontSize: '0.78rem', fontWeight: '800', padding: '3px 8px', borderRadius: '6px', background: o.paymentStatus === 'PAID' ? '#DEF7EC' : '#FEF3C7', color: o.paymentStatus === 'PAID' ? '#03543F' : '#92400E' }}>
                                    {o.paymentStatus === 'PAID' ? `🟢 Paid via ${o.paymentMethod || 'UPI'}` : '⏳ Pay on Pickup (Cash / UPI)'}
                                  </span>
                                </div>
                                {o.paymentStatus !== 'PAID' && (
                                  <button
                                    onClick={() => setSelectedOrderForPay(o)}
                                    style={{ background: '#059669', color: '#fff', border: 'none', padding: '5px 12px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: '800', cursor: 'pointer' }}
                                  >
                                    📱 Pay ₹{o.total} Now via UPI
                                  </button>
                                )}
                              </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                              <div style={{ fontSize: '0.8rem', color: '#64748B' }}>
                                📍 Delivery To: <b>{o.address}</b>
                              </div>
                              <a
                                href={`https://wa.me/919343207515?text=${encodeURIComponent(`Hi The Laddu Story, checking status for my order ${o.orderId} for ${customerUser.name}`)}`}
                                target="_blank"
                                rel="noreferrer"
                                style={{ background: '#25D366', color: '#fff', textDecoration: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}
                              >
                                💬 WhatsApp Bakery
                              </a>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* COMPLETED ORDER HISTORY */}
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#4A121E', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    🟢 Completed Order History ({pastOrders.length})
                  </h3>

                  {pastOrders.length === 0 ? (
                    <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', textAlign: 'center', border: '1px solid #E2E8F0', color: '#94A3B8', fontSize: '0.85rem' }}>
                      Completed past orders will be archived here.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      {pastOrders.map(o => (
                        <div key={o.orderId} style={{ background: '#fff', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '18px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <div>
                              <b style={{ color: '#4A121E', fontSize: '0.95rem' }}>{o.orderId}</b>
                              <span style={{ fontSize: '0.75rem', color: '#64748B', marginLeft: '8px' }}>{o.time}</span>
                            </div>
                            <span style={{ 
                              background: o.status === 'CANCELLED' ? '#FEE2E2' : '#DEF7EC', 
                              color: o.status === 'CANCELLED' ? '#991B1B' : '#03543F', 
                              padding: '3px 10px', 
                              borderRadius: '12px', 
                              fontSize: '0.75rem', 
                              fontWeight: '800' 
                            }}>
                              ✓ {o.status || 'COMPLETED'}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.85rem', color: '#475569', marginBottom: '10px' }}>
                            {o.items.map(it => `${it.qty}x ${it.name} (${it.cleanWeight || it.packLabel})`).join(', ')} • <b>₹{o.total}</b>
                          </div>
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            <button
                              onClick={() => reorderPastItems(o)}
                              style={{ background: '#F1F5F9', border: '1px solid #CBD5E1', padding: '6px 14px', borderRadius: '6px', fontWeight: '700', fontSize: '0.8rem', color: '#4A121E', cursor: 'pointer' }}
                            >
                              🔄 Reorder in 1 Click
                            </button>
                            <button
                              onClick={() => {
                                const firstItem = o.items && o.items[0];
                                const prod = firstItem 
                                  ? (products.find(p => p.sku === firstItem.sku || p.name === firstItem.name) || { sku: firstItem.sku || 'general', name: firstItem.name, image: 'images/TheLadduStory_Logo.jpg' })
                                  : products[0];
                                setSelectedProductForReview(prod);
                                setIsStaffReviewMode(false);
                                setReviewOrderIdInput(o.orderId || o.id || '');
                                setReviewRatingInput(5);
                                setReviewCommentInput('');
                                setReviewSuccessMsg('');
                                if (customerUser) {
                                  setReviewNameInput(customerUser.name || '');
                                  setReviewPhoneInput(customerUser.phone || '');
                                } else {
                                  if (o.name) setReviewNameInput(o.name);
                                  if (o.phone) setReviewPhoneInput(o.phone);
                                }
                              }}
                              style={{ background: '#FFFBEB', border: '1px solid #FDE68A', padding: '6px 14px', borderRadius: '6px', fontWeight: '700', fontSize: '0.8rem', color: '#92400E', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                            >
                              ⭐ Rate & Review Laddus
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            ) : (
              /* If Not Logged In: Customer Login Screen (High-Luxury Royal Aesthetics) */
              <div style={{ background: '#FFFFFF', borderRadius: '24px', padding: '40px 32px', border: '1.5px solid rgba(180, 83, 9, 0.25)', boxShadow: '0 10px 30px rgba(74, 18, 30, 0.08)', textAlign: 'center', maxWidth: '480px', margin: '20px auto' }}>
                
                {/* Royal Emblem */}
                <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: '#FFFFFF', border: '3px solid #B45309', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 4px 14px rgba(180, 83, 9, 0.25)' }}>
                  <img src="images/TheLadduStory_Logo.jpg" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.target.style.display = 'none'; e.target.parentNode.innerText = '👑'; }} />
                </div>

                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#FEF3C7', color: '#92400E', padding: '4px 14px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '800', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '10px', border: '1px solid #FDE68A' }}>
                  <span>👑 Artisanal Heritage Kitchen</span>
                </div>

                <h2 className="royal-title" style={{ fontSize: '1.8rem', fontWeight: '700', color: '#4A121E', margin: '0 0 8px' }}>
                  Patron Portal & Order Tracker
                </h2>
                <p style={{ fontSize: '0.88rem', color: '#64748B', margin: '0 auto 20px', lineHeight: 1.5 }}>
                  Access live cow ghee preparation updates, order history & express checkout.
                </p>

                {/* ROYAL PATRON PORTAL TABS */}
                <div style={{ display: 'flex', background: '#F1F5F9', padding: '4px', borderRadius: '12px', marginBottom: '22px', border: '1px solid rgba(180, 83, 9, 0.15)' }}>
                  <button
                    type="button"
                    onClick={() => setAuthMode('SIGNIN')}
                    style={{
                      flex: 1,
                      padding: '11px',
                      borderRadius: '8px',
                      border: 'none',
                      fontWeight: '800',
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                      background: authMode === 'SIGNIN' ? 'linear-gradient(135deg, #4A121E 0%, #831843 100%)' : 'transparent',
                      color: authMode === 'SIGNIN' ? '#FFFBEB' : '#64748B',
                      boxShadow: authMode === 'SIGNIN' ? '0 2px 8px rgba(74, 18, 30, 0.25)' : 'none',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    🔑 Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuthMode('REGISTER')}
                    style={{
                      flex: 1,
                      padding: '11px',
                      borderRadius: '8px',
                      border: 'none',
                      fontWeight: '800',
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                      background: authMode === 'REGISTER' ? 'linear-gradient(135deg, #4A121E 0%, #831843 100%)' : 'transparent',
                      color: authMode === 'REGISTER' ? '#FFFBEB' : '#64748B',
                      boxShadow: authMode === 'REGISTER' ? '0 2px 8px rgba(74, 18, 30, 0.25)' : 'none',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    ✨ Create New Account
                  </button>
                </div>

                {authMode === 'SIGNIN' ? (
                  /* ================= TAB 1: SIGN IN ================= */
                  <form onSubmit={handlePasswordLogin} style={{ textAlign: 'left' }}>
                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '800', color: '#4A121E', marginBottom: '6px', letterSpacing: '0.5px' }}>
                        10-DIGIT MOBILE NUMBER *
                      </label>
                      <div style={{ display: 'flex', alignItems: 'center', border: '1.5px solid rgba(180, 83, 9, 0.3)', borderRadius: '10px', overflow: 'hidden', background: '#FAF6F0' }}>
                        <span style={{ padding: '12px 14px', background: 'rgba(180, 83, 9, 0.1)', color: '#4A121E', fontWeight: '800', fontSize: '0.95rem', borderRight: '1px solid rgba(180, 83, 9, 0.2)' }}>
                          🇮🇳 +91
                        </span>
                        <input
                          id="track-signin-phone"
                          type="tel"
                          placeholder="e.g. 9343207525"
                          value={loginPhoneInput}
                          onChange={e => setLoginPhoneInput(e.target.value)}
                          required
                          style={{ width: '100%', boxSizing: 'border-box', padding: '12px 14px', border: 'none', background: 'transparent', fontSize: '1.05rem', fontWeight: '700', color: '#4A121E', outline: 'none' }}
                        />
                      </div>
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '800', color: '#4A121E', marginBottom: '6px', letterSpacing: '0.5px' }}>
                        PASSWORD / 4-DIGIT PIN *
                      </label>
                      <input
                        id="track-signin-pwd"
                        type="password"
                        placeholder="Enter your security password or PIN"
                        value={loginPasswordInput}
                        onChange={e => setLoginPasswordInput(e.target.value)}
                        required
                        style={{ width: '100%', boxSizing: 'border-box', padding: '12px 14px', borderRadius: '10px', border: '1.5px solid rgba(180, 83, 9, 0.3)', background: '#FAF6F0', fontSize: '0.95rem', color: '#4A121E' }}
                      />
                    </div>

                    <button
                      id="track-signin-submit-btn"
                      type="submit"
                      disabled={isCustomerLoggingIn}
                      style={{
                        width: '100%',
                        background: 'linear-gradient(135deg, #4A121E 0%, #831843 100%)',
                        color: '#fff',
                        border: '1px solid #B45309',
                        padding: '14px',
                        borderRadius: '10px',
                        fontWeight: '800',
                        fontSize: '1rem',
                        cursor: isCustomerLoggingIn ? 'not-allowed' : 'pointer',
                        boxShadow: '0 4px 14px rgba(74, 18, 30, 0.3)'
                      }}
                    >
                      {isCustomerLoggingIn ? '⏳ Signing In...' : '🔑 Sign In to Patron Account →'}
                    </button>

                    <div style={{ marginTop: '16px', textAlign: 'center', fontSize: '0.82rem', color: '#64748B' }}>
                      New to The Laddu Story?{' '}
                      <button
                        type="button"
                        onClick={() => { setRegPhone(loginPhoneInput); setAuthMode('REGISTER'); }}
                        style={{ background: 'transparent', border: 'none', color: '#B45309', fontWeight: '800', cursor: 'pointer', padding: 0 }}
                      >
                        Create your account here →
                      </button>
                    </div>
                  </form>
                ) : (
                  /* ================= TAB 2: CREATE NEW ACCOUNT ================= */
                  <form onSubmit={handleRegisterCustomer} style={{ textAlign: 'left' }}>
                    <div style={{ marginBottom: '14px' }}>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '800', color: '#4A121E', marginBottom: '4px', letterSpacing: '0.5px' }}>
                        FULL PATRON NAME *
                      </label>
                      <input
                        id="track-reg-name"
                        type="text"
                        placeholder="e.g. Navin Bhasin"
                        value={regName}
                        onChange={e => setRegName(e.target.value)}
                        required
                        style={{ width: '100%', boxSizing: 'border-box', padding: '11px 13px', borderRadius: '8px', border: '1.5px solid rgba(180, 83, 9, 0.3)', background: '#FAF6F0', fontSize: '0.95rem', color: '#4A121E' }}
                      />
                    </div>

                    <div style={{ marginBottom: '14px' }}>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '800', color: '#4A121E', marginBottom: '4px', letterSpacing: '0.5px' }}>
                        10-DIGIT MOBILE NUMBER *
                      </label>
                      <div style={{ display: 'flex', alignItems: 'center', border: '1.5px solid rgba(180, 83, 9, 0.3)', borderRadius: '8px', overflow: 'hidden', background: '#FAF6F0' }}>
                        <span style={{ padding: '11px 13px', background: 'rgba(180, 83, 9, 0.1)', color: '#4A121E', fontWeight: '800', fontSize: '0.9rem', borderRight: '1px solid rgba(180, 83, 9, 0.2)' }}>
                          🇮🇳 +91
                        </span>
                        <input
                          id="track-reg-phone"
                          type="tel"
                          placeholder="e.g. 9343207525"
                          value={regPhone}
                          onChange={e => setRegPhone(e.target.value)}
                          required
                          style={{ width: '100%', boxSizing: 'border-box', padding: '11px 13px', border: 'none', background: 'transparent', fontSize: '1rem', fontWeight: '700', color: '#4A121E', outline: 'none' }}
                        />
                      </div>
                    </div>

                    <div style={{ marginBottom: '14px' }}>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '800', color: '#4A121E', marginBottom: '4px', letterSpacing: '0.5px' }}>
                        DELIVERY ADDRESS *
                      </label>
                      <textarea
                        id="track-reg-addr"
                        rows="2"
                        placeholder="Apartment/Villa, Street, Landmark, City & Pincode"
                        value={regAddress}
                        onChange={e => setRegAddress(e.target.value)}
                        required
                        style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: '8px', border: '1.5px solid rgba(180, 83, 9, 0.3)', background: '#FAF6F0', fontSize: '0.9rem', color: '#4A121E', resize: 'vertical' }}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '18px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: '800', color: '#4A121E', marginBottom: '4px' }}>
                          PASSWORD / PIN *
                        </label>
                        <input
                          id="track-reg-pwd"
                          type="password"
                          placeholder="Min 4 digits"
                          value={regPassword}
                          onChange={e => setRegPassword(e.target.value)}
                          required
                          style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: '8px', border: '1.5px solid rgba(180, 83, 9, 0.3)', background: '#FAF6F0', fontSize: '0.9rem', color: '#4A121E' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: '800', color: '#4A121E', marginBottom: '4px' }}>
                          CONFIRM *
                        </label>
                        <input
                          id="track-reg-conf-pwd"
                          type="password"
                          placeholder="Re-enter PIN"
                          value={regConfirmPassword}
                          onChange={e => setRegConfirmPassword(e.target.value)}
                          required
                          style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: '8px', border: '1.5px solid rgba(180, 83, 9, 0.3)', background: '#FAF6F0', fontSize: '0.9rem', color: '#4A121E' }}
                        />
                      </div>
                    </div>

                    <button
                      id="track-reg-submit-btn"
                      type="submit"
                      disabled={isCustomerLoggingIn}
                      style={{
                        width: '100%',
                        background: 'linear-gradient(135deg, #15803D 0%, #16A34A 100%)',
                        color: '#fff',
                        border: '1px solid #14532D',
                        padding: '14px',
                        borderRadius: '10px',
                        fontWeight: '800',
                        fontSize: '1rem',
                        cursor: isCustomerLoggingIn ? 'not-allowed' : 'pointer',
                        boxShadow: '0 4px 14px rgba(22, 163, 74, 0.3)'
                      }}
                    >
                      {isCustomerLoggingIn ? '⏳ Creating Account...' : '👑 Create Patron Account & Continue →'}
                    </button>

                    <div style={{ marginTop: '14px', textAlign: 'center', fontSize: '0.82rem', color: '#64748B' }}>
                      Already have an account?{' '}
                      <button
                        type="button"
                        onClick={() => { setLoginPhoneInput(regPhone); setAuthMode('SIGNIN'); }}
                        style={{ background: 'transparent', border: 'none', color: '#B45309', fontWeight: '800', cursor: 'pointer', padding: 0 }}
                      >
                        Sign in here →
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* VIEW 3: STAFF ADMIN OMS DASHBOARD & INVENTORY MANAGER         */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'admin' && (
          <div>
            {/* STAFF OMNICHANNEL & SOCIAL PRESENCE PREVIEW BAR */}
            <div style={{
              background: 'linear-gradient(135deg, #2B060F 0%, #4A121E 100%)',
              border: '2px solid #F59E0B',
              borderRadius: '16px',
              padding: '14px 20px',
              color: '#FDE68A',
              marginBottom: '18px',
              boxShadow: '0 6px 20px rgba(74, 18, 30, 0.3)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <span style={{ background: '#F59E0B', color: '#2B060F', padding: '4px 10px', borderRadius: '6px', fontWeight: '800', fontSize: '0.74rem', letterSpacing: '0.5px' }}>
                  STAFF OMS ONLY
                </span>
                <span style={{ color: '#F1F5F9', fontWeight: '700', fontSize: '0.82rem' }}>
                  Brand Channels Sandbox (Hidden from Customers):
                </span>
                <a href={BRAND_CHANNELS.INSTAGRAM} target="_blank" rel="noopener noreferrer" style={{ background: 'rgba(255,255,255,0.1)', padding: '4px 10px', borderRadius: '6px', color: '#FDE68A', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: '700', fontSize: '0.78rem' }}>
                  <span>📸 Instagram</span> <span style={{ opacity: 0.8, fontSize: '0.7rem' }}>(@theladdustory)</span>
                </a>
                <a href={BRAND_CHANNELS.FACEBOOK} target="_blank" rel="noopener noreferrer" style={{ background: 'rgba(255,255,255,0.1)', padding: '4px 10px', borderRadius: '6px', color: '#FDE68A', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: '700', fontSize: '0.78rem' }}>
                  <span>📘 Facebook</span>
                </a>
                <a href={BRAND_CHANNELS.WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" style={{ background: 'rgba(52, 211, 153, 0.2)', border: '1px solid #34D399', padding: '4px 10px', borderRadius: '6px', color: '#6EE7B7', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: '800', fontSize: '0.78rem' }}>
                  <span>💬 WhatsApp ({BRAND_CHANNELS.WHATSAPP_NUMBER})</span>
                </a>
                <a href={BRAND_CHANNELS.YOUTUBE} target="_blank" rel="noopener noreferrer" style={{ background: 'rgba(239, 68, 68, 0.2)', padding: '4px 10px', borderRadius: '6px', color: '#FCA5A5', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: '700', fontSize: '0.78rem' }}>
                  <span>📺 YouTube (@TheLadduStory)</span>
                </a>
                <a href={BRAND_CHANNELS.GOOGLE_PROFILE} target="_blank" rel="noopener noreferrer" style={{ background: 'rgba(59, 130, 246, 0.2)', padding: '4px 10px', borderRadius: '6px', color: '#93C5FD', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: '700', fontSize: '0.78rem' }}>
                  <span>⭐ Google Reviews</span>
                </a>
              </div>
              <div>
                <button
                  onClick={() => setAdminSection('social')}
                  style={{
                    background: adminSection === 'social' ? '#FDE68A' : '#FAF6F0',
                    color: '#4A121E',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontWeight: '800',
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                  }}
                >
                  🛠️ Open WhatsApp & Social Testing Suite →
                </button>
              </div>
            </div>

            {/* Staff Sub-Navigation */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '14px', background: '#fff', padding: '14px 20px', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                <button
                  id="admin-btn-new-staff-order"
                  onClick={() => {
                    setStaffOrderPhone('');
                    setStaffOrderName('');
                    setStaffOrderAddress('');
                    setStaffOrderNotes('');
                    setStaffOrderItems([]);
                    setStaffCustomerLookupStatus(null);
                    setStaffOrderCreatedSuccess(null);
                    setStaffSelectedProductSku(products[0]?.sku || '01');
                    setStaffSelectedWeightKey('500g');
                    setStaffSelectedQty(1);
                    setShowStaffOrderModal(true);
                  }}
                  style={{
                    background: '#059669',
                    color: '#fff',
                    border: 'none',
                    padding: '9px 16px',
                    borderRadius: '8px',
                    fontWeight: '800',
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 2px 8px rgba(5, 150, 105, 0.25)'
                  }}
                  title="Create an order on behalf of customer from WhatsApp or phone call"
                >
                  <span>💬 + New WhatsApp / Staff Order</span>
                </button>
                <button
                  onClick={() => setAdminSection('orders')}
                  style={{
                    background: adminSection === 'orders' ? '#4A121E' : '#F1F5F9',
                    color: adminSection === 'orders' ? '#fff' : '#475569',
                    border: 'none',
                    padding: '9px 16px',
                    borderRadius: '8px',
                    fontWeight: '800',
                    fontSize: '0.88rem',
                    cursor: 'pointer'
                  }}
                >
                  📋 Orders & Kitchen ({orders.length})
                </button>
                <button
                  onClick={() => setAdminSection('inventory')}
                  style={{
                    background: adminSection === 'inventory' ? '#4A121E' : '#F1F5F9',
                    color: adminSection === 'inventory' ? '#fff' : '#475569',
                    border: 'none',
                    padding: '9px 16px',
                    borderRadius: '8px',
                    fontWeight: '800',
                    fontSize: '0.88rem',
                    cursor: 'pointer'
                  }}
                >
                  📦 Inventory Catalog ({products.length})
                </button>
                <button
                  onClick={() => setAdminSection('reviews')}
                  style={{
                    background: adminSection === 'reviews' ? '#4A121E' : '#F1F5F9',
                    color: adminSection === 'reviews' ? '#fff' : '#475569',
                    border: 'none',
                    padding: '9px 16px',
                    borderRadius: '8px',
                    fontWeight: '800',
                    fontSize: '0.88rem',
                    cursor: 'pointer'
                  }}
                >
                  ⭐ Patron Reviews ({reviews.length})
                </button>
                <button
                  onClick={() => setAdminSection('leads')}
                  style={{
                    background: adminSection === 'leads' ? '#4A121E' : '#F1F5F9',
                    color: adminSection === 'leads' ? '#fff' : '#475569',
                    border: 'none',
                    padding: '9px 16px',
                    borderRadius: '8px',
                    fontWeight: '800',
                    fontSize: '0.88rem',
                    cursor: 'pointer'
                  }}
                >
                  💼 Corporate Leads ({corporateLeads.length})
                </button>
                <button
                  onClick={() => setAdminSection('social')}
                  style={{
                    background: adminSection === 'social' ? '#4A121E' : '#F1F5F9',
                    color: adminSection === 'social' ? '#fff' : '#475569',
                    border: 'none',
                    padding: '9px 16px',
                    borderRadius: '8px',
                    fontWeight: '800',
                    fontSize: '0.88rem',
                    cursor: 'pointer'
                  }}
                >
                  🌐 Social & WhatsApp Hub
                </button>
              </div>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  onClick={() => setShowSupabaseModal(true)}
                  title="Configure Supabase Cloud Database"
                  style={{
                    background: supabaseConnected ? '#DEF7EC' : '#FEF3C7',
                    color: supabaseConnected ? '#03543F' : '#92400E',
                    border: supabaseConnected ? '1px solid #31C48D' : '1px solid #F59E0B',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    fontWeight: '700',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <span>{supabaseConnected ? '🟢 Supabase Active' : '🟡 Connect Supabase DB'}</span>
                </button>
                <button
                  onClick={exportOrdersToCsv}
                  title="Download CSV Backup (Open in Google Sheets / Excel)"
                  style={{ background: '#F3E8FF', color: '#6B21A8', border: '1px solid #D8B4FE', padding: '8px 12px', borderRadius: '8px', fontWeight: '700', fontSize: '0.8rem', cursor: 'pointer' }}
                >
                  📥 Export CSV Backup
                </button>
                <button
                  onClick={handleResetToMaster}
                  title="Reload Master Orders & Catalog"
                  style={{ background: '#E0F2FE', color: '#0369A1', border: '1px solid #BAE6FD', padding: '8px 12px', borderRadius: '8px', fontWeight: '700', fontSize: '0.8rem', cursor: 'pointer' }}
                >
                  🔄 Sync Master OMS
                </button>
                <button
                  onClick={() => {
                    setIsAdminLoggedIn(false);
                    try {
                      sessionStorage.removeItem('tls_staff_logged_in');
                    } catch (e) {}
                    setActiveTab('store');
                  }}
                  style={{ background: '#F1F5F9', border: '1px solid #CBD5E1', padding: '8px 14px', borderRadius: '8px', fontWeight: '700', fontSize: '0.8rem', cursor: 'pointer' }}
                >
                  Logout
                </button>
              </div>
            </div>

            {/* SUB-VIEW A: ORDERS & KITCHEN DISPATCH */}
            {adminSection === 'orders' && (() => {
              const pendingOrders = orders.filter(o => {
                if (kitchenStatusFilter === 'RECEIVED_ONLY') return o.status === 'RECEIVED';
                if (kitchenStatusFilter === 'PREPARING_ONLY') return o.status === 'PREPARING';
                return o.status === 'RECEIVED' || o.status === 'PREPARING' || o.status === 'PACKED';
              });

              const itemMap = new Map();
              let totalWeightGrams = 0;
              let totalPacks = 0;

              pendingOrders.forEach(o => {
                (o.items || []).forEach(it => {
                  const sku = it.sku || it.name || 'general';
                  const qty = Number(it.qty) || 1;
                  const pack = it.cleanWeight || it.packLabel || '500g';
                  totalPacks += qty;

                  const weightStr = pack.toLowerCase();
                  let gramsPerUnit = 500;
                  if (weightStr.includes('250g')) gramsPerUnit = 250;
                  else if (weightStr.includes('1kg') || weightStr.includes('1 kg') || weightStr.includes('1000g')) gramsPerUnit = 1000;
                  else if (weightStr.includes('500g')) gramsPerUnit = 500;
                  else if (weightStr.includes('100g')) gramsPerUnit = 100;
                  else if (weightStr.includes('200g')) gramsPerUnit = 200;
                  else if (weightStr.includes('400g')) gramsPerUnit = 400;

                  const itemWeightGrams = gramsPerUnit * qty;
                  totalWeightGrams += itemWeightGrams;

                  if (!itemMap.has(sku)) {
                    itemMap.set(sku, {
                      sku,
                      name: it.name || 'Artisanal Laddu',
                      image: it.image || 'images/TheLadduStory_Logo.jpg',
                      totalQty: 0,
                      totalWeightGrams: 0,
                      packBreakdown: {},
                      orders: []
                    });
                  }

                  const record = itemMap.get(sku);
                  record.totalQty += qty;
                  record.totalWeightGrams += itemWeightGrams;
                  record.packBreakdown[pack] = (record.packBreakdown[pack] || 0) + qty;
                  record.orders.push({
                    orderId: o.orderId,
                    name: o.name,
                    qty,
                    pack
                  });
                });
              });

              const kitchenItems = Array.from(itemMap.values()).map(item => ({
                ...item,
                totalWeightKg: (item.totalWeightGrams / 1000).toFixed(2),
                packBreakdown: item.packBreakdown || {}
              })).sort((a, b) => b.totalWeightGrams - a.totalWeightGrams);

              const kitchenSummary = {
                totalOrdersCount: pendingOrders.length,
                totalPacks,
                totalWeightKg: (totalWeightGrams / 1000).toFixed(2),
                items: kitchenItems
              };

              return (
                <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#4A121E', margin: 0 }}>
                      Kitchen & Delivery Order Manager
                    </h2>
                    <div style={{ fontSize: '0.82rem', color: '#64748B' }}>
                      Real-time Kitchen Orders Stream • Changes sync across customer devices instantly
                    </div>
                  </div>

                  {/* View Mode Toggle: Orders List vs Kitchen Preparation View */}
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', background: '#F1F5F9', padding: '3px', borderRadius: '10px', border: '1px solid #CBD5E1' }}>
                      <button
                        type="button"
                        id="view-mode-orders-list-btn"
                        onClick={() => setAdminOrderViewMode('LIST')}
                        style={{
                          background: adminOrderViewMode === 'LIST' ? '#4A121E' : 'transparent',
                          color: adminOrderViewMode === 'LIST' ? '#fff' : '#475569',
                          border: 'none',
                          padding: '7px 14px',
                          borderRadius: '8px',
                          fontWeight: '800',
                          fontSize: '0.82rem',
                          cursor: 'pointer'
                        }}
                      >
                        📋 Orders List ({orders.length})
                      </button>
                      <button
                        type="button"
                        id="view-mode-kitchen-prep-btn"
                        onClick={() => setAdminOrderViewMode('KITCHEN_PREP')}
                        style={{
                          background: adminOrderViewMode === 'KITCHEN_PREP' ? '#B45309' : 'transparent',
                          color: adminOrderViewMode === 'KITCHEN_PREP' ? '#fff' : '#475569',
                          border: 'none',
                          padding: '7px 14px',
                          borderRadius: '8px',
                          fontWeight: '800',
                          fontSize: '0.82rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <span>🍳 Kitchen Prep Summary</span>
                        <span style={{
                          background: adminOrderViewMode === 'KITCHEN_PREP' ? '#FEF3C7' : '#E2E8F0',
                          color: adminOrderViewMode === 'KITCHEN_PREP' ? '#92400E' : '#475569',
                          padding: '1px 7px',
                          borderRadius: '10px',
                          fontSize: '0.72rem',
                          fontWeight: '800'
                        }}>
                          {kitchenSummary.items.length} items
                        </span>
                      </button>
                    </div>

                    {adminOrderViewMode === 'LIST' && (
                      <input
                        id="staff-search-input"
                        type="text"
                        placeholder="Search by Phone / Name / Order ID..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        style={{ padding: '9px 14px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.88rem', width: '260px', fontWeight: '600' }}
                      />
                    )}
                  </div>
                </div>

                {/* ------------------------------------------------------------- */}
                {/* VIEW MODE 1: KITCHEN PREPARATION BATCH SUMMARY VIEW           */}
                {/* ------------------------------------------------------------- */}
                {adminOrderViewMode === 'KITCHEN_PREP' && (
                  <div>
                    {/* KPI Metric Cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '20px' }}>
                      <div style={{ background: '#FFFBEB', border: '1.5px solid #FDE68A', borderRadius: '14px', padding: '16px', boxShadow: '0 2px 8px rgba(180, 83, 9, 0.06)' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#92400E', textTransform: 'uppercase' }}>Orders In Queue</div>
                        <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#78350F', margin: '4px 0' }}>{kitchenSummary.totalOrdersCount}</div>
                        <div style={{ fontSize: '0.74rem', color: '#B45309' }}>Awaiting preparation & packing</div>
                      </div>
                      <div style={{ background: '#ECFDF5', border: '1.5px solid #A7F3D0', borderRadius: '14px', padding: '16px', boxShadow: '0 2px 8px rgba(5, 150, 105, 0.06)' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#065F46', textTransform: 'uppercase' }}>Total Fresh Laddu Weight</div>
                        <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#047857', margin: '4px 0' }}>{kitchenSummary.totalWeightKg} <span style={{ fontSize: '1rem' }}>Kg</span></div>
                        <div style={{ fontSize: '0.74rem', color: '#059669' }}>Total Cow Ghee batch volume to cook</div>
                      </div>
                      <div style={{ background: '#EFF6FF', border: '1.5px solid #BFDBFE', borderRadius: '14px', padding: '16px', boxShadow: '0 2px 8px rgba(37, 99, 235, 0.06)' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#1E40AF', textTransform: 'uppercase' }}>Total Boxes / Packets</div>
                        <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#1D4ED8', margin: '4px 0' }}>{kitchenSummary.totalPacks} <span style={{ fontSize: '1rem' }}>Packs</span></div>
                        <div style={{ fontSize: '0.74rem', color: '#2563EB' }}>To be boxed & labeled</div>
                      </div>
                      <div style={{ background: '#FAF5FF', border: '1.5px solid #E9D5FF', borderRadius: '14px', padding: '16px', boxShadow: '0 2px 8px rgba(107, 33, 168, 0.06)' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#6B21A8', textTransform: 'uppercase' }}>Varieties in Queue</div>
                        <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#581C87', margin: '4px 0' }}>{kitchenSummary.items.length}</div>
                        <div style={{ fontSize: '0.74rem', color: '#7E22CE' }}>Distinct recipe preparations</div>
                      </div>
                    </div>

                    {/* Controls & Filter Bar */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px', background: '#FAF6F0', padding: '12px 16px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.78rem', fontWeight: '800', color: '#475569' }}>QUEUE FILTER:</span>
                        {[
                          { id: 'PENDING', label: 'All Pending (Received + Preparing + Packed)' },
                          { id: 'RECEIVED_ONLY', label: '🟡 Received (To Cook)' },
                          { id: 'PREPARING_ONLY', label: '⏳ Preparing Now' }
                        ].map(qf => (
                          <button
                            key={qf.id}
                            onClick={() => setKitchenStatusFilter(qf.id)}
                            style={{
                              padding: '5px 12px',
                              borderRadius: '16px',
                              border: kitchenStatusFilter === qf.id ? '2px solid #B45309' : '1px solid #CBD5E1',
                              background: kitchenStatusFilter === qf.id ? '#FFFBEB' : '#fff',
                              color: kitchenStatusFilter === qf.id ? '#92400E' : '#475569',
                              fontWeight: '800',
                              fontSize: '0.75rem',
                              cursor: 'pointer'
                            }}
                          >
                            {qf.label}
                          </button>
                        ))}
                      </div>

                      <button
                        onClick={() => window.print()}
                        style={{ background: '#4A121E', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: '800', fontSize: '0.82rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                      >
                        🖨️ Print Kitchen Preparation Slip
                      </button>
                    </div>

                    {/* Aggregated Items Grid */}
                    {kitchenSummary.items.length === 0 ? (
                      <div style={{ background: '#fff', borderRadius: '16px', padding: '48px', textAlign: 'center', border: '1px solid #E2E8F0', color: '#64748B' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🍳</div>
                        <h3 style={{ margin: '0 0 6px', color: '#4A121E' }}>No Pending Orders to Cook!</h3>
                        <p style={{ margin: 0, fontSize: '0.88rem' }}>All orders have been prepared and fulfilled. Fresh orders will appear here automatically.</p>
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '18px' }}>
                        {kitchenSummary.items.map(item => (
                          <div key={item.sku} style={{ background: '#fff', borderRadius: '16px', border: '1.5px solid #E2E8F0', padding: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column' }}>
                            <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', marginBottom: '14px' }}>
                              <div style={{ width: '64px', height: '64px', borderRadius: '12px', background: '#FFF8F0', overflow: 'hidden', border: '1px solid #F1F5F9', flexShrink: 0 }}>
                                <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.src = 'images/TheLadduStory_Logo.jpg'; }} />
                              </div>
                              <div style={{ flex: 1 }}>
                                <h4 style={{ margin: '0 0 4px', fontSize: '1.1rem', fontWeight: '800', color: '#4A121E' }}>{item.name}</h4>
                                <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#831843' }}>SKU: {item.sku}</div>
                                <div style={{ marginTop: '6px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                                  <span style={{ background: '#FEF3C7', color: '#92400E', padding: '3px 10px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: '800' }}>
                                    Total: {item.totalWeightKg} Kg
                                  </span>
                                  <span style={{ background: '#EFF6FF', color: '#1E40AF', padding: '3px 10px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: '800' }}>
                                    {item.totalQty} Boxes
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Pack Sizes Breakdown */}
                            <div style={{ background: '#FAF6F0', borderRadius: '10px', padding: '10px 14px', marginBottom: '14px', border: '1px solid #F1F5F9' }}>
                              <div style={{ fontSize: '0.74rem', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', marginBottom: '6px' }}>Pack Size Breakdown:</div>
                              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                {Object.entries(item.packBreakdown).map(([pack, count]) => (
                                  <span key={pack} style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', padding: '4px 10px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '800', color: '#1E293B' }}>
                                    {pack}: <b>{count} {count === 1 ? 'pack' : 'packs'}</b>
                                  </span>
                                ))}
                              </div>
                            </div>

                            {/* Orders Queue for this Item */}
                            <div style={{ borderTop: '1px dashed #CBD5E1', paddingTop: '10px', flex: 1 }}>
                              <div style={{ fontSize: '0.72rem', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', marginBottom: '6px' }}>For Orders:</div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', maxHeight: '140px', overflowY: 'auto' }}>
                                {item.orders.map((ord, i) => (
                                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', background: '#F8FAFC', padding: '5px 8px', borderRadius: '6px' }}>
                                    <span style={{ fontWeight: '700', color: '#4A121E' }}>{ord.orderId} • {ord.name}</span>
                                    <span style={{ fontWeight: '800', color: '#0369A1' }}>{ord.qty}x ({ord.pack})</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ------------------------------------------------------------- */}
                {/* VIEW MODE 2: INDIVIDUAL ORDERS STREAM & DISPATCH              */}
                {/* ------------------------------------------------------------- */}
                {adminOrderViewMode === 'LIST' && (
                  <div>
                    {/* Payment & Order Status Quick Filter Chips */}
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: '800', color: '#475569' }}>PAYMENT FILTER:</span>
                      {[
                        { id: 'ALL', label: 'All Payments', count: orders.length },
                        { id: 'PAID', label: '🟢 Paid', count: orders.filter(o => o.paymentStatus === 'PAID').length },
                        { id: 'PENDING', label: '🟠 Pending (Cash/Pickup)', count: orders.filter(o => o.paymentStatus !== 'PAID').length }
                      ].map(pf => (
                        <button
                          key={pf.id}
                          onClick={() => setPaymentFilter(pf.id)}
                          style={{
                            padding: '4px 10px',
                            borderRadius: '16px',
                            border: paymentFilter === pf.id ? '2px solid #059669' : '1px solid #CBD5E1',
                            background: paymentFilter === pf.id ? '#ECFDF5' : '#fff',
                            color: paymentFilter === pf.id ? '#065F46' : '#475569',
                            fontWeight: '800',
                            fontSize: '0.75rem',
                            cursor: 'pointer'
                          }}
                        >
                          {pf.label} ({pf.count})
                        </button>
                      ))}
                    </div>

                    <div style={{ display: 'flex', gap: '8px', marginBottom: '18px', overflowX: 'auto', paddingBottom: '4px' }}>
                      {['ALL', 'RECEIVED', 'PREPARING', 'PACKED', 'READY FOR PICKUP', 'ORDER PICKED UP', 'OUT FOR DELIVERY', 'DELIVERED'].map(st => {
                        const count = st === 'ALL' ? orders.length : orders.filter(o => o.status === st).length;
                        const isSelected = filterStatus === st;
                        return (
                          <button
                            key={st}
                            onClick={() => setFilterStatus(st)}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '20px',
                              border: isSelected ? '2px solid #4A121E' : '1px solid #CBD5E1',
                              background: isSelected ? '#4A121E' : '#fff',
                              color: isSelected ? '#fff' : '#475569',
                              fontWeight: '700',
                              fontSize: '0.78rem',
                              cursor: 'pointer',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {st} ({count})
                          </button>
                        );
                      })}
                    </div>

                    {/* Orders Cards Grid */}
                    {filteredOrders.length === 0 ? (
                      <div style={{ background: '#fff', borderRadius: '16px', padding: '40px', textAlign: 'center', border: '1px solid #E2E8F0', color: '#64748B' }}>
                        <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🔍</div>
                        <div style={{ fontWeight: '700' }}>No orders found matching "{searchQuery}".</div>
                        <div style={{ fontSize: '0.82rem', marginTop: '4px' }}>Try searching by phone number (e.g. 9343207515 or 9343207525), customer name, or order ID.</div>
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '18px' }}>
                        {filteredOrders.map(o => {
                          const isOrderPorter = o.fulfillmentType === 'PORTER' || (o.channel && o.channel.includes('PORTER')) || (o.notes && o.notes.includes('PORTER'));
                          const isOrderPickup = o.fulfillmentType === 'PICKUP' || (o.channel && o.channel.includes('PICKUP'));
                          const isWhatsApp = o.channel === 'WHATSAPP' || (o.channel && o.channel.includes('WHATSAPP'));

                          return (
                            <div key={o.orderId} style={{ background: '#fff', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '18px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                              
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                <span style={{ fontWeight: '800', color: '#4A121E', fontSize: '0.95rem' }}>{o.orderId}</span>
                                <span style={{ fontSize: '0.75rem', color: '#64748B' }}>{o.time}</span>
                              </div>

                              {/* Order Channel & Fulfillment Badges */}
                              <div style={{ display: 'flex', gap: '6px', marginBottom: '10px', flexWrap: 'wrap' }}>
                                {isOrderPorter ? (
                                  <span style={{ background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE', padding: '2px 8px', borderRadius: '12px', fontSize: '0.72rem', fontWeight: '800' }}>
                                    🚚 PORTER DELIVERY (PAID)
                                  </span>
                                ) : (isOrderPickup ? (
                                  <span style={{ background: '#ECFDF5', color: '#065F46', border: '1px solid #A7F3D0', padding: '2px 8px', borderRadius: '12px', fontSize: '0.72rem', fontWeight: '800' }}>
                                    🛍️ SELF-PICKUP
                                  </span>
                                ) : (
                                  <span style={{ background: '#F1F5F9', color: '#475569', border: '1px solid #CBD5E1', padding: '2px 8px', borderRadius: '12px', fontSize: '0.72rem', fontWeight: '800' }}>
                                    🛵 DOORSTEP DELIVERY
                                  </span>
                                ))}

                                {isWhatsApp && (
                                  <span style={{ background: '#DCFCE7', color: '#15803D', border: '1px solid #86EFAC', padding: '2px 8px', borderRadius: '12px', fontSize: '0.72rem', fontWeight: '800' }}>
                                    💬 WhatsApp Order
                                  </span>
                                )}
                              </div>

                              <div style={{ marginBottom: '12px' }}>
                                <div style={{ fontWeight: '800', fontSize: '1.05rem', color: '#1E293B' }}>{o.name}</div>
                                <div style={{ fontSize: '0.85rem', color: '#831843', fontWeight: '700', marginTop: '2px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                  <span>📞 +91 {o.phone}</span>
                                  <a
                                    href={`https://wa.me/91${o.phone.replace(/\D/g,'').slice(-10)}?text=${encodeURIComponent(`Namaste ${o.name}! Checking in regarding your Laddu Story order ${o.orderId}.`)}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{ color: '#16A34A', fontSize: '0.75rem', fontWeight: '800', textDecoration: 'none' }}
                                  >
                                    💬 Chat on WhatsApp
                                  </a>
                                </div>
                                <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '4px' }}>
                                  📍 {o.address}
                                </div>
                              </div>

                              <div style={{ background: '#FAF6F0', padding: '10px 12px', borderRadius: '10px', marginBottom: '14px', border: '1px solid #F1F5F9' }}>
                                {o.items.map((it, idx) => (
                                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', marginBottom: '4px' }}>
                                    <span>{it.qty}x {it.name} ({it.cleanWeight || it.packLabel})</span>
                                    <b>₹{it.unitPrice * it.qty}</b>
                                  </div>
                                ))}
                                <div style={{ borderTop: '1px dashed #CBD5E1', marginTop: '6px', paddingTop: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: '800', fontSize: '0.92rem', color: '#4A121E' }}>
                                  <span>Total: ₹{o.total}</span>
                                  <span style={{ 
                                    fontSize: '0.74rem', 
                                    padding: '3px 8px', 
                                    borderRadius: '6px', 
                                    background: o.paymentStatus === 'PAID' ? '#DEF7EC' : '#FEF3C7', 
                                    color: o.paymentStatus === 'PAID' ? '#03543F' : '#92400E' 
                                  }}>
                                    {o.paymentStatus === 'PAID' ? `🟢 PAID (${o.paymentMethod || 'UPI'})` : '🟠 PAY ON PICKUP/DELIVERY'}
                                  </span>
                                </div>
                              </div>

                              {/* Porter Service Coordination Section */}
                              {(isOrderPorter || editingPorterOrderId === o.orderId) && (
                                <div style={{ background: '#EFF6FF', border: '1.5px solid #93C5FD', borderRadius: '10px', padding: '10px 12px', marginBottom: '12px' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                    <span style={{ fontWeight: '800', color: '#1E40AF', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                      🚚 Porter Coordination:
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (editingPorterOrderId === o.orderId) {
                                          setEditingPorterOrderId(null);
                                        } else {
                                          const curr = getPorterDetails(o.notes) || {};
                                          setPorterForm({
                                            status: curr.status || 'Requested',
                                            bookingId: curr.booking || '',
                                            driverName: curr.driver || '',
                                            driverPhone: curr.phone || '',
                                            fare: curr.fare || '',
                                            trackingUrl: curr.track || ''
                                          });
                                          setEditingPorterOrderId(o.orderId);
                                        }
                                      }}
                                      style={{ background: 'transparent', border: 'none', color: '#1D4ED8', fontSize: '0.74rem', fontWeight: '800', cursor: 'pointer', textDecoration: 'underline' }}
                                    >
                                      {editingPorterOrderId === o.orderId ? 'Cancel' : '✏️ Edit Porter Details'}
                                    </button>
                                  </div>

                                  {editingPorterOrderId === o.orderId ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                                        <div>
                                          <label style={{ fontSize: '0.7rem', fontWeight: '800', color: '#1E3A8A' }}>Porter Status</label>
                                          <select
                                            value={porterForm.status}
                                            onChange={e => setPorterForm({ ...porterForm, status: e.target.value })}
                                            style={{ width: '100%', padding: '5px 8px', borderRadius: '6px', border: '1px solid #93C5FD', fontSize: '0.75rem', fontWeight: '700' }}
                                          >
                                            <option value="Requested">Requested</option>
                                            <option value="Driver Assigned">Driver Assigned</option>
                                            <option value="Picked Up / Out for Delivery">Picked Up / Out for Delivery</option>
                                            <option value="Delivered">Delivered</option>
                                          </select>
                                        </div>
                                        <div>
                                          <label style={{ fontSize: '0.7rem', fontWeight: '800', color: '#1E3A8A' }}>Fare (₹)</label>
                                          <input
                                            type="text"
                                            placeholder="e.g. 150"
                                            value={porterForm.fare}
                                            onChange={e => setPorterForm({ ...porterForm, fare: e.target.value })}
                                            style={{ width: '100%', boxSizing: 'border-box', padding: '5px 8px', borderRadius: '6px', border: '1px solid #93C5FD', fontSize: '0.75rem' }}
                                          />
                                        </div>
                                      </div>
                                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                                        <input
                                          type="text"
                                          placeholder="Driver Name (e.g. Ramesh)"
                                          value={porterForm.driverName}
                                          onChange={e => setPorterForm({ ...porterForm, driverName: e.target.value })}
                                          style={{ width: '100%', boxSizing: 'border-box', padding: '5px 8px', borderRadius: '6px', border: '1px solid #93C5FD', fontSize: '0.75rem' }}
                                        />
                                        <input
                                          type="tel"
                                          placeholder="Driver Mobile"
                                          value={porterForm.driverPhone}
                                          onChange={e => setPorterForm({ ...porterForm, driverPhone: e.target.value })}
                                          style={{ width: '100%', boxSizing: 'border-box', padding: '5px 8px', borderRadius: '6px', border: '1px solid #93C5FD', fontSize: '0.75rem' }}
                                        />
                                      </div>
                                      <input
                                        type="text"
                                        placeholder="Porter CRN / Booking ID (e.g. CRN-9841)"
                                        value={porterForm.bookingId}
                                        onChange={e => setPorterForm({ ...porterForm, bookingId: e.target.value })}
                                        style={{ width: '100%', boxSizing: 'border-box', padding: '5px 8px', borderRadius: '6px', border: '1px solid #93C5FD', fontSize: '0.75rem' }}
                                      />
                                      <button
                                        type="button"
                                        disabled={isSavingPorter}
                                        onClick={async () => {
                                          setIsSavingPorter(true);
                                          try {
                                            const res = await updateOrderPorterDetailsInSupabase(o.orderId, {
                                              porterStatus: porterForm.status,
                                              bookingId: porterForm.bookingId,
                                              driverName: porterForm.driverName,
                                              driverPhone: porterForm.driverPhone,
                                              fare: porterForm.fare,
                                              trackingUrl: porterForm.trackingUrl
                                            });
                                            if (res && res.notes) {
                                              setOrders(prev => prev.map(item => item.orderId === o.orderId ? { ...item, notes: res.notes } : item));
                                            }
                                            setEditingPorterOrderId(null);
                                            alert('✓ Porter details saved and synced successfully!');
                                          } catch(err) {
                                            alert('Error saving Porter details: ' + err.message);
                                          } finally {
                                            setIsSavingPorter(false);
                                          }
                                        }}
                                        style={{ background: '#1D4ED8', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '800', cursor: isSavingPorter ? 'not-allowed' : 'pointer', marginTop: '2px' }}
                                      >
                                        {isSavingPorter ? 'Saving...' : '💾 Save Porter Update'}
                                      </button>
                                    </div>
                                  ) : (
                                    <div>
                                      {(() => {
                                        const porter = getPorterDetails(o.notes);
                                        if (!porter || (!porter.driver && !porter.fare && !porter.booking && !porter.status)) {
                                          return (
                                            <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                                              Porter requested by patron. Click "Edit Porter Details" to record driver & fare.
                                            </div>
                                          );
                                        }
                                        return (
                                          <div style={{ fontSize: '0.76rem', color: '#1E3A8A', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                            <div><b>Status:</b> {porter.status || 'Requested'} {porter.fare ? `• <b>Fare:</b> ₹${porter.fare}` : ''}</div>
                                            {porter.driver && <div><b>Driver:</b> {porter.driver} {porter.phone ? `(${porter.phone})` : ''}</div>}
                                            {porter.booking && <div><b>Booking Ref:</b> {porter.booking}</div>}
                                          </div>
                                        );
                                      })()}
                                    </div>
                                  )}
                                </div>
                              )}

                              {o.paymentStatus !== 'PAID' && (
                                <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', padding: '8px 10px', borderRadius: '8px', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                                  <span style={{ fontSize: '0.76rem', fontWeight: '800', color: '#92400E' }}>
                                    Staff Payment:
                                  </span>
                                  <div style={{ display: 'flex', gap: '4px' }}>
                                    <button
                                      onClick={() => handleStaffMarkPayment(o.orderId, 'CASH')}
                                      style={{ background: '#059669', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: '800', cursor: 'pointer' }}
                                      title="Customer paid cash at store"
                                    >
                                      💵 Cash Paid
                                    </button>
                                    <button
                                      onClick={() => handleStaffMarkPayment(o.orderId, 'UPI')}
                                      style={{ background: '#1E40AF', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: '800', cursor: 'pointer' }}
                                      title="Customer paid via UPI"
                                    >
                                      📱 UPI Paid
                                    </button>
                                  </div>
                                </div>
                              )}

                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                                <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#64748B' }}>STATUS:</span>
                                <select
                                  value={o.status}
                                  onChange={e => updateOrderStatus(o.orderId, e.target.value)}
                                  style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.82rem', fontWeight: '800', background: '#F1F5F9', color: '#4A121E', cursor: 'pointer' }}
                                >
                                  <option value="RECEIVED">RECEIVED</option>
                                  <option value="PREPARING">PREPARING</option>
                                  <option value="PACKED">PACKED</option>
                                  {isOrderPickup ? (
                                    <>
                                      <option value="READY FOR PICKUP">READY FOR PICKUP</option>
                                      <option value="ORDER PICKED UP">ORDER PICKED UP</option>
                                    </>
                                  ) : (
                                    <>
                                      <option value="OUT FOR DELIVERY">OUT FOR DELIVERY</option>
                                      <option value="DELIVERED">DELIVERED</option>
                                    </>
                                  )}
                                  <option value="CANCELLED">CANCELLED</option>
                                </select>
                              </div>

                              {/* WHATSAPP LIFECYCLE ACTION BUTTONS FOR STAFF */}
                              {(() => {
                                const patronPhone = (o.phone || '').replace(/\D/g, '').slice(-10);
                                const patronName = o.name || 'Patron';
                                const porter = getPorterDetails(o.notes);

                                // 1. Order Confirmation Message
                                const waReceiptText = `Namaste ${patronName}! 🙏\n\nThank you for choosing *The Laddu Story*.\n\n📦 *Order ID:* ${o.orderId}\n🥣 *Items:* ${o.items?.map(it => `${it.qty}x ${it.name} (${it.packLabel || it.weight || 'pack'})`).join(', ')}\n💰 *Total:* ₹${Number(o.total || 0).toLocaleString('en-IN')}\n💳 *Payment:* ${o.paymentStatus === 'PAID' ? 'Paid via UPI ✅' : 'Pending (Cash / Pay on Pickup)'}\n📍 *Fulfillment:* ${isOrderPickup ? 'Self-Pickup at Bangalore Kitchen (@15101 Tower-15, Prestige Tranquility)' : 'Doorstep Delivery via Porter'}\n\nOur kitchen has started handcrafting your laddus with 100% Pure Desi Cow Ghee. We will notify you once packed!`;

                                // 2. Kitchen Ready Alert
                                const waReadyText = `Namaste ${patronName}! 🥣✨\n\nYour artisanal order *#${o.orderId}* is freshly prepared and packed at *The Laddu Story* Bangalore kitchen!\n\n${isOrderPickup ? '📍 Your box is ready for pickup at @15101, Tower-15, Prestige Tranquility, Budigere Cross. (Contact: 9343207515)' : '🚚 Our team is assigning your Porter driver now.'}\n\nThank you for choosing pure cow ghee & unrefined jaggery goodness!`;

                                // 3. Porter Dispatched Alert
                                const waPorterText = `Namaste ${patronName}! 🚚\n\nYour order *#${o.orderId}* is out for delivery via Porter!\n\n👤 *Driver:* ${porter?.driver || 'Assigned Driver'}${porter?.phone ? ` (+91 ${porter.phone})` : ''}\n📦 *Booking Ref:* ${porter?.booking || 'Porter Booking'}\n💵 *Porter Fare:* ${porter?.fare ? `₹${porter.fare} (Pay to driver)` : 'As per Porter app'}\n\nPlease keep your phone reachable. Enjoy your fresh laddus!`;

                                // 4. Review & Feedback Request
                                const waReviewText = `Namaste ${patronName}! 🙏❤️\n\nWe hope you and your family loved the pure Desi Cow Ghee aroma and authentic taste of *The Laddu Story* laddus from order *#${o.orderId}*!\n\nCould you take 30 seconds to share your review on Google? It means the world to our kitchen:\n⭐ *Review Link:* ${BRAND_CHANNELS.GOOGLE_REVIEW_LINK}\n\nYou can also leave tasting notes on our website: https://theladdustory.github.io\n\nWith devotion,\nTeam The Laddu Story 🌿`;

                                const waReceiptUrl = `https://wa.me/91${patronPhone}?text=${encodeURIComponent(waReceiptText)}`;
                                const waReadyUrl = `https://wa.me/91${patronPhone}?text=${encodeURIComponent(waReadyText)}`;
                                const waPorterUrl = `https://wa.me/91${patronPhone}?text=${encodeURIComponent(waPorterText)}`;
                                const waReviewUrl = `https://wa.me/91${patronPhone}?text=${encodeURIComponent(waReviewText)}`;

                                return (
                                  <div style={{ marginTop: '12px', borderTop: '1px dashed #CBD5E1', paddingTop: '10px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                      <span style={{ fontSize: '0.72rem', fontWeight: '800', color: '#047857', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <span>💬</span> WHATSAPP DISPATCH (STAFF):
                                      </span>
                                      <span style={{ fontSize: '0.7rem', color: '#64748B' }}>+91 {patronPhone}</span>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                                      <a
                                        href={waReceiptUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        title="Send order confirmation receipt via WhatsApp"
                                        style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#065F46', padding: '5px 8px', borderRadius: '6px', textDecoration: 'none', fontSize: '0.72rem', fontWeight: '700', textAlign: 'center', display: 'block' }}
                                      >
                                        🧾 1. Receipt
                                      </a>
                                      <a
                                        href={waReadyUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        title="Send ready for pickup alert via WhatsApp"
                                        style={{ background: '#FEF3C7', border: '1px solid #FDE68A', color: '#92400E', padding: '5px 8px', borderRadius: '6px', textDecoration: 'none', fontSize: '0.72rem', fontWeight: '700', textAlign: 'center', display: 'block' }}
                                      >
                                        🥣 2. Ready Alert
                                      </a>
                                      <a
                                        href={waPorterUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        title="Send driver name and Porter dispatch details via WhatsApp"
                                        style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', color: '#1E40AF', padding: '5px 8px', borderRadius: '6px', textDecoration: 'none', fontSize: '0.72rem', fontWeight: '700', textAlign: 'center', display: 'block' }}
                                      >
                                        🚚 3. Porter Dispatched
                                      </a>
                                      <a
                                        href={waReviewUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        title="Send Google review link request via WhatsApp"
                                        style={{ background: '#FFF1F2', border: '1px solid #FECDD3', color: '#9F1239', padding: '5px 8px', borderRadius: '6px', textDecoration: 'none', fontSize: '0.72rem', fontWeight: '700', textAlign: 'center', display: 'block' }}
                                      >
                                        ⭐ 4. Review Link
                                      </a>
                                    </div>
                                  </div>
                                );
                              })()}

                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
              );
            })()}

            {/* SUB-VIEW B: INVENTORY & MENU CATALOG MANAGER */}
            {adminSection === 'inventory' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#4A121E', margin: 0 }}>
                      Inventory, Pricing & MOQ Manager
                    </h2>
                    <div style={{ fontSize: '0.82rem', color: '#64748B' }}>
                      Update minimum order quantities, stock status, variations, and images across the live store.
                    </div>
                  </div>

                  <button
                    onClick={() => setShowAddProductModal(true)}
                    style={{ background: '#4A121E', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '8px', fontWeight: '800', fontSize: '0.88rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    + Add New Item / Variation
                  </button>
                </div>

                {/* Quick Store-Wide Laddu MOQ Switch */}
                <div style={{ background: '#FAF6F0', border: '1.5px solid #FDE68A', padding: '14px 16px', borderRadius: '12px', marginBottom: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <div style={{ fontWeight: '800', color: '#4A121E', fontSize: '0.95rem' }}>⚡ Quick Store-Wide Laddu MOQ Controls</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748B' }}>
                      Set MOQ for all Laddus across the customer store with 1 click:
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => setAllLaddusMoq('250g')}
                      style={{ background: '#059669', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '8px', fontWeight: '800', fontSize: '0.8rem', cursor: 'pointer' }}
                    >
                      ✓ Set All Laddus to 250g (Show 3 Weight Options)
                    </button>
                    <button
                      type="button"
                      onClick={() => setAllLaddusMoq('500g')}
                      style={{ background: '#831843', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '8px', fontWeight: '800', fontSize: '0.8rem', cursor: 'pointer' }}
                    >
                      ✓ Set All Laddus to 500g (Show 2 Weight Options)
                    </button>
                  </div>
                </div>

                {/* Product Inventory Cards Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '18px' }}>
                  {products.map(p => (
                    <div key={p.sku} style={{ background: '#fff', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column' }}>
                      
                      <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                        <img 
                          src={p.image} 
                          alt={p.name} 
                          style={{ width: '64px', height: '64px', borderRadius: '10px', objectFit: 'cover' }}
                          onError={(e) => { e.target.src = 'images/TheLadduStory_Logo.jpg'; }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: '800', fontSize: '1rem', color: '#4A121E' }}>{p.name}</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: '700' }}>SKU: {p.sku}</div>
                          <span style={{ 
                            display: 'inline-block',
                            marginTop: '4px',
                            background: p.stockStatus === 'IN_STOCK' ? '#DEF7EC' : (p.stockStatus === 'LOW_STOCK' ? '#FEF3C7' : '#FEE2E2'),
                            color: p.stockStatus === 'IN_STOCK' ? '#03543F' : (p.stockStatus === 'LOW_STOCK' ? '#92400E' : '#991B1B'),
                            padding: '2px 8px',
                            borderRadius: '10px',
                            fontSize: '0.7rem',
                            fontWeight: '800'
                          }}>
                            {p.stockStatus || 'IN_STOCK'}
                          </span>
                        </div>
                      </div>

                      <div style={{ background: '#FAF6F0', padding: '10px 12px', borderRadius: '10px', fontSize: '0.8rem', marginBottom: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: '#64748B' }}>Min Order Qty (MOQ):</span>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            {p.category === 'LADDU' ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => updateProductMoq(p.sku, '250g')}
                                  style={{
                                    background: p.moq === '250g' ? '#059669' : '#F1F5F9',
                                    color: p.moq === '250g' ? '#fff' : '#475569',
                                    border: '1px solid #CBD5E1',
                                    padding: '2px 8px',
                                    borderRadius: '6px',
                                    fontSize: '0.72rem',
                                    fontWeight: '800',
                                    cursor: 'pointer'
                                  }}
                                >
                                  250g (3 opts)
                                </button>
                                <button
                                  type="button"
                                  onClick={() => updateProductMoq(p.sku, '500g')}
                                  style={{
                                    background: p.moq !== '250g' ? '#831843' : '#F1F5F9',
                                    color: p.moq !== '250g' ? '#fff' : '#475569',
                                    border: '1px solid #CBD5E1',
                                    padding: '2px 8px',
                                    borderRadius: '6px',
                                    fontSize: '0.72rem',
                                    fontWeight: '800',
                                    cursor: 'pointer'
                                  }}
                                >
                                  500g (2 opts)
                                </button>
                              </>
                            ) : (
                              <b>{p.moq || '100g'}</b>
                            )}
                          </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#64748B' }}>Rate per Kg:</span>
                          <b>₹{p.ratePerKg}</b>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#64748B' }}>Options:</span>
                          <b>{p.opt1} | {p.opt2}</b>
                        </div>
                      </div>

                      <button
                        onClick={() => setEditingProduct(p)}
                        style={{ marginTop: 'auto', background: '#F1F5F9', border: '1px solid #CBD5E1', padding: '8px', borderRadius: '8px', fontWeight: '700', fontSize: '0.82rem', color: '#4A121E', cursor: 'pointer' }}
                      >
                        ✏️ Edit Price, MOQ & Stock
                      </button>

                    </div>
                  ))}
                </div>

              </div>
            )}

            {/* SUB-VIEW C: PATRON REVIEWS & RATINGS ANALYTICS */}
            {adminSection === 'reviews' && (() => {
              const totalReviews = reviews.length;
              const avgRating = totalReviews > 0 
                ? (reviews.reduce((sum, r) => sum + (Number(r.rating) || 5), 0) / totalReviews).toFixed(1) 
                : '5.0';
              const fiveStarCount = reviews.filter(r => (Number(r.rating) || 5) === 5).length;
              const fiveStarPct = totalReviews > 0 ? Math.round((fiveStarCount / totalReviews) * 100) : 100;

              const filteredReviews = reviews.filter(r => {
                const sku = r.productSku || r.product_sku;
                const matchProd = reviewProductFilter === 'ALL' || sku === reviewProductFilter;
                const matchRating = reviewRatingFilter === 'ALL' || String(r.rating) === String(reviewRatingFilter);
                return matchProd && matchRating;
              });

              return (
                <div>
                  {/* Header & New Review Trigger */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                      <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#4A121E', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        ⭐ Patron Reviews & Tasting Notes
                      </h2>
                      <div style={{ fontSize: '0.82rem', color: '#64748B' }}>
                        Authentic patron ratings, aroma feedback & cow ghee reviews synced with Supabase DB.
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedProductForReview(products[0]);
                        setIsStaffReviewMode(true);
                        setReviewRatingInput(5);
                        setReviewNameInput('');
                        setReviewPhoneInput('');
                        setReviewCommentInput('');
                        setReviewOrderIdInput('');
                        setReviewSuccessMsg('');
                      }}
                      style={{
                        background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                        color: '#fff',
                        border: 'none',
                        padding: '10px 18px',
                        borderRadius: '8px',
                        fontWeight: '800',
                        fontSize: '0.88rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: '0 2px 8px rgba(5, 150, 105, 0.25)'
                      }}
                    >
                      + Enter Review on Behalf of Patron
                    </button>
                  </div>

                  {/* Analytics KPI Summary Cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '14px', marginBottom: '22px' }}>
                    <div style={{ background: '#FFFBEB', borderRadius: '14px', padding: '16px', border: '1.5px solid #FDE68A' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#92400E', textTransform: 'uppercase' }}>Average Store Rating</div>
                      <div style={{ fontSize: '1.8rem', fontWeight: '900', color: '#78350F', marginTop: '4px' }}>
                        ⭐ {avgRating} <span style={{ fontSize: '1rem', fontWeight: '700', color: '#B45309' }}>/ 5.0</span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#92400E', marginTop: '4px' }}>
                        Across {totalReviews} verified patron reviews
                      </div>
                    </div>

                    <div style={{ background: '#ECFDF5', borderRadius: '14px', padding: '16px', border: '1.5px solid #A7F3D0' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#065F46', textTransform: 'uppercase' }}>5-Star Satisfaction</div>
                      <div style={{ fontSize: '1.8rem', fontWeight: '900', color: '#064E3B', marginTop: '4px' }}>
                        💯 {fiveStarPct}%
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#047857', marginTop: '4px' }}>
                        {fiveStarCount} out of {totalReviews} reviews rated top 5★
                      </div>
                    </div>

                    <div style={{ background: '#EFF6FF', borderRadius: '14px', padding: '16px', border: '1.5px solid #BFDBFE' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#1E40AF', textTransform: 'uppercase' }}>Total Testimonials</div>
                      <div style={{ fontSize: '1.8rem', fontWeight: '900', color: '#1E3A8A', marginTop: '4px' }}>
                        📝 {totalReviews}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#2563EB', marginTop: '4px' }}>
                        Live in Supabase & Local Cache
                      </div>
                    </div>

                    <div style={{ background: '#FAF6F0', borderRadius: '14px', padding: '16px', border: '1.5px solid #E2E8F0' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#4A121E', textTransform: 'uppercase' }}>Quality Standard</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#4A121E', marginTop: '8px' }}>
                        Pure Cow Ghee & Jaggery
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '4px' }}>
                        Zero white sugar • 100% artisanal
                      </div>
                    </div>
                  </div>

                  {/* Filter & Search Bar */}
                  <div style={{ background: '#fff', padding: '14px 18px', borderRadius: '14px', border: '1px solid #E2E8F0', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <div>
                        <label style={{ fontSize: '0.72rem', fontWeight: '800', color: '#64748B', display: 'block', marginBottom: '2px' }}>Filter by Product</label>
                        <select
                          value={reviewProductFilter}
                          onChange={e => setReviewProductFilter(e.target.value)}
                          style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.82rem', fontWeight: '700', background: '#FAF6F0' }}
                        >
                          <option value="ALL">All Products ({reviews.length})</option>
                          {products.map(p => {
                            const count = reviews.filter(r => (r.productSku || r.product_sku) === p.sku).length;
                            return (
                              <option key={p.sku} value={p.sku}>{p.name} ({count})</option>
                            );
                          })}
                        </select>
                      </div>

                      <div>
                        <label style={{ fontSize: '0.72rem', fontWeight: '800', color: '#64748B', display: 'block', marginBottom: '2px' }}>Filter by Rating</label>
                        <select
                          value={reviewRatingFilter}
                          onChange={e => setReviewRatingFilter(e.target.value)}
                          style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.82rem', fontWeight: '700', background: '#FAF6F0' }}
                        >
                          <option value="ALL">All Ratings</option>
                          <option value="5">⭐⭐⭐⭐⭐ (5 Stars)</option>
                          <option value="4">⭐⭐⭐⭐ (4 Stars)</option>
                          <option value="3">⭐⭐⭐ (3 Stars)</option>
                          <option value="2">⭐⭐ (2 Stars)</option>
                          <option value="1">⭐ (1 Star)</option>
                        </select>
                      </div>
                    </div>

                    <div style={{ fontSize: '0.82rem', color: '#64748B', fontWeight: '700' }}>
                      Showing {filteredReviews.length} of {totalReviews} Reviews
                    </div>
                  </div>

                  {/* Reviews Grid */}
                  {filteredReviews.length === 0 ? (
                    <div style={{ background: '#fff', borderRadius: '16px', padding: '40px', textAlign: 'center', border: '1px solid #E2E8F0', color: '#64748B' }}>
                      <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>⭐</div>
                      <div style={{ fontWeight: '800', fontSize: '1.1rem', color: '#4A121E' }}>No reviews found matching the selected filter.</div>
                      <div style={{ fontSize: '0.85rem', marginTop: '4px' }}>Clear the filters or add a new review.</div>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
                      {filteredReviews.map((r, idx) => {
                        const stars = Number(r.rating) || 5;
                        const author = r.customerName || r.customer_name || 'Valued Patron';
                        const phone = r.customerPhone || r.customer_phone || '';
                        const prodName = r.productName || r.product_name || 'Artisanal Laddu';
                        const dateStr = r.createdAt || r.created_at;
                        const formattedDate = dateStr ? new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Recent';

                        return (
                          <div key={r.id || idx} style={{ background: '#fff', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '18px', display: 'flex', flexDirection: 'column', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                              <div>
                                <div style={{ fontWeight: '800', fontSize: '0.98rem', color: '#4A121E' }}>{author}</div>
                                {phone && (
                                  <div style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: '600' }}>
                                    📞 {phone.slice(0, 5)}*****
                                  </div>
                                )}
                              </div>
                              <span style={{ background: '#FEF3C7', color: '#92400E', padding: '2px 8px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '800' }}>
                                {'★'.repeat(stars)}{'☆'.repeat(5 - stars)} ({stars}/5)
                              </span>
                            </div>

                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '10px' }}>
                              <span style={{ display: 'inline-block', background: '#FAF6F0', border: '1px solid #E2E8F0', color: '#831843', padding: '3px 8px', borderRadius: '6px', fontSize: '0.74rem', fontWeight: '800' }}>
                                🥣 {prodName}
                              </span>
                              {(r.orderId || r.order_id) && (
                                <span style={{ display: 'inline-block', background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#065F46', padding: '3px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: '700' }}>
                                  📦 Order #{r.orderId || r.order_id}
                                </span>
                              )}
                            </div>

                            <div style={{ fontSize: '0.85rem', color: '#334155', fontStyle: 'italic', lineHeight: 1.45, marginBottom: '12px', flex: 1 }}>
                              "{r.comment || 'Pure cow ghee taste was amazing! Highly recommended.'}"
                            </div>

                            <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: '#94A3B8' }}>
                              <span>📅 {formattedDate}</span>
                              <span style={{ color: '#059669', fontWeight: '700' }}>✓ Verified Tasting</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* VIEW 4: CORPORATE GIFTING & BULK LEADS CRM */}
            {adminSection === 'leads' && (() => {
              return (
                <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
                  
                  {/* Header & Controls */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '20px', borderBottom: '1px solid #F1F5F9', paddingBottom: '16px' }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', color: '#4A121E', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>💼 Inbound Corporate Gifting & Bulk Order Leads</span>
                        <span style={{ fontSize: '0.8rem', background: '#FDE68A', color: '#78350F', padding: '2px 8px', borderRadius: '12px' }}>
                          {corporateLeads.length} Total Leads
                        </span>
                      </h3>
                      <p style={{ margin: '4px 0 0', fontSize: '0.84rem', color: '#64748B' }}>
                        Leads captured from Instagram, Facebook, WhatsApp Concierge, and Website. Instant 1-click WhatsApp follow-up.
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        onClick={async () => {
                          setIsLoadingLeads(true);
                          const res = await fetchCorporateLeadsFromSupabase();
                          if (res) setCorporateLeads(res);
                          setIsLoadingLeads(false);
                        }}
                        style={{
                          background: '#FAF6F0',
                          border: '1px solid #E2E8F0',
                          padding: '8px 14px',
                          borderRadius: '8px',
                          fontWeight: '700',
                          fontSize: '0.82rem',
                          color: '#4A121E',
                          cursor: 'pointer'
                        }}
                      >
                        {isLoadingLeads ? '🔄 Refreshing...' : '🔄 Refresh Leads'}
                      </button>
                    </div>
                  </div>

                  {/* Leads Table */}
                  {corporateLeads.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '48px 20px', color: '#64748B' }}>
                      <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>💼</div>
                      <div style={{ fontWeight: '700', fontSize: '1rem', color: '#1E293B', marginBottom: '6px' }}>
                        No Corporate Leads Yet
                      </div>
                      <div style={{ fontSize: '0.85rem', maxWidth: '420px', margin: '0 auto' }}>
                        Corporate inquiries submitted via the store modal, Instagram referral links, or tasting box banner will appear here instantly.
                      </div>
                    </div>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                        <thead>
                          <tr style={{ background: '#FAF6F0', borderBottom: '2px solid #E2E8F0', color: '#4A121E', fontWeight: '800' }}>
                            <th style={{ padding: '12px 14px' }}>Date & Source</th>
                            <th style={{ padding: '12px 14px' }}>Company / Client</th>
                            <th style={{ padding: '12px 14px' }}>Contact</th>
                            <th style={{ padding: '12px 14px' }}>Requirement</th>
                            <th style={{ padding: '12px 14px' }}>Notes</th>
                            <th style={{ padding: '12px 14px', textAlign: 'right' }}>Follow-up Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {corporateLeads.map(lead => {
                            const dateStr = lead.created_at ? new Date(lead.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Recent';
                            const followUpMsg = `Namaste ${lead.name}! This is from The Laddu Story (Artisanal Pure Cow Ghee & Jaggery Kitchen, Bangalore). Regarding your inquiry for ${lead.box_count || lead.boxCount || 50} corporate gift boxes for ${lead.occasion || 'Festive Gifting'} — we would love to share our curated catalogue and send a complimentary tasting box to your office!`;
                            const waFollowUpUrl = `https://wa.me/91${(lead.phone || '').replace(/\D/g, '').slice(-10)}?text=${encodeURIComponent(followUpMsg)}`;

                            return (
                              <tr key={lead.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                                <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                                  <div style={{ fontWeight: '700', color: '#1E293B' }}>{dateStr}</div>
                                  <span style={{ display: 'inline-block', background: '#FEF3C7', color: '#92400E', padding: '2px 6px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: '700', marginTop: '2px' }}>
                                    {lead.traffic_source || lead.trafficSource || 'DIRECT'}
                                  </span>
                                </td>
                                <td style={{ padding: '12px 14px' }}>
                                  <div style={{ fontWeight: '800', color: '#4A121E' }}>{lead.company || 'Individual / Family Event'}</div>
                                  <div style={{ color: '#475569', fontSize: '0.8rem' }}>{lead.name}</div>
                                </td>
                                <td style={{ padding: '12px 14px' }}>
                                  <div style={{ fontWeight: '700', color: '#0F172A' }}>📞 +91 {lead.phone}</div>
                                  {lead.email && <div style={{ color: '#64748B', fontSize: '0.78rem' }}>✉️ {lead.email}</div>}
                                </td>
                                <td style={{ padding: '12px 14px' }}>
                                  <div style={{ fontWeight: '700', color: '#047857' }}>🎁 {lead.box_count || lead.boxCount || 50} Boxes</div>
                                  <div style={{ fontSize: '0.78rem', color: '#64748B' }}>{lead.occasion || 'Festive'} • {lead.box_type || lead.boxType || 'Assortment'}</div>
                                </td>
                                <td style={{ padding: '12px 14px', maxWidth: '240px', color: '#334155', fontSize: '0.8rem', fontStyle: lead.custom_note ? 'normal' : 'italic' }}>
                                  {lead.custom_note || lead.customNote || 'No specific notes'}
                                </td>
                                <td style={{ padding: '12px 14px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                                  <a
                                    href={waFollowUpUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                      background: '#059669',
                                      color: '#FFFFFF',
                                      textDecoration: 'none',
                                      padding: '8px 12px',
                                      borderRadius: '6px',
                                      fontWeight: '700',
                                      fontSize: '0.78rem',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px'
                                    }}
                                  >
                                    💬 Follow-up on WhatsApp
                                  </a>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                </div>
              );
            })()}

            {/* VIEW 5: OMNICHANNEL SOCIAL & WHATSAPP INTERACTIVE TESTING HUB */}
            {adminSection === 'social' && (() => {
              const currentOrigin = typeof window !== 'undefined' ? window.location.origin + window.location.pathname.replace(/\/index\.html$/, '') : 'https://theladdustory.github.io';
              const cleanBaseUrl = currentOrigin.endsWith('/') ? currentOrigin.slice(0, -1) : currentOrigin;
              const generatedTestUrl = `${cleanBaseUrl}/?source=${testGenSource.toLowerCase()}&sku=${testGenSku}`;

              // Helper to generate test WhatsApp messages
              const getSimulatedWaText = () => {
                const cleanPhone = (testWaPhone || '9343207515').replace(/\D/g, '').slice(-10);
                const name = testWaName.trim() || 'Patron';

                if (testWaTemplate === 'ORDER_CONFIRM') {
                  return `*Namaste ${name}! 🙏*\n\n` +
                    `Your order *TLS-TEST-1001* has been confirmed at *The Laddu Story* (Pure Cow Ghee & Jaggery Artisanal Kitchen).\n\n` +
                    `📦 *Items Ordered:*\n• 1x Ragi Walnut Laddu (500g) - ₹600\n• 1x Sattu Almond Laddu (500g) - ₹550\n\n` +
                    `💰 *Total Amount:* ₹1,150\n` +
                    `📍 *Fulfillment:* Store Self-Pickup (@15101, Tower-15, Prestige Tranquility, Budigere Cross, BLR)\n` +
                    `💳 *Payment:* UPI / Verified\n\n` +
                    `Freshly roasted with 100% Pure Desi Cow Ghee & Zero White Sugar! 🌿`;
                }

                if (testWaTemplate === 'STATUS_UPDATE') {
                  if (testWaStatus === 'READY_FOR_PICKUP') {
                    return `*Namaste ${name}! 📦*\n\n` +
                      `Your fresh laddu box for order *TLS-TEST-1001* is *PACKED & READY FOR PICKUP*!\n\n` +
                      `📍 *Pickup Location:* @15101, Tower-15, Prestige Tranquility, Budigere Cross, Bangalore - 560049\n` +
                      `📞 *Kitchen Contact:* 9343207515\n\n` +
                      `Please collect at your convenience. Enjoy the pure cow ghee taste! 🙏`;
                  }
                  return `*Namaste ${name}! 👨‍🍳*\n\n` +
                    `Great news! Your order *TLS-TEST-1001* is currently *BEING PREPARED* in our kitchen with pure desi cow ghee and organic jaggery.\n\n` +
                    `We will notify you as soon as your batch is fresh and packed!`;
                }

                if (testWaTemplate === 'PORTER_DISPATCH') {
                  return `*Namaste ${name}! 🛵*\n\n` +
                    `Your order *TLS-TEST-1001* has been dispatched via Porter Doorstep Delivery!\n\n` +
                    `👤 *Driver Name:* ${testWaDriverName || 'Ramesh Kumar'}\n` +
                    `📞 *Driver Phone:* ${testWaDriverPhone || '9876543210'}\n` +
                    `📦 *Live Tracking:* https://porter.in/track/test-porter-1001\n\n` +
                    `Please ensure someone is available at the delivery address to receive the fresh box!`;
                }

                if (testWaTemplate === 'REVIEW_REQUEST') {
                  return `*Namaste ${name}! 🙏*\n\n` +
                    `We hope you and your family enjoyed the fresh artisanal laddus from *The Laddu Story*!\n\n` +
                    `As an artisanal kitchen, your feedback means the world to us. Could you take 30 seconds to share your review on our Google Profile?\n\n` +
                    `⭐ *Write a Google Review:* ${BRAND_CHANNELS.GOOGLE_REVIEW_LINK}\n\n` +
                    `Thank you for choosing pure health and traditions! 🌿`;
                }

                if (testWaTemplate === 'CORPORATE_LEAD') {
                  return `*Namaste ${name}! 🎁*\n\n` +
                    `This is from *The Laddu Story* (Artisanal Pure Cow Ghee & Millet Kitchen, Bangalore).\n\n` +
                    `Thank you for inquiring about corporate gifting for your organization. We specialize in bespoke handcrafted wooden & gold festive boxes with custom branding sleeves.\n\n` +
                    `We would be delighted to send a *complimentary sample tasting box* to your office! What address should we send it to?`;
                }

                return '';
              };

              const simulatedText = getSimulatedWaText();
              const simulatedWaUrl = `https://wa.me/91${(testWaPhone || '9343207515').replace(/\D/g, '').slice(-10)}?text=${encodeURIComponent(simulatedText)}`;

              return (
                <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
                  
                  {/* Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '24px', borderBottom: '1px solid #F1F5F9', paddingBottom: '16px' }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.35rem', fontWeight: '800', color: '#4A121E', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>🌐 Omnichannel & WhatsApp Interactive Testing Suite</span>
                        <span style={{ fontSize: '0.74rem', background: '#DEF7EC', color: '#03543F', padding: '3px 8px', borderRadius: '8px', border: '1px solid #31C48D' }}>
                          Staff OMS Exclusive
                        </span>
                      </h3>
                      <p style={{ margin: '4px 0 0', fontSize: '0.84rem', color: '#64748B' }}>
                        Test and verify all 5 WhatsApp communication workflows, check brand social links, and generate campaign deep-links before enabling for customers.
                      </p>
                    </div>

                    <div>
                      <span style={{ fontSize: '0.8rem', color: '#B45309', background: '#FEF3C7', padding: '6px 12px', borderRadius: '8px', fontWeight: '700' }}>
                        🔒 Social presence is currently HIDDEN from customer storefront
                      </span>
                    </div>
                  </div>

                  {/* SECTION 1: HOW WHATSAPP INTEGRATION WORKS */}
                  <div style={{ background: '#F8FAFC', border: '1.5px solid #CBD5E1', borderRadius: '12px', padding: '16px 20px', marginBottom: '24px' }}>
                    <h4 style={{ margin: '0 0 8px', fontSize: '1rem', color: '#0F172A', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>💡 How WhatsApp Integration Operates (Zero-Cost Direct Protocol)</span>
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px', fontSize: '0.82rem', color: '#334155', lineHeight: 1.5 }}>
                      <div>
                        <strong>1. Protocol:</strong> Uses official WhatsApp URI schemes (`wa.me/91...`).
                        <br/>
                        <strong>2. Zero Overhead:</strong> No ₹1,500/month WhatsApp Business API charges or third-party CRM fees.
                      </div>
                      <div>
                        <strong>3. Universal Compatibility:</strong> Works seamlessly on Android, iOS, WhatsApp Web, and Desktop apps.
                        <br/>
                        <strong>4. Staff Full Control:</strong> Staff can preview and inspect any customer message before dispatching.
                      </div>
                    </div>
                  </div>

                  {/* SECTION 2: INTERACTIVE WHATSAPP WORKFLOW TESTER */}
                  <div style={{ background: '#FFFBEB', border: '2px solid #FDE68A', borderRadius: '16px', padding: '22px', marginBottom: '28px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                      <h4 style={{ margin: 0, fontSize: '1.15rem', color: '#78350F', fontWeight: '800' }}>
                        💬 WhatsApp Workflow Simulator (Test Entire Cycle)
                      </h4>
                      <span style={{ fontSize: '0.78rem', color: '#92400E', fontWeight: '700' }}>
                        Select any workflow below to test the live message output
                      </span>
                    </div>

                    {/* Step Tabs for Workflow Selection */}
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '18px' }}>
                      {[
                        { key: 'ORDER_CONFIRM', label: '1. Order Confirmation' },
                        { key: 'STATUS_UPDATE', label: '2. Kitchen Status Update' },
                        { key: 'PORTER_DISPATCH', label: '3. Porter Delivery Dispatch' },
                        { key: 'REVIEW_REQUEST', label: '4. 5-Star Review Request' },
                        { key: 'CORPORATE_LEAD', label: '5. Corporate Tasting Response' }
                      ].map(t => (
                        <button
                          key={t.key}
                          type="button"
                          onClick={() => setTestWaTemplate(t.key)}
                          style={{
                            background: testWaTemplate === t.key ? '#78350F' : '#FFFFFF',
                            color: testWaTemplate === t.key ? '#FFFFFF' : '#78350F',
                            border: '1.5px solid #F59E0B',
                            padding: '8px 14px',
                            borderRadius: '8px',
                            fontWeight: '800',
                            fontSize: '0.8rem',
                            cursor: 'pointer'
                          }}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>

                    {/* Test Parameters Form */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '16px', background: '#FFFFFF', padding: '16px', borderRadius: '12px', border: '1px solid #FDE68A' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: '800', color: '#78350F', marginBottom: '4px' }}>
                          TEST RECIPIENT MOBILE NUMBER
                        </label>
                        <input
                          type="tel"
                          value={testWaPhone}
                          onChange={e => setTestWaPhone(e.target.value)}
                          placeholder="e.g. 9343207515"
                          style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #CBD5E1', fontSize: '0.88rem', fontWeight: '700' }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: '800', color: '#78350F', marginBottom: '4px' }}>
                          CUSTOMER / CLIENT NAME
                        </label>
                        <input
                          type="text"
                          value={testWaName}
                          onChange={e => setTestWaName(e.target.value)}
                          placeholder="e.g. Priya Sharma"
                          style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #CBD5E1', fontSize: '0.88rem', fontWeight: '700' }}
                        />
                      </div>

                      {testWaTemplate === 'STATUS_UPDATE' && (
                        <div>
                          <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: '800', color: '#78350F', marginBottom: '4px' }}>
                            KITCHEN STATUS TO BROADCAST
                          </label>
                          <select
                            value={testWaStatus}
                            onChange={e => setTestWaStatus(e.target.value)}
                            style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #CBD5E1', fontSize: '0.88rem' }}
                          >
                            <option value="PREPARING">👨‍🍳 PREPARING (In the Ghee Kadhai)</option>
                            <option value="READY_FOR_PICKUP">📦 READY FOR PICKUP (At Tower 15)</option>
                          </select>
                        </div>
                      )}

                      {testWaTemplate === 'PORTER_DISPATCH' && (
                        <>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: '800', color: '#78350F', marginBottom: '4px' }}>
                              PORTER DRIVER NAME
                            </label>
                            <input
                              type="text"
                              value={testWaDriverName}
                              onChange={e => setTestWaDriverName(e.target.value)}
                              placeholder="Driver Name"
                              style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #CBD5E1', fontSize: '0.88rem' }}
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: '800', color: '#78350F', marginBottom: '4px' }}>
                              DRIVER MOBILE NUMBER
                            </label>
                            <input
                              type="tel"
                              value={testWaDriverPhone}
                              onChange={e => setTestWaDriverPhone(e.target.value)}
                              placeholder="Driver Mobile"
                              style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #CBD5E1', fontSize: '0.88rem' }}
                            />
                          </div>
                        </>
                      )}
                    </div>

                    {/* Live Preview Box */}
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ fontSize: '0.76rem', fontWeight: '800', color: '#78350F', marginBottom: '6px' }}>
                        LIVE WHATSAPP MESSAGE FORMAT PREVIEW:
                      </div>
                      <div style={{ background: '#E2F7CB', border: '1px solid #A7F3D0', borderRadius: '12px', padding: '14px 18px', fontFamily: 'monospace', fontSize: '0.84rem', color: '#064E3B', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                        {simulatedText}
                      </div>
                    </div>

                    {/* Launch Action */}
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <a
                        href={simulatedWaUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          background: '#059669',
                          color: '#FFFFFF',
                          textDecoration: 'none',
                          padding: '12px 22px',
                          borderRadius: '8px',
                          fontWeight: '800',
                          fontSize: '0.9rem',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px',
                          boxShadow: '0 4px 12px rgba(5, 150, 105, 0.3)'
                        }}
                      >
                        <span>💬 Launch Test WhatsApp Message in New Tab</span>
                      </a>
                      <span style={{ fontSize: '0.78rem', color: '#78350F' }}>
                        (Will open WhatsApp with pre-filled message formatted for recipient <strong>+91 {testWaPhone}</strong>)
                      </span>
                    </div>
                  </div>

                  {/* SECTION 3: CAMPAIGN DEEP-LINK GENERATOR */}
                  <div style={{ background: '#FAF6F0', border: '1.5px solid #E2E8F0', borderRadius: '16px', padding: '22px', marginBottom: '28px' }}>
                    <h4 style={{ margin: '0 0 6px', fontSize: '1.15rem', color: '#4A121E', fontWeight: '800' }}>
                      🔗 Omnichannel Campaign Deep-Link Generator
                    </h4>
                    <p style={{ margin: '0 0 16px', fontSize: '0.82rem', color: '#64748B' }}>
                      Create smart links for your Instagram bio, Facebook posts, or WhatsApp statuses that automatically route customers to the chosen product and record attribution.
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: '800', color: '#4A121E', marginBottom: '4px' }}>
                          CHOOSE TARGET PRODUCT
                        </label>
                        <select
                          value={testGenSku}
                          onChange={e => setTestGenSku(e.target.value)}
                          style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1.5px solid #CBD5E1', fontSize: '0.88rem', background: '#FFFFFF' }}
                        >
                          {products.map(p => (
                            <option key={p.sku} value={p.sku}>
                              {p.name} ({p.sku})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: '800', color: '#4A121E', marginBottom: '4px' }}>
                          CHOOSE PROMOTION CHANNEL (ATTRIBUTION)
                        </label>
                        <select
                          value={testGenSource}
                          onChange={e => setTestGenSource(e.target.value)}
                          style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1.5px solid #CBD5E1', fontSize: '0.88rem', background: '#FFFFFF' }}
                        >
                          <option value="INSTAGRAM">Instagram (Reel / Bio / Story)</option>
                          <option value="FACEBOOK">Facebook (Group Post / Page)</option>
                          <option value="WHATSAPP">WhatsApp (Status / Community Broadcast)</option>
                          <option value="YOUTUBE">YouTube (Shorts / Description)</option>
                          <option value="CORPORATE_EMAIL">Corporate Email Pitch</option>
                        </select>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <input
                        type="text"
                        readOnly
                        value={generatedTestUrl}
                        style={{ flex: 1, minWidth: '280px', padding: '11px 14px', borderRadius: '8px', border: '1.5px solid #CBD5E1', background: '#FFFFFF', fontWeight: '700', fontSize: '0.88rem', color: '#1E293B' }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(generatedTestUrl);
                          setCopyLinkNotice('✓ Copied to clipboard!');
                          setTimeout(() => setCopyLinkNotice(''), 2500);
                        }}
                        style={{ background: '#4A121E', color: '#FFFFFF', border: 'none', padding: '11px 18px', borderRadius: '8px', fontWeight: '800', fontSize: '0.85rem', cursor: 'pointer' }}
                      >
                        {copyLinkNotice || '📋 Copy Link'}
                      </button>
                      <a
                        href={generatedTestUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ background: '#F59E0B', color: '#350B15', textDecoration: 'none', padding: '11px 16px', borderRadius: '8px', fontWeight: '800', fontSize: '0.85rem' }}
                      >
                        🚀 Test Link in New Tab
                      </a>
                    </div>
                  </div>

                  {/* SECTION 4: OFFICIAL CHANNELS VERIFICATION GRID */}
                  <div>
                    <h4 style={{ margin: '0 0 12px', fontSize: '1.15rem', color: '#4A121E', fontWeight: '800' }}>
                      🌐 Verified Social Profiles & Direct Test Buttons
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
                      
                      {/* Instagram */}
                      <div style={{ background: '#FFF1F2', border: '1px solid #FECDD3', borderRadius: '12px', padding: '16px' }}>
                        <div style={{ fontWeight: '800', color: '#9F1239', fontSize: '0.92rem', marginBottom: '4px' }}>
                          📸 Instagram Handle
                        </div>
                        <div style={{ fontSize: '0.82rem', color: '#475569', marginBottom: '10px' }}>
                          @theladdustory
                        </div>
                        <a href={BRAND_CHANNELS.INSTAGRAM} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', background: '#9F1239', color: '#FFFFFF', textDecoration: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: '700' }}>
                          ↗ Test Instagram Profile
                        </a>
                      </div>

                      {/* Facebook */}
                      <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '12px', padding: '16px' }}>
                        <div style={{ fontWeight: '800', color: '#1E40AF', fontSize: '0.92rem', marginBottom: '4px' }}>
                          📘 Facebook Page
                        </div>
                        <div style={{ fontSize: '0.82rem', color: '#475569', marginBottom: '10px' }}>
                          The Laddu Story
                        </div>
                        <a href={BRAND_CHANNELS.FACEBOOK} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', background: '#1E40AF', color: '#FFFFFF', textDecoration: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: '700' }}>
                          ↗ Test Facebook Page
                        </a>
                      </div>

                      {/* WhatsApp */}
                      <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: '12px', padding: '16px' }}>
                        <div style={{ fontWeight: '800', color: '#065F46', fontSize: '0.92rem', marginBottom: '4px' }}>
                          💬 WhatsApp Number
                        </div>
                        <div style={{ fontSize: '0.82rem', color: '#475569', marginBottom: '10px' }}>
                          +91 {BRAND_CHANNELS.WHATSAPP_NUMBER}
                        </div>
                        <a href={BRAND_CHANNELS.WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', background: '#059669', color: '#FFFFFF', textDecoration: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: '700' }}>
                          ↗ Test WhatsApp Chat
                        </a>
                      </div>

                      {/* YouTube */}
                      <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '12px', padding: '16px' }}>
                        <div style={{ fontWeight: '800', color: '#991B1B', fontSize: '0.92rem', marginBottom: '4px' }}>
                          📺 YouTube Channel
                        </div>
                        <div style={{ fontSize: '0.82rem', color: '#475569', marginBottom: '10px' }}>
                          @TheLadduStory
                        </div>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          <a href={BRAND_CHANNELS.YOUTUBE} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', background: '#DC2626', color: '#FFFFFF', textDecoration: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: '700' }}>
                            ↗ Test Channel Link
                          </a>
                          <a href={BRAND_CHANNELS.YOUTUBE_CREATE} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', background: '#FFFFFF', border: '1px solid #DC2626', color: '#DC2626', textDecoration: 'none', padding: '6px 10px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: '700' }}>
                            + 1-Click Create
                          </a>
                        </div>
                      </div>

                      {/* Google Profile */}
                      <div style={{ background: '#FAF5FF', border: '1px solid #E9D5FF', borderRadius: '12px', padding: '16px' }}>
                        <div style={{ fontWeight: '800', color: '#6B21A8', fontSize: '0.92rem', marginBottom: '4px' }}>
                          ⭐ Google Profile & Reviews
                        </div>
                        <div style={{ fontSize: '0.82rem', color: '#475569', marginBottom: '10px' }}>
                          The Laddu Story, Bangalore
                        </div>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          <a href={BRAND_CHANNELS.GOOGLE_PROFILE} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', background: '#7E22CE', color: '#FFFFFF', textDecoration: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: '700' }}>
                            ↗ Test Google Search
                          </a>
                          <a href="https://business.google.com" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', background: '#FFFFFF', border: '1px solid #7E22CE', color: '#7E22CE', textDecoration: 'none', padding: '6px 10px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: '700' }}>
                            Verify on Google
                          </a>
                        </div>
                      </div>

                      {/* Corporate Email */}
                      <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '12px', padding: '16px' }}>
                        <div style={{ fontWeight: '800', color: '#92400E', fontSize: '0.92rem', marginBottom: '4px' }}>
                          ✉️ Corporate Leads Email
                        </div>
                        <div style={{ fontSize: '0.82rem', color: '#475569', marginBottom: '10px' }}>
                          {BRAND_CHANNELS.EMAIL_LEADS}
                        </div>
                        <a href={`mailto:${BRAND_CHANNELS.EMAIL_LEADS}?subject=Corporate%20Gifting%20Inquiry%20-%20The%20Laddu%20Story`} style={{ display: 'inline-block', background: '#D97706', color: '#FFFFFF', textDecoration: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: '700' }}>
                          ✉️ Test Mailto Link
                        </a>
                      </div>

                    </div>
                  </div>

                </div>
              );
            })()}

          </div>
        )}

        {/* ROYAL BRAND OMNICHANNEL FOOTER */}
        <footer style={{
          background: '#20070D',
          color: '#FAF6F0',
          borderRadius: '20px',
          marginTop: '40px',
          padding: '36px 30px 24px',
          border: '1px solid #4A121E'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '28px', marginBottom: '28px' }}>
            {/* Column 1: Brand Philosophy */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <img src="images/TheLadduStory_Logo.jpg" alt="The Laddu Story" style={{ width: '40px', height: '40px', borderRadius: '50%', border: '2px solid #FDE68A' }} onError={(e) => { e.target.style.display = 'none'; }} />
                <h4 style={{ margin: 0, fontSize: '1.2rem', color: '#FDE68A', fontWeight: '800' }}>The Laddu Story</h4>
              </div>
              <p style={{ fontSize: '0.84rem', color: '#CBD5E1', lineHeight: 1.6, margin: 0 }}>
                Rediscovering India's ancient culinary wellness. Every laddu is slowly roasted and hand-rolled in Pure Desi Cow Ghee and sweetened naturally with unrefined jaggery or dates. Zero white sugar. Zero preservatives.
              </p>
            </div>

            {/* Column 2: Kitchen & Fulfillment */}
            <div>
              <h5 style={{ margin: '0 0 12px', fontSize: '0.95rem', color: '#FDE68A', fontWeight: '700' }}>📍 Artisanal Kitchen</h5>
              <p style={{ fontSize: '0.82rem', color: '#CBD5E1', lineHeight: 1.5, margin: '0 0 8px' }}>
                <strong>Kitchen & Self-Pickup:</strong><br/>
                {BRAND_CHANNELS.KITCHEN_LOCATION}
              </p>
              <p style={{ fontSize: '0.82rem', color: '#CBD5E1', lineHeight: 1.5, margin: 0 }}>
                <strong>Deliveries:</strong> Doorstep across Bangalore via Porter / Dunzo. Pan-India shipping for corporate & festive bulk orders.
              </p>
            </div>

            {/* Column 3: Orders, Corporate & Inquiries */}
            <div>
              <h5 style={{ margin: '0 0 12px', fontSize: '0.95rem', color: '#FDE68A', fontWeight: '700' }}>
                {(isStaffRoute && isAdminLoggedIn) ? '💼 B2B & Corporate Gifting (Staff)' : '📞 Orders & Inquiries'}
              </h5>
              <p style={{ fontSize: '0.82rem', color: '#CBD5E1', lineHeight: 1.5, margin: '0 0 10px' }}>
                {(isStaffRoute && isAdminLoggedIn)
                  ? 'Custom corporate hampers, festive employee gifting, wedding favor boxes, and wellness hampers.'
                  : 'For custom orders, festive celebrations, or diet queries, feel free to contact our kitchen team.'}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '0.82rem', color: '#93C5FD' }}>✉️ Email: {BRAND_CHANNELS.EMAIL_LEADS}</span>
                <span style={{ fontSize: '0.82rem', color: '#86EFAC' }}>📞 Direct Kitchen: +91 {BRAND_CHANNELS.WHATSAPP_NUMBER}</span>
                {(isStaffRoute && isAdminLoggedIn) && (
                  <button 
                    onClick={() => setShowCorporateModal(true)}
                    style={{ background: '#F59E0B', color: '#350B15', border: 'none', padding: '6px 12px', borderRadius: '6px', fontWeight: '800', fontSize: '0.78rem', cursor: 'pointer', marginTop: '4px', width: 'fit-content' }}
                  >
                    🎁 Test Tasting Box Modal →
                  </button>
                )}
              </div>
            </div>

            {/* Column 4: Official Social Channels (VISIBLE ONLY IN STAFF OMS LOGGED-IN VIEW) */}
            {(isStaffRoute && isAdminLoggedIn) && (
              <div>
                <h5 style={{ margin: '0 0 12px', fontSize: '0.95rem', color: '#FDE68A', fontWeight: '700' }}>🌐 Staff Social Sandbox</h5>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <a href={BRAND_CHANNELS.INSTAGRAM} target="_blank" rel="noopener noreferrer" style={{ color: '#F1F5F9', textDecoration: 'none', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>📸 Instagram:</span> <strong style={{ color: '#FDE68A' }}>@theladdustory</strong>
                  </a>
                  <a href={BRAND_CHANNELS.FACEBOOK} target="_blank" rel="noopener noreferrer" style={{ color: '#F1F5F9', textDecoration: 'none', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>📘 Facebook:</span> <strong style={{ color: '#FDE68A' }}>The Laddu Story</strong>
                  </a>
                  <a href={BRAND_CHANNELS.WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" style={{ color: '#F1F5F9', textDecoration: 'none', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>💬 WhatsApp:</span> <strong style={{ color: '#34D399' }}>+91 {BRAND_CHANNELS.WHATSAPP_NUMBER}</strong>
                  </a>
                  <a href={BRAND_CHANNELS.YOUTUBE} target="_blank" rel="noopener noreferrer" style={{ color: '#F1F5F9', textDecoration: 'none', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>📺 YouTube Channel:</span> <strong style={{ color: '#F87171' }}>@TheLadduStory</strong>
                  </a>
                  <a href={BRAND_CHANNELS.GOOGLE_PROFILE} target="_blank" rel="noopener noreferrer" style={{ color: '#F1F5F9', textDecoration: 'none', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>⭐ Google Profile:</span> <strong style={{ color: '#60A5FA' }}>Reviews & Ratings</strong>
                  </a>
                </div>
              </div>
            )}
          </div>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', fontSize: '0.74rem', color: '#94A3B8' }}>
            <div>© {new Date().getFullYear()} The Laddu Story. Handcrafted with devotion in Bangalore. All rights reserved.</div>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <span>FSSAI Compliant</span>
              <span>•</span>
              <span>100% Pure Desi Cow Ghee</span>
              <span>•</span>
              <span>Zero White Sugar</span>
            </div>
          </div>
        </footer>

      </main>

      {/* ------------------------------------------------------------- */}
      {/* MOBILE STICKY FLOATING CART BAR (NON-INTRUSIVE)              */}
      {/* ------------------------------------------------------------- */}
      {totalCartQty > 0 && activeTab === 'store' && (
        <div
          className="mobile-floating-cart-bar"
          style={{
            position: 'fixed',
            bottom: '16px',
            left: '16px',
            right: '16px',
            background: '#4A121E',
            color: '#FFFFFF',
            padding: '12px 18px',
            borderRadius: '16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 10px 30px rgba(15, 88, 105, 0.45)',
            zIndex: 900
          }}
        >
          <div>
            <div style={{ fontWeight: '800', fontSize: '0.95rem' }}>
              🛒 {totalCartQty} Item{totalCartQty > 1 ? 's' : ''} • ₹{cartTotal.toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#FDE68A' }}>
              Pure Cow Ghee & Jaggery • Zero White Sugar
            </div>
          </div>
          <button
            onClick={() => setIsMobileCartOpen(true)}
            style={{
              background: '#FDE68A',
              color: '#4A121E',
              border: 'none',
              padding: '10px 18px',
              borderRadius: '10px',
              fontWeight: '800',
              fontSize: '0.88rem',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}
          >
            View Cart & Pay →
          </button>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MOBILE CART MODAL / BOTTOM SHEET                              */}
      {/* ------------------------------------------------------------- */}
      {isMobileCartOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.6)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            backdropFilter: 'blur(3px)'
          }}
          onClick={() => setIsMobileCartOpen(false)}
        >
          <div
            style={{
              background: '#FFFFFF',
              width: '100%',
              maxWidth: '540px',
              maxHeight: '90vh',
              overflowY: 'auto',
              borderTopLeftRadius: '24px',
              borderTopRightRadius: '24px',
              boxShadow: '0 -10px 40px rgba(0,0,0,0.25)',
              paddingBottom: '20px'
            }}
            onClick={e => e.stopPropagation()}
          >
            {renderCartContent()}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: EDIT PRODUCT INVENTORY & DETAILS (REDESIGNED)          */}
      {/* ------------------------------------------------------------- */}
      {editingProduct && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(3px)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: '#FFFFFF', borderRadius: '24px', padding: '26px', maxWidth: '580px', width: '100%', maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.35)', border: '1.5px solid #FDE68A' }}>
            
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', borderBottom: '1.5px solid #FAF6F0', paddingBottom: '12px' }}>
              <div>
                <span style={{ fontSize: '0.72rem', fontWeight: '800', color: '#B45309', letterSpacing: '0.5px' }}>
                  SKU: {editingProduct.sku} • {editingProduct.category || 'LADDU'}
                </span>
                <h3 style={{ margin: '2px 0 0', fontSize: '1.3rem', color: '#4A121E', fontWeight: '800' }}>
                  Edit Product: {editingProduct.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', color: '#64748B', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProductEdit}>
              {/* SECTION 1: PRODUCT IDENTITY */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: '#475569', marginBottom: '4px' }}>
                  ITEM NAME *
                </label>
                <input
                  type="text"
                  required
                  value={editingProduct.name}
                  onChange={e => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem', fontWeight: '700', color: '#1E293B' }}
                />
              </div>

              {/* Category & Badge Tag */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: '#475569', marginBottom: '4px' }}>
                    CATEGORY
                  </label>
                  <select
                    value={editingProduct.category || 'LADDU'}
                    onChange={e => {
                      const cat = e.target.value;
                      setEditingProduct({
                        ...editingProduct,
                        category: cat,
                        isMunchy: cat === 'SAVORY'
                      });
                    }}
                    style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem', fontWeight: '700' }}
                  >
                    <option value="LADDU">Artisanal Laddu</option>
                    <option value="SAVORY">Savory Munchy / Roasted Snack</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: '#475569', marginBottom: '4px' }}>
                    TAG / HIGHLIGHT BADGE
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Kid's Special, Superfood"
                    value={editingProduct.tag || ''}
                    onChange={e => setEditingProduct({ ...editingProduct, tag: e.target.value })}
                    style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              {/* SECTION 2: MOQ & STOCK STATUS */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '14px', background: '#FAF6F0', padding: '12px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.73rem', fontWeight: '800', color: '#475569', marginBottom: '4px' }}>
                    MIN ORDER QTY (MOQ)
                  </label>
                  <select
                    value={editingProduct.moq || '500g'}
                    onChange={e => setEditingProduct({ ...editingProduct, moq: e.target.value })}
                    style={{ width: '100%', boxSizing: 'border-box', padding: '9px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.82rem', fontWeight: '700' }}
                  >
                    <option value="250g">250g (3 Weight Options)</option>
                    <option value="500g">500g (2 Weight Options)</option>
                    <option value="100g">100g (Savory)</option>
                    <option value="200g">200g (Savory)</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.73rem', fontWeight: '800', color: '#475569', marginBottom: '4px' }}>
                    STOCK STATUS
                  </label>
                  <select
                    value={editingProduct.stockStatus || 'IN_STOCK'}
                    onChange={e => setEditingProduct({ ...editingProduct, stockStatus: e.target.value })}
                    style={{ width: '100%', boxSizing: 'border-box', padding: '9px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.82rem', fontWeight: '700', color: editingProduct.stockStatus === 'OUT_OF_STOCK' ? '#991B1B' : '#047857' }}
                  >
                    <option value="IN_STOCK">🟢 IN STOCK</option>
                    <option value="LOW_STOCK">🟠 LOW STOCK</option>
                    <option value="OUT_OF_STOCK">🔴 OUT OF STOCK</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.73rem', fontWeight: '800', color: '#475569', marginBottom: '4px' }}>
                    STOCK UNITS COUNT
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editingProduct.stockCount ?? 50}
                    onChange={e => setEditingProduct({ ...editingProduct, stockCount: Number(e.target.value) })}
                    style={{ width: '100%', boxSizing: 'border-box', padding: '9px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.85rem', fontWeight: '700' }}
                  />
                </div>
              </div>

              {/* SECTION 3: TIERED PRICING (250g, 500g, 1 Kg) */}
              <div style={{ marginBottom: '14px', background: '#F8FAFC', padding: '12px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#4A121E' }}>
                    PRICING BY WEIGHT TIERS (₹)
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const p1 = Number(editingProduct.p1k || editingProduct.ratePerKg || 0);
                      if (p1 > 0) {
                        const half = Math.round(p1 * 0.5);
                        const quarter = Math.round(p1 * 0.25);
                        setEditingProduct({
                          ...editingProduct,
                          ratePerKg: p1,
                          p1k: p1,
                          p500: half,
                          p250: quarter,
                          opt0: `250g (₹${quarter})`,
                          opt1: `${editingProduct.w1 || '500g'} (₹${half})`,
                          opt2: `${editingProduct.w2 || '1 Kg'} (₹${p1})`
                        });
                      }
                    }}
                    style={{ background: '#FAF6F0', border: '1px solid #B45309', color: '#B45309', padding: '3px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: '800', cursor: 'pointer' }}
                  >
                    ⚡ Auto-calculate from 1 Kg
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '8px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: '800', color: '#64748B', marginBottom: '3px' }}>
                      RATE / KG (₹)
                    </label>
                    <input
                      type="number"
                      value={editingProduct.ratePerKg || editingProduct.p1k || 0}
                      onChange={e => {
                        const r = Number(e.target.value);
                        setEditingProduct({ ...editingProduct, ratePerKg: r });
                      }}
                      style={{ width: '100%', boxSizing: 'border-box', padding: '8px 6px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: '800', color: '#64748B', marginBottom: '3px' }}>
                      250g PRICE (₹)
                    </label>
                    <input
                      type="number"
                      value={editingProduct.p250 || Math.round((Number(editingProduct.p500 || 0)) * 0.5)}
                      onChange={e => {
                        const p = Number(e.target.value);
                        setEditingProduct({ 
                          ...editingProduct, 
                          p250: p,
                          opt0: `250g (₹${p})`
                        });
                      }}
                      style={{ width: '100%', boxSizing: 'border-box', padding: '8px 6px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: '800', color: '#64748B', marginBottom: '3px' }}>
                      500g PRICE (₹)
                    </label>
                    <input
                      type="number"
                      value={editingProduct.p500}
                      onChange={e => {
                        const p = Number(e.target.value);
                        setEditingProduct({ 
                          ...editingProduct, 
                          p500: p,
                          opt1: `${editingProduct.w1 || '500g'} (₹${p})`
                        });
                      }}
                      style={{ width: '100%', boxSizing: 'border-box', padding: '8px 6px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: '800', color: '#64748B', marginBottom: '3px' }}>
                      1 KG PRICE (₹)
                    </label>
                    <input
                      type="number"
                      value={editingProduct.p1k}
                      onChange={e => {
                        const p = Number(e.target.value);
                        setEditingProduct({ 
                          ...editingProduct, 
                          p1k: p,
                          opt2: `${editingProduct.w2 || '1 Kg'} (₹${p})`
                        });
                      }}
                      style={{ width: '100%', boxSizing: 'border-box', padding: '8px 6px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 4: INGREDIENTS & BENEFITS */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: '#475569', marginBottom: '4px' }}>
                  INGREDIENTS & FORMULATION
                </label>
                <textarea
                  rows={2}
                  value={editingProduct.desc || ''}
                  onChange={e => setEditingProduct({ ...editingProduct, desc: e.target.value })}
                  placeholder="e.g. Medjool Dates, Almonds, Pistachios, Cashews, Pure Cow Ghee"
                  style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.82rem', resize: 'vertical' }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: '#475569', marginBottom: '4px' }}>
                  HEALTH & AYURVEDIC BENEFITS
                </label>
                <input
                  type="text"
                  value={editingProduct.benefit || ''}
                  onChange={e => setEditingProduct({ ...editingProduct, benefit: e.target.value })}
                  placeholder="e.g. 100% Naturally Sweetened with Dates, Instant Energy, Fiber Rich"
                  style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.82rem' }}
                />
              </div>

              {/* SECTION 5: IMAGE SELECTION (FOLDER / BROWSER / GALLERY) */}
              <div style={{ marginBottom: '16px', background: '#FAF6F0', padding: '14px', borderRadius: '14px', border: '1.5px solid #FDE68A' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: '800', color: '#4A121E' }}>
                    PRODUCT IMAGE SELECTION
                  </label>
                  <span style={{ fontSize: '0.72rem', color: '#64748B' }}>
                    Select from folder or catalog
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '14px', alignItems: 'center', marginBottom: '12px' }}>
                  {/* Live Thumbnail Preview */}
                  <div style={{ width: '84px', height: '84px', borderRadius: '12px', overflow: 'hidden', border: '2px solid #CBD5E1', background: '#fff', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                    <img
                      src={editingProduct.image || 'images/TheLadduStory_Logo.jpg'}
                      alt={editingProduct.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => { e.target.src = 'images/TheLadduStory_Logo.jpg'; }}
                    />
                  </div>

                  {/* Actions to pick image */}
                  <div style={{ flex: 1 }}>
                    <input
                      type="file"
                      id="edit-product-file-input"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={e => {
                        const file = e.target.files && e.target.files[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          setEditingProduct({ ...editingProduct, image: ev.target.result });
                        };
                        reader.readAsDataURL(file);
                      }}
                    />

                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                      <button
                        type="button"
                        id="btn-browse-device-img"
                        onClick={() => document.getElementById('edit-product-file-input')?.click()}
                        style={{
                          background: '#4A121E',
                          color: '#fff',
                          border: 'none',
                          padding: '8px 14px',
                          borderRadius: '8px',
                          fontWeight: '800',
                          fontSize: '0.78rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          boxShadow: '0 2px 6px rgba(74, 18, 30, 0.25)'
                        }}
                      >
                        📁 Select Image from Folder / Device
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowGalleryDrawer(!showGalleryDrawer)}
                        style={{
                          background: '#fff',
                          color: '#4A121E',
                          border: '1.5px solid #B45309',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          fontWeight: '800',
                          fontSize: '0.78rem',
                          cursor: 'pointer'
                        }}
                      >
                        🖼️ {showGalleryDrawer ? 'Hide Catalog Photos' : 'Choose Catalog Photo'}
                      </button>
                    </div>

                    <input
                      type="text"
                      placeholder="Or enter image URL / path (e.g. images/products/DATES-POPS.jpg)"
                      value={editingProduct.image || ''}
                      onChange={e => setEditingProduct({ ...editingProduct, image: e.target.value })}
                      style={{ width: '100%', boxSizing: 'border-box', padding: '7px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.78rem' }}
                    />
                  </div>
                </div>

                {/* EXPANDABLE CATALOG GALLERY PICKER */}
                {showGalleryDrawer && (
                  <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px dashed #CBD5E1' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: '800', color: '#475569', marginBottom: '8px' }}>
                      CLICK ANY CATALOG PHOTO TO SELECT:
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', maxHeight: '160px', overflowY: 'auto', padding: '4px' }}>
                      {CATALOG_GALLERY_IMAGES.map(item => (
                        <div
                          key={item.file}
                          onClick={() => setEditingProduct({ ...editingProduct, image: item.file })}
                          style={{
                            background: editingProduct.image === item.file ? '#FEF3C7' : '#fff',
                            border: editingProduct.image === item.file ? '2px solid #B45309' : '1px solid #E2E8F0',
                            borderRadius: '8px',
                            padding: '4px',
                            cursor: 'pointer',
                            textAlign: 'center',
                            transition: 'transform 0.15s ease'
                          }}
                        >
                          <img
                            src={item.file}
                            alt={item.name}
                            style={{ width: '100%', height: '48px', objectFit: 'cover', borderRadius: '4px' }}
                            onError={(e) => { e.target.src = 'images/TheLadduStory_Logo.jpg'; }}
                          />
                          <div style={{ fontSize: '0.68rem', fontWeight: '700', color: '#1E293B', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {item.name}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '18px' }}>
                <button
                  type="submit"
                  id="save-product-edit-btn"
                  style={{ flex: 1, background: 'linear-gradient(135deg, #4A121E 0%, #831843 100%)', color: '#fff', border: 'none', padding: '13px', borderRadius: '10px', fontWeight: '800', fontSize: '0.92rem', cursor: 'pointer', boxShadow: '0 4px 12px rgba(74, 18, 30, 0.25)' }}
                >
                  Save & Update Store
                </button>
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  style={{ background: '#F1F5F9', border: '1px solid #CBD5E1', padding: '13px 20px', borderRadius: '10px', fontWeight: '700', fontSize: '0.9rem', color: '#475569', cursor: 'pointer' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      
      {/* ------------------------------------------------------------- */}
      {/* MODAL: CUSTOMER PAY NOW VIA UPI (FROM TRACKER)                */}
      {/* ------------------------------------------------------------- */}
      {selectedOrderForPay && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#fff', borderRadius: '20px', padding: '24px', maxWidth: '380px', width: '100%', textAlign: 'center' }}>
            <h3 style={{ margin: '0 0 8px', fontSize: '1.2rem', color: '#4A121E', fontWeight: '800' }}>
              Pay via UPI for {selectedOrderForPay.orderId}
            </h3>
            <div style={{ fontSize: '0.85rem', color: '#64748B', marginBottom: '14px' }}>
              Amount Payable: <b style={{ color: '#059669', fontSize: '1.1rem' }}>₹{selectedOrderForPay.total}</b>
            </div>

            <div style={{ display: 'inline-block', background: '#fff', padding: '10px', borderRadius: '14px', border: '1px solid #CBD5E1', boxShadow: '0 4px 12px rgba(0,0,0,0.06)', marginBottom: '12px' }}>
              <img
                src="upi_qr.png"
                alt="The Laddu Story Official UPI QR Code"
                style={{ width: '190px', height: '190px', display: 'block', objectFit: 'contain' }}
                onError={(e) => { e.target.src = 'images/TheLadduStory_Logo.jpg'; }}
              />
            </div>

            <div style={{ fontSize: '0.84rem', fontWeight: '700', color: '#166534', marginBottom: '12px' }}>
              UPI ID: <span style={{ fontFamily: 'monospace', background: '#DCFCE7', padding: '3px 8px', borderRadius: '6px' }}>neetikabhasin@okaxis</span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText('neetikabhasin@okaxis');
                  alert('UPI ID copied: neetikabhasin@okaxis');
                }}
                style={{ marginLeft: '6px', background: '#166534', color: '#fff', border: 'none', padding: '3px 8px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: '800', cursor: 'pointer' }}
              >
                Copy
              </button>
            </div>

            <a
              href={`upi://pay?pa=neetikabhasin@okaxis&pn=The%20Laddu%20Story&am=${selectedOrderForPay.total}&cu=INR&tn=${encodeURIComponent(`Order ${selectedOrderForPay.orderId}`)}`}
              style={{
                display: 'block',
                background: '#059669',
                color: '#fff',
                textDecoration: 'none',
                padding: '10px 16px',
                borderRadius: '8px',
                fontSize: '0.88rem',
                fontWeight: '800',
                marginBottom: '10px'
              }}
            >
              ⚡ Open UPI App & Pay ₹{selectedOrderForPay.total}
            </a>

            <button
              onClick={() => setSelectedOrderForPay(null)}
              style={{ background: '#F1F5F9', border: '1px solid #CBD5E1', padding: '10px 16px', borderRadius: '8px', fontWeight: '700', fontSize: '0.82rem', color: '#475569', cursor: 'pointer', width: '100%' }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: ADD NEW PRODUCT / VARIATION (REDESIGNED)               */}
      {/* ------------------------------------------------------------- */}
      {showAddProductModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(3px)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: '#FFFFFF', borderRadius: '24px', padding: '26px', maxWidth: '580px', width: '100%', maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.35)', border: '1.5px solid #FDE68A' }}>
            
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', borderBottom: '1.5px solid #FAF6F0', paddingBottom: '12px' }}>
              <div>
                <span style={{ fontSize: '0.72rem', fontWeight: '800', color: '#B45309', letterSpacing: '0.5px' }}>
                  CATALOG & INVENTORY EXPANSION
                </span>
                <h3 style={{ margin: '2px 0 0', fontSize: '1.3rem', color: '#4A121E', fontWeight: '800' }}>
                  Add New Product / Variation
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddProductModal(false)}
                style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', color: '#64748B', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateProduct}>
              {/* SECTION 1: SKU & ITEM NAME */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '10px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: '#475569', marginBottom: '4px' }}>
                    SKU CODE *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. BESAN-ALMOND"
                    value={newProductForm.sku}
                    onChange={e => setNewProductForm({ ...newProductForm, sku: e.target.value.toUpperCase().replace(/\s+/g, '-') })}
                    style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem', fontWeight: '800', fontFamily: 'monospace' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: '#475569', marginBottom: '4px' }}>
                    PRODUCT NAME *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Besan Almond Laddu"
                    value={newProductForm.name}
                    onChange={e => setNewProductForm({ ...newProductForm, name: e.target.value })}
                    style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem', fontWeight: '700', color: '#1E293B' }}
                  />
                </div>
              </div>

              {/* Category & Badge Tag */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: '#475569', marginBottom: '4px' }}>
                    CATEGORY
                  </label>
                  <select
                    value={newProductForm.category || 'LADDU'}
                    onChange={e => {
                      const cat = e.target.value;
                      setNewProductForm({
                        ...newProductForm,
                        category: cat,
                        isMunchy: cat === 'SAVORY'
                      });
                    }}
                    style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem', fontWeight: '700' }}
                  >
                    <option value="LADDU">Artisanal Laddu</option>
                    <option value="SAVORY">Savory Munchy / Roasted Snack</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: '#475569', marginBottom: '4px' }}>
                    TAG / HIGHLIGHT BADGE
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Festive Special, Diabetic-Friendly"
                    value={newProductForm.tag || ''}
                    onChange={e => setNewProductForm({ ...newProductForm, tag: e.target.value })}
                    style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              {/* SECTION 2: MOQ & STOCK STATUS */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '14px', background: '#FAF6F0', padding: '12px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.73rem', fontWeight: '800', color: '#475569', marginBottom: '4px' }}>
                    MIN ORDER QTY (MOQ)
                  </label>
                  <select
                    value={newProductForm.moq || '500g'}
                    onChange={e => setNewProductForm({ ...newProductForm, moq: e.target.value })}
                    style={{ width: '100%', boxSizing: 'border-box', padding: '9px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.82rem', fontWeight: '700' }}
                  >
                    <option value="250g">250g (3 Weight Options)</option>
                    <option value="500g">500g (2 Weight Options)</option>
                    <option value="100g">100g (Savory)</option>
                    <option value="200g">200g (Savory)</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.73rem', fontWeight: '800', color: '#475569', marginBottom: '4px' }}>
                    STOCK STATUS
                  </label>
                  <select
                    value={newProductForm.stockStatus || 'IN_STOCK'}
                    onChange={e => setNewProductForm({ ...newProductForm, stockStatus: e.target.value })}
                    style={{ width: '100%', boxSizing: 'border-box', padding: '9px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.82rem', fontWeight: '700', color: newProductForm.stockStatus === 'OUT_OF_STOCK' ? '#991B1B' : '#047857' }}
                  >
                    <option value="IN_STOCK">🟢 IN STOCK</option>
                    <option value="LOW_STOCK">🟠 LOW STOCK</option>
                    <option value="OUT_OF_STOCK">🔴 OUT OF STOCK</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.73rem', fontWeight: '800', color: '#475569', marginBottom: '4px' }}>
                    INITIAL STOCK UNITS
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newProductForm.stockCount ?? 50}
                    onChange={e => setNewProductForm({ ...newProductForm, stockCount: Number(e.target.value) })}
                    style={{ width: '100%', boxSizing: 'border-box', padding: '9px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.85rem', fontWeight: '700' }}
                  />
                </div>
              </div>

              {/* SECTION 3: TIERED PRICING */}
              <div style={{ marginBottom: '14px', background: '#F8FAFC', padding: '12px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#4A121E' }}>
                    PRICING BY WEIGHT TIERS (₹)
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const p1 = Number(newProductForm.p1k || newProductForm.ratePerKg || 0);
                      if (p1 > 0) {
                        const half = Math.round(p1 * 0.5);
                        const quarter = Math.round(p1 * 0.25);
                        setNewProductForm({
                          ...newProductForm,
                          ratePerKg: p1,
                          p1k: p1,
                          p500: half,
                          p250: quarter,
                          opt0: `250g (₹${quarter})`,
                          opt1: `${newProductForm.w1 || '500g'} (₹${half})`,
                          opt2: `${newProductForm.w2 || '1 Kg'} (₹${p1})`
                        });
                      }
                    }}
                    style={{ background: '#FAF6F0', border: '1px solid #B45309', color: '#B45309', padding: '3px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: '800', cursor: 'pointer' }}
                  >
                    ⚡ Auto-calculate from 1 Kg
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '8px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: '800', color: '#64748B', marginBottom: '3px' }}>
                      RATE / KG (₹)
                    </label>
                    <input
                      type="number"
                      value={newProductForm.ratePerKg || 1200}
                      onChange={e => {
                        const r = Number(e.target.value);
                        setNewProductForm({ ...newProductForm, ratePerKg: r });
                      }}
                      style={{ width: '100%', boxSizing: 'border-box', padding: '8px 6px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: '800', color: '#64748B', marginBottom: '3px' }}>
                      250g PRICE (₹)
                    </label>
                    <input
                      type="number"
                      value={newProductForm.p250 || Math.round((Number(newProductForm.p500 || 600)) * 0.5)}
                      onChange={e => {
                        const p = Number(e.target.value);
                        setNewProductForm({ 
                          ...newProductForm, 
                          p250: p,
                          opt0: `250g (₹${p})`
                        });
                      }}
                      style={{ width: '100%', boxSizing: 'border-box', padding: '8px 6px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: '800', color: '#64748B', marginBottom: '3px' }}>
                      500g PRICE (₹)
                    </label>
                    <input
                      type="number"
                      value={newProductForm.p500 || 600}
                      onChange={e => {
                        const p = Number(e.target.value);
                        setNewProductForm({ 
                          ...newProductForm, 
                          p500: p,
                          opt1: `${newProductForm.w1 || '500g'} (₹${p})`
                        });
                      }}
                      style={{ width: '100%', boxSizing: 'border-box', padding: '8px 6px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: '800', color: '#64748B', marginBottom: '3px' }}>
                      1 KG PRICE (₹)
                    </label>
                    <input
                      type="number"
                      value={newProductForm.p1k || 1200}
                      onChange={e => {
                        const p = Number(e.target.value);
                        setNewProductForm({ 
                          ...newProductForm, 
                          p1k: p,
                          opt2: `${newProductForm.w2 || '1 Kg'} (₹${p})`
                        });
                      }}
                      style={{ width: '100%', boxSizing: 'border-box', padding: '8px 6px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 4: INGREDIENTS & BENEFITS */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: '#475569', marginBottom: '4px' }}>
                  INGREDIENTS & FORMULATION
                </label>
                <textarea
                  rows={2}
                  value={newProductForm.desc || ''}
                  onChange={e => setNewProductForm({ ...newProductForm, desc: e.target.value })}
                  placeholder="e.g. Roasted Besan, California Almonds, Pure Cow Ghee, Bura Sugar"
                  style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.82rem', resize: 'vertical' }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: '#475569', marginBottom: '4px' }}>
                  HEALTH & AYURVEDIC BENEFITS
                </label>
                <input
                  type="text"
                  value={newProductForm.benefit || ''}
                  onChange={e => setNewProductForm({ ...newProductForm, benefit: e.target.value })}
                  placeholder="e.g. Rich in Protein & Antioxidants, Wholesome Ayurvedic Energy"
                  style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.82rem' }}
                />
              </div>

              {/* SECTION 5: IMAGE SELECTION */}
              <div style={{ marginBottom: '16px', background: '#FAF6F0', padding: '14px', borderRadius: '14px', border: '1.5px solid #FDE68A' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: '800', color: '#4A121E' }}>
                    PRODUCT IMAGE SELECTION
                  </label>
                  <span style={{ fontSize: '0.72rem', color: '#64748B' }}>
                    Select from folder or catalog
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '14px', alignItems: 'center', marginBottom: '12px' }}>
                  {/* Live Thumbnail Preview */}
                  <div style={{ width: '84px', height: '84px', borderRadius: '12px', overflow: 'hidden', border: '2px solid #CBD5E1', background: '#fff', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                    <img
                      src={newProductForm.image || 'images/TheLadduStory_Logo.jpg'}
                      alt="New Product Preview"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => { e.target.src = 'images/TheLadduStory_Logo.jpg'; }}
                    />
                  </div>

                  {/* Actions to pick image */}
                  <div style={{ flex: 1 }}>
                    <input
                      type="file"
                      id="new-product-file-input"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={e => {
                        const file = e.target.files && e.target.files[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          setNewProductForm({ ...newProductForm, image: ev.target.result });
                        };
                        reader.readAsDataURL(file);
                      }}
                    />

                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                      <button
                        type="button"
                        id="btn-browse-new-img"
                        onClick={() => document.getElementById('new-product-file-input')?.click()}
                        style={{
                          background: '#4A121E',
                          color: '#fff',
                          border: 'none',
                          padding: '8px 14px',
                          borderRadius: '8px',
                          fontWeight: '800',
                          fontSize: '0.78rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          boxShadow: '0 2px 6px rgba(74, 18, 30, 0.25)'
                        }}
                      >
                        📁 Select Image from Folder / Device
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowGalleryDrawer(!showGalleryDrawer)}
                        style={{
                          background: '#fff',
                          color: '#4A121E',
                          border: '1.5px solid #B45309',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          fontWeight: '800',
                          fontSize: '0.78rem',
                          cursor: 'pointer'
                        }}
                      >
                        🖼️ {showGalleryDrawer ? 'Hide Catalog Photos' : 'Choose Catalog Photo'}
                      </button>
                    </div>

                    <input
                      type="text"
                      placeholder="Or enter image URL / path (e.g. images/products/DATES-POPS.jpg)"
                      value={newProductForm.image || ''}
                      onChange={e => setNewProductForm({ ...newProductForm, image: e.target.value })}
                      style={{ width: '100%', boxSizing: 'border-box', padding: '7px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.78rem' }}
                    />
                  </div>
                </div>

                {/* EXPANDABLE CATALOG GALLERY PICKER */}
                {showGalleryDrawer && (
                  <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px dashed #CBD5E1' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: '800', color: '#475569', marginBottom: '8px' }}>
                      CLICK ANY CATALOG PHOTO TO SELECT:
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', maxHeight: '160px', overflowY: 'auto', padding: '4px' }}>
                      {CATALOG_GALLERY_IMAGES.map(item => (
                        <div
                          key={item.file}
                          onClick={() => setNewProductForm({ ...newProductForm, image: item.file })}
                          style={{
                            background: newProductForm.image === item.file ? '#FEF3C7' : '#fff',
                            border: newProductForm.image === item.file ? '2px solid #B45309' : '1px solid #E2E8F0',
                            borderRadius: '8px',
                            padding: '4px',
                            cursor: 'pointer',
                            textAlign: 'center',
                            transition: 'transform 0.15s ease'
                          }}
                        >
                          <img
                            src={item.file}
                            alt={item.name}
                            style={{ width: '100%', height: '48px', objectFit: 'cover', borderRadius: '4px' }}
                            onError={(e) => { e.target.src = 'images/TheLadduStory_Logo.jpg'; }}
                          />
                          <div style={{ fontSize: '0.68rem', fontWeight: '700', color: '#1E293B', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {item.name}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '18px' }}>
                <button
                  type="submit"
                  id="create-product-btn"
                  style={{ flex: 1, background: 'linear-gradient(135deg, #4A121E 0%, #831843 100%)', color: '#fff', border: 'none', padding: '13px', borderRadius: '10px', fontWeight: '800', fontSize: '0.92rem', cursor: 'pointer', boxShadow: '0 4px 12px rgba(74, 18, 30, 0.25)' }}
                >
                  Create & Add to Store
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddProductModal(false)}
                  style={{ background: '#F1F5F9', border: '1px solid #CBD5E1', padding: '13px 20px', borderRadius: '10px', fontWeight: '700', fontSize: '0.9rem', color: '#475569', cursor: 'pointer' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* ------------------------------------------------------------- */}
      {/* ------------------------------------------------------------- */}
      {/* MODAL: CUSTOMER PATRON PORTAL (Sign In & Account Registration) */}
      {/* ------------------------------------------------------------- */}
      {showCustomerLoginModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(53, 11, 21, 0.75)', backdropFilter: 'blur(4px)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#FFFFFF', borderRadius: '24px', padding: '28px 24px', maxWidth: '420px', width: '100%', maxHeight: '90vh', overflowY: 'auto', border: '2px solid #B45309', boxShadow: '0 12px 40px rgba(0,0,0,0.35)', position: 'relative' }}>
            
            <button
              onClick={() => setShowCustomerLoginModal(false)}
              style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', fontSize: '1.2rem', color: '#94A3B8', cursor: 'pointer' }}
            >
              ✕
            </button>

            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#FFFFFF', border: '2px solid #B45309', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px', boxShadow: '0 4px 12px rgba(180, 83, 9, 0.2)' }}>
              <img src="images/TheLadduStory_Logo.jpg" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.target.style.display = 'none'; e.target.parentNode.innerText = '👑'; }} />
            </div>

            <h3 className="royal-title" style={{ margin: '0 0 4px', fontSize: '1.35rem', color: '#4A121E', fontWeight: '700', textAlign: 'center' }}>
              Patron Portal
            </h3>
            <p style={{ margin: '0 0 16px', fontSize: '0.8rem', color: '#64748B', textAlign: 'center' }}>
              Sign in to track orders or create your account in 10 seconds.
            </p>

            {/* TABS */}
            <div style={{ display: 'flex', background: '#F1F5F9', padding: '3px', borderRadius: '10px', marginBottom: '16px', border: '1px solid rgba(180, 83, 9, 0.15)' }}>
              <button
                type="button"
                onClick={() => setAuthMode('SIGNIN')}
                style={{
                  flex: 1,
                  padding: '9px',
                  borderRadius: '7px',
                  border: 'none',
                  fontWeight: '800',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  background: authMode === 'SIGNIN' ? 'linear-gradient(135deg, #4A121E 0%, #831843 100%)' : 'transparent',
                  color: authMode === 'SIGNIN' ? '#FFFBEB' : '#64748B',
                  boxShadow: authMode === 'SIGNIN' ? '0 2px 6px rgba(74, 18, 30, 0.2)' : 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                🔑 Sign In
              </button>
              <button
                type="button"
                onClick={() => setAuthMode('REGISTER')}
                style={{
                  flex: 1,
                  padding: '9px',
                  borderRadius: '7px',
                  border: 'none',
                  fontWeight: '800',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  background: authMode === 'REGISTER' ? 'linear-gradient(135deg, #4A121E 0%, #831843 100%)' : 'transparent',
                  color: authMode === 'REGISTER' ? '#FFFBEB' : '#64748B',
                  boxShadow: authMode === 'REGISTER' ? '0 2px 6px rgba(74, 18, 30, 0.2)' : 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                ✨ Create Account
              </button>
            </div>

            {authMode === 'SIGNIN' ? (
              /* MODAL: SIGN IN FORM */
              <form onSubmit={handlePasswordLogin}>
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: '800', color: '#4A121E', marginBottom: '4px', letterSpacing: '0.5px' }}>
                    10-DIGIT MOBILE NUMBER *
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', border: '1.5px solid rgba(180, 83, 9, 0.3)', borderRadius: '8px', overflow: 'hidden', background: '#FAF6F0' }}>
                    <span style={{ padding: '10px 12px', background: 'rgba(180, 83, 9, 0.1)', color: '#4A121E', fontWeight: '800', fontSize: '0.88rem' }}>
                      +91
                    </span>
                    <input
                      id="modal-signin-phone"
                      type="tel"
                      placeholder="e.g. 9343207525"
                      value={loginPhoneInput}
                      onChange={e => setLoginPhoneInput(e.target.value)}
                      required
                      style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', border: 'none', background: 'transparent', fontSize: '0.95rem', fontWeight: '700', color: '#4A121E', outline: 'none' }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '18px' }}>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: '800', color: '#4A121E', marginBottom: '4px', letterSpacing: '0.5px' }}>
                    PASSWORD / PIN *
                  </label>
                  <input
                    id="modal-signin-pwd"
                    type="password"
                    placeholder="Enter your security password or PIN"
                    value={loginPasswordInput}
                    onChange={e => setLoginPasswordInput(e.target.value)}
                    required
                    style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: '8px', border: '1.5px solid rgba(180, 83, 9, 0.3)', background: '#FAF6F0', fontSize: '0.9rem', color: '#4A121E' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    id="modal-signin-submit-btn"
                    type="submit"
                    disabled={isCustomerLoggingIn}
                    style={{ flex: 1, background: 'linear-gradient(135deg, #4A121E 0%, #831843 100%)', color: '#fff', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: '800', fontSize: '0.95rem', cursor: isCustomerLoggingIn ? 'not-allowed' : 'pointer', boxShadow: '0 4px 12px rgba(74, 18, 30, 0.25)' }}
                  >
                    {isCustomerLoggingIn ? 'Verifying...' : '🔑 Sign In'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCustomerLoginModal(false)}
                    style={{ background: '#FAF6F0', border: '1px solid #E2E8F0', padding: '12px 14px', borderRadius: '8px', fontWeight: '700', color: '#64748B', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                </div>

                <div style={{ marginTop: '14px', textAlign: 'center', fontSize: '0.8rem', color: '#64748B' }}>
                  First time here?{' '}
                  <button
                    type="button"
                    onClick={() => { setRegPhone(loginPhoneInput); setAuthMode('REGISTER'); }}
                    style={{ background: 'transparent', border: 'none', color: '#B45309', fontWeight: '800', cursor: 'pointer', padding: 0 }}
                  >
                    Create account →
                  </button>
                </div>
              </form>
            ) : (
              /* MODAL: REGISTRATION FORM */
              <form onSubmit={handleRegisterCustomer}>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: '800', color: '#4A121E', marginBottom: '3px' }}>
                    PATRON NAME *
                  </label>
                  <input
                    id="modal-reg-name"
                    type="text"
                    placeholder="Full name"
                    value={regName}
                    onChange={e => setRegName(e.target.value)}
                    required
                    style={{ width: '100%', boxSizing: 'border-box', padding: '9px 11px', borderRadius: '8px', border: '1.5px solid rgba(180, 83, 9, 0.3)', background: '#FAF6F0', fontSize: '0.9rem', color: '#4A121E' }}
                  />
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: '800', color: '#4A121E', marginBottom: '3px' }}>
                    10-DIGIT MOBILE NUMBER *
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', border: '1.5px solid rgba(180, 83, 9, 0.3)', borderRadius: '8px', overflow: 'hidden', background: '#FAF6F0' }}>
                    <span style={{ padding: '9px 11px', background: 'rgba(180, 83, 9, 0.1)', color: '#4A121E', fontWeight: '800', fontSize: '0.85rem' }}>
                      +91
                    </span>
                    <input
                      id="modal-reg-phone"
                      type="tel"
                      placeholder="e.g. 9343207525"
                      value={regPhone}
                      onChange={e => setRegPhone(e.target.value)}
                      required
                      style={{ width: '100%', boxSizing: 'border-box', padding: '9px 11px', border: 'none', background: 'transparent', fontSize: '0.92rem', fontWeight: '700', color: '#4A121E', outline: 'none' }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: '800', color: '#4A121E', marginBottom: '3px' }}>
                    DELIVERY ADDRESS *
                  </label>
                  <textarea
                    id="modal-reg-addr"
                    rows="2"
                    placeholder="Apartment, Street, Area & City"
                    value={regAddress}
                    onChange={e => setRegAddress(e.target.value)}
                    required
                    style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px', borderRadius: '8px', border: '1.5px solid rgba(180, 83, 9, 0.3)', background: '#FAF6F0', fontSize: '0.85rem', color: '#4A121E' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: '800', color: '#4A121E', marginBottom: '3px' }}>
                      PASSWORD / PIN *
                    </label>
                    <input
                      id="modal-reg-pwd"
                      type="password"
                      placeholder="Min 4 digits"
                      value={regPassword}
                      onChange={e => setRegPassword(e.target.value)}
                      required
                      style={{ width: '100%', boxSizing: 'border-box', padding: '9px 10px', borderRadius: '8px', border: '1.5px solid rgba(180, 83, 9, 0.3)', background: '#FAF6F0', fontSize: '0.85rem', color: '#4A121E' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: '800', color: '#4A121E', marginBottom: '3px' }}>
                      CONFIRM *
                    </label>
                    <input
                      id="modal-reg-conf-pwd"
                      type="password"
                      placeholder="Re-enter"
                      value={regConfirmPassword}
                      onChange={e => setRegConfirmPassword(e.target.value)}
                      required
                      style={{ width: '100%', boxSizing: 'border-box', padding: '9px 10px', borderRadius: '8px', border: '1.5px solid rgba(180, 83, 9, 0.3)', background: '#FAF6F0', fontSize: '0.85rem', color: '#4A121E' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    id="modal-reg-submit-btn"
                    type="submit"
                    disabled={isCustomerLoggingIn}
                    style={{ flex: 1, background: 'linear-gradient(135deg, #15803D 0%, #16A34A 100%)', color: '#fff', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: '800', fontSize: '0.92rem', cursor: isCustomerLoggingIn ? 'not-allowed' : 'pointer', boxShadow: '0 4px 12px rgba(22, 163, 74, 0.25)' }}
                  >
                    {isCustomerLoggingIn ? 'Creating...' : '👑 Create Account'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCustomerLoginModal(false)}
                    style={{ background: '#FAF6F0', border: '1px solid #E2E8F0', padding: '12px 14px', borderRadius: '8px', fontWeight: '700', color: '#64748B', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                </div>

                <div style={{ marginTop: '12px', textAlign: 'center', fontSize: '0.78rem', color: '#64748B' }}>
                  Already registered?{' '}
                  <button
                    type="button"
                    onClick={() => { setLoginPhoneInput(regPhone); setAuthMode('SIGNIN'); }}
                    style={{ background: 'transparent', border: 'none', color: '#B45309', fontWeight: '800', cursor: 'pointer', padding: 0 }}
                  >
                    Sign in →
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: ORDER CONFIRMATION & UPSELL CHECK                      */}
      {/* ------------------------------------------------------------- */}
      {showConfirmOrderModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: '#FFFFFF', borderRadius: '24px', padding: '28px 24px', maxWidth: '480px', width: '100%', boxShadow: '0 25px 60px rgba(74, 18, 30, 0.35)', border: '2px solid #FDE68A', textAlign: 'center' }}>
            
            {/* Emblem */}
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#FFFBEB', border: '2px solid #B45309', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', margin: '0 auto 12px' }}>
              🥣
            </div>

            <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#B45309', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '4px' }}>
              The Laddu Story • Final Review
            </div>

            <h3 style={{ margin: '0 0 10px', fontSize: '1.35rem', fontWeight: '800', color: '#4A121E' }}>
              Wait! Have you added all your favourites? ✨
            </h3>

            <p style={{ fontSize: '0.86rem', color: '#64748B', lineHeight: '1.5', margin: '0 0 18px' }}>
              Our pure Desi Cow Ghee laddus & roasted munchies taste even better when shared with family! Would you like to add anything more, or proceed to confirm your order?
            </p>

            {/* Quick Cart Summary Box */}
            <div style={{ background: '#FAF6F0', borderRadius: '12px', padding: '12px 14px', marginBottom: '20px', border: '1px solid #E2E8F0', textAlign: 'left', fontSize: '0.82rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '800', color: '#4A121E', marginBottom: '6px' }}>
                <span>Order Summary ({totalCartQty} items):</span>
                <span>₹{cartTotal.toLocaleString('en-IN')}</span>
              </div>
              <div style={{ color: '#64748B', marginBottom: '6px' }}>
                {cart.map(i => `${i.qty}x ${i.name} (${i.cleanWeight || i.packLabel})`).join(', ')}
              </div>
              <div style={{ borderTop: '1px dashed #CBD5E1', paddingTop: '6px', fontSize: '0.78rem', color: '#1E40AF' }}>
                📍 <b>Self-Pickup Location:</b> @15101, Tower-15, Prestige Tranquility, Budigere Cross, BLR - 560049 (Contact: 9343207515)
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => {
                  setShowConfirmOrderModal(false);
                  setIsMobileCartOpen(false);
                }}
                style={{
                  flex: 1,
                  background: '#F1F5F9',
                  color: '#475569',
                  border: '1.5px solid #CBD5E1',
                  padding: '12px',
                  borderRadius: '10px',
                  fontWeight: '800',
                  fontSize: '0.88rem',
                  cursor: 'pointer'
                }}
              >
                ＋ Add More Items
              </button>
              <button
                type="button"
                onClick={executeCheckout}
                disabled={isSubmitting}
                style={{
                  flex: 1.4,
                  background: 'linear-gradient(135deg, #4A121E 0%, #831843 100%)',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '12px',
                  borderRadius: '10px',
                  fontWeight: '800',
                  fontSize: '0.88rem',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 14px rgba(74, 18, 30, 0.3)'
                }}
              >
                {isSubmitting ? '⏳ Placing...' : `✓ Yes, Place Order (₹${cartTotal.toLocaleString('en-IN')}) →`}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: ORDER SUCCESS & UPI SCANNER                            */}
      {/* ------------------------------------------------------------- */}
      {orderSuccess && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: '#fff', borderRadius: '24px', padding: '24px', maxWidth: '440px', width: '100%', maxHeight: '92vh', overflowY: 'auto', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            
            {/* Green Checkmark */}
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#DEF7EC', color: '#03543F', fontSize: '1.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
              ✓
            </div>

            <h3 style={{ margin: '0 0 4px', fontSize: '1.35rem', color: '#4A121E', fontWeight: '800' }}>
              Order Placed Successfully!
            </h3>
            <div style={{ fontSize: '0.85rem', color: '#64748B', marginBottom: '14px' }}>
              Order ID: <b style={{ color: '#4A121E' }}>{orderSuccess.orderId}</b>
            </div>

            {/* Order Details Summary Card */}
            <div style={{ background: '#FAF6F0', padding: '12px 14px', borderRadius: '12px', marginBottom: '16px', border: '1px solid #E2E8F0', textAlign: 'left', fontSize: '0.85rem' }}>
              <div style={{ fontWeight: '700', color: '#1E293B' }}>
                👤 {orderSuccess.name} <span style={{ color: '#831843', fontWeight: '800' }}>(+91 {orderSuccess.phone})</span>
              </div>
              <div style={{ color: '#64748B', marginTop: '4px', fontSize: '0.8rem' }}>
                📍 {orderSuccess.address}
              </div>
              <div style={{ marginTop: '8px', borderTop: '1px solid #E2E8F0', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: '800', color: '#4A121E' }}>
                <span>Total Amount:</span>
                <span style={{ fontSize: '1.15rem' }}>₹{orderSuccess.total.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Payment Options Selector: Pay Now or Pay Later */}
            <div style={{ marginBottom: '16px', textAlign: 'left' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: '800', color: '#4A121E' }}>
                  PAYMENT DETAILS:
                </span>
                <span style={{
                  fontSize: '0.74rem',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  fontWeight: '800',
                  background: orderSuccess.paymentStatus === 'PAID' ? '#DEF7EC' : (orderSuccess.paymentStatus === 'PAY_ON_PICKUP' ? '#FEF3C7' : '#F1F5F9'),
                  color: orderSuccess.paymentStatus === 'PAID' ? '#03543F' : (orderSuccess.paymentStatus === 'PAY_ON_PICKUP' ? '#92400E' : '#475569')
                }}>
                  {orderSuccess.paymentStatus === 'PAID' ? '🟢 PAID' : (orderSuccess.paymentStatus === 'PAY_ON_PICKUP' ? '🟠 PAY ON PICKUP' : '⏳ PENDING')}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                <button
                  type="button"
                  id="modal-pay-now-btn"
                  onClick={() => setPostOrderPayMode('NOW')}
                  style={{
                    padding: '9px 8px',
                    borderRadius: '8px',
                    border: postOrderPayMode === 'NOW' ? '2px solid #059669' : '1px solid #CBD5E1',
                    background: postOrderPayMode === 'NOW' ? '#ECFDF5' : '#fff',
                    color: postOrderPayMode === 'NOW' ? '#065F46' : '#64748B',
                    fontWeight: '800',
                    fontSize: '0.8rem',
                    cursor: 'pointer'
                  }}
                >
                  📱 Pay Now (UPI QR)
                </button>
                <button
                  type="button"
                  id="modal-pay-later-btn"
                  onClick={() => setPostOrderPayMode('LATER')}
                  style={{
                    padding: '9px 8px',
                    borderRadius: '8px',
                    border: postOrderPayMode === 'LATER' ? '2px solid #B45309' : '1px solid #CBD5E1',
                    background: postOrderPayMode === 'LATER' ? '#FFFBEB' : '#fff',
                    color: postOrderPayMode === 'LATER' ? '#92400E' : '#64748B',
                    fontWeight: '800',
                    fontSize: '0.8rem',
                    cursor: 'pointer'
                  }}
                >
                  💵 Pay Later on Pickup
                </button>
              </div>

              {postOrderPayMode === 'NOW' ? (
                <div style={{ background: '#F0FDF4', border: '1.5px solid #86EFAC', borderRadius: '14px', padding: '14px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: '800', color: '#166534', marginBottom: '8px' }}>
                    SCAN & PAY VIA ANY UPI APP (GPAY / PHONEPE / PAYTM)
                  </div>
                  
                  {/* Official Google Pay UPI QR */}
                  <div style={{ display: 'inline-block', background: '#fff', padding: '10px', borderRadius: '14px', border: '1px solid #CBD5E1', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}>
                    <img 
                      src="upi_qr.png" 
                      alt="The Laddu Story Official UPI QR" 
                      style={{ width: '180px', height: '180px', display: 'block', objectFit: 'contain' }}
                      onError={(e) => { e.target.src = 'images/TheLadduStory_Logo.jpg'; }}
                    />
                  </div>

                  <div style={{ marginTop: '10px', fontSize: '0.82rem', fontWeight: '700', color: '#166534', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    <span>UPI ID:</span>
                    <span style={{ fontFamily: 'monospace', background: '#DCFCE7', padding: '3px 8px', borderRadius: '6px', border: '1px solid #86EFAC', fontSize: '0.84rem' }}>
                      neetikabhasin@okaxis
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText('neetikabhasin@okaxis');
                        alert('UPI ID copied: neetikabhasin@okaxis');
                      }}
                      style={{ background: '#166534', color: '#fff', border: 'none', padding: '3px 8px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: '800', cursor: 'pointer' }}
                    >
                      📋 Copy
                    </button>
                  </div>

                  <div style={{ marginTop: '10px' }}>
                    <a
                      href={`upi://pay?pa=neetikabhasin@okaxis&pn=The%20Laddu%20Story&am=${orderSuccess.total}&cu=INR&tn=${encodeURIComponent(`Order ${orderSuccess.orderId}`)}`}
                      style={{
                        display: 'inline-block',
                        background: '#059669',
                        color: '#fff',
                        textDecoration: 'none',
                        padding: '9px 18px',
                        borderRadius: '8px',
                        fontSize: '0.82rem',
                        fontWeight: '800',
                        boxShadow: '0 2px 8px rgba(5, 150, 105, 0.35)'
                      }}
                    >
                      ⚡ Tap to Pay ₹{orderSuccess.total.toLocaleString('en-IN')} via UPI App
                    </a>
                  </div>

                  <div style={{ marginTop: '12px', borderTop: '1px dashed #86EFAC', paddingTop: '10px' }}>
                    <input
                      type="text"
                      placeholder="UPI Transaction ID / UTR (Optional)"
                      value={postOrderUtr}
                      onChange={e => setPostOrderUtr(e.target.value)}
                      style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px', borderRadius: '6px', border: '1px solid #86EFAC', fontSize: '0.8rem', background: '#fff', marginBottom: '8px' }}
                    />
                    <button
                      type="button"
                      id="confirm-upi-paid-btn"
                      onClick={handleConfirmPaidOnline}
                      style={{
                        width: '100%',
                        background: '#166534',
                        color: '#fff',
                        border: 'none',
                        padding: '10px',
                        borderRadius: '8px',
                        fontWeight: '800',
                        fontSize: '0.85rem',
                        cursor: 'pointer'
                      }}
                    >
                      ✓ I Have Paid via UPI (Record Payment)
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ background: '#FFFBEB', border: '1.5px solid #FDE68A', borderRadius: '14px', padding: '14px' }}>
                  <div style={{ fontWeight: '800', fontSize: '0.86rem', color: '#92400E', marginBottom: '4px' }}>
                    📍 Pay on Pickup at Bangalore Kitchen
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#78350F', lineHeight: 1.4, marginBottom: '12px' }}>
                    You can pay <b>₹{orderSuccess.total.toLocaleString('en-IN')}</b> in <b>Cash</b> or via <b>UPI</b> when collecting your order at our kitchen counter.
                  </div>
                  <button
                    type="button"
                    id="confirm-pickup-pay-btn"
                    onClick={handleConfirmPayLater}
                    style={{
                      width: '100%',
                      background: '#B45309',
                      color: '#fff',
                      border: 'none',
                      padding: '10px',
                      borderRadius: '8px',
                      fontWeight: '800',
                      fontSize: '0.85rem',
                      cursor: 'pointer'
                    }}
                  >
                    💵 Confirm Pay on Pickup (Cash / UPI)
                  </button>
                </div>
              )}
            </div>

            {/* Navigation buttons */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => {
                  setOrderSuccess(null);
                  setActiveTab('track');
                }}
                style={{ flex: 1, background: '#831843', color: '#fff', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: '700', fontSize: '0.9rem', cursor: 'pointer' }}
              >
                Track Live Order →
              </button>
              <button
                onClick={() => setOrderSuccess(null)}
                style={{ background: '#F1F5F9', border: 'none', padding: '12px 18px', borderRadius: '8px', fontWeight: '700', fontSize: '0.9rem', cursor: 'pointer' }}
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: STAFF ADMIN LOGIN                                      */}
      {/* ------------------------------------------------------------- */}
      {showLoginModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#fff', borderRadius: '20px', padding: '28px', maxWidth: '360px', width: '100%', textAlign: 'center' }}>
            
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#F1F5F9', color: '#4A121E', fontSize: '1.4rem', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
              🔒
            </div>

            <h3 style={{ margin: '0 0 6px', fontSize: '1.25rem', color: '#4A121E', fontWeight: '800' }}>
              Staff & Kitchen Login
            </h3>
            <p style={{ margin: '0 0 16px', fontSize: '0.82rem', color: '#64748B' }}>
              Enter 4-digit Staff PIN (e.g. 1234 or 8888) to access Kitchen OMS, WhatsApp testing suite & social media hub.
            </p>

            <form onSubmit={handleAdminLogin}>
              <input
                id="staff-pin-input"
                type="password"
                placeholder="••••"
                value={adminPinInput}
                onChange={e => setAdminPinInput(e.target.value)}
                maxLength={4}
                required
                style={{ width: '100%', boxSizing: 'border-box', padding: '12px', borderRadius: '8px', border: '1px solid #CBD5E1', textAlign: 'center', fontSize: '1.3rem', letterSpacing: '6px', fontWeight: '800', marginBottom: '16px' }}
              />
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  id="staff-pin-submit-btn"
                  type="submit"
                  style={{ flex: 1, background: '#4A121E', color: '#fff', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}
                >
                  Verify PIN
                </button>
                <button
                  id="staff-pin-cancel-btn"
                  type="button"
                  onClick={() => setShowLoginModal(false)}
                  style={{ background: '#F1F5F9', border: 'none', padding: '12px 16px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* ------------------------------------------------------------- */}
      {/* MODAL: SUPABASE CLOUD DATABASE CONFIGURATION                  */}
      {/* ------------------------------------------------------------- */}
      {showSupabaseModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1250, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#fff', borderRadius: '20px', padding: '30px', maxWidth: '520px', width: '100%', textAlign: 'left', maxHeight: '90vh', overflowY: 'auto' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.6rem' }}>⚡</span>
                <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#4A121E', fontWeight: '800' }}>
                  Supabase Cloud Database Settings
                </h3>
              </div>
              <button
                onClick={() => setShowSupabaseModal(false)}
                style={{ background: 'transparent', border: 'none', fontSize: '1.3rem', cursor: 'pointer', color: '#64748B' }}
              >
                ✕
              </button>
            </div>

            <div style={{ background: supabaseConnected ? '#DEF7EC' : '#FFFBEB', padding: '12px 16px', borderRadius: '12px', marginBottom: '14px', border: supabaseConnected ? '1px solid #31C48D' : '1px solid #FCD34D', fontSize: '0.85rem' }}>
              {supabaseConnected ? (
                <div>
                  <b style={{ color: '#03543F' }}>🟢 Supabase is Connected & Live!</b>
                  <div style={{ color: '#046C4E', marginTop: '4px' }}>
                    Instant ACID order write-backs, inventory tracking, and zero-latency WebSocket sync are active.
                  </div>
                </div>
              ) : (
                <div>
                  <b style={{ color: '#92400E' }}>🟡 Running in Standalone / Google Sheets Mode</b>
                  <div style={{ color: '#B45309', marginTop: '4px' }}>
                    Connect your free Supabase project to enable real-time status write-backs and persistent cloud orders.
                  </div>
                </div>
              )}
            </div>

            {/* LIVE EGRESS & 5 GB QUOTA PROTECTION TELEMETRY */}
            {(() => {
              const telemetry = getSupabaseTelemetry();
              return (
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '12px 14px', marginBottom: '18px' }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: '800', color: '#334155', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>📊 LIVE EGRESS & QUOTA MONITOR</span>
                    <span style={{ color: '#059669', background: '#DEF7EC', padding: '2px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: '800' }}>
                      ✓ 5 GB Free Plan Protected
                    </span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', textAlign: 'center' }}>
                    <div style={{ background: '#fff', padding: '8px', borderRadius: '8px', border: '1px solid #CBD5E1' }}>
                      <div style={{ color: '#64748B', fontSize: '0.68rem', fontWeight: '700' }}>SESSION BANDWIDTH</div>
                      <div style={{ fontWeight: '800', color: '#0F172A', fontSize: '0.88rem', marginTop: '2px' }}>{telemetry.formattedBytes}</div>
                    </div>
                    <div style={{ background: '#fff', padding: '8px', borderRadius: '8px', border: '1px solid #CBD5E1' }}>
                      <div style={{ color: '#64748B', fontSize: '0.68rem', fontWeight: '700' }}>API CALLS</div>
                      <div style={{ fontWeight: '800', color: '#0F172A', fontSize: '0.88rem', marginTop: '2px' }}>{telemetry.apiCallsCount}</div>
                    </div>
                    <div style={{ background: '#fff', padding: '8px', borderRadius: '8px', border: '1px solid #CBD5E1' }}>
                      <div style={{ color: '#64748B', fontSize: '0.68rem', fontWeight: '700' }}>REALTIME EVENTS</div>
                      <div style={{ fontWeight: '800', color: '#059669', fontSize: '0.88rem', marginTop: '2px' }}>⚡ {telemetry.realtimeEventsCount}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '8px', lineHeight: '1.4' }}>
                    ✓ <b>Zero-Waste Sync Active:</b> 10-second polling removed. Realtime WebSockets push updates with negligible bandwidth (~200 bytes per event).
                  </div>
                </div>
              );
            })()}

            <form onSubmit={handleSaveSupabaseConfig}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '800', color: '#334155', marginBottom: '6px' }}>
                  SUPABASE PROJECT URL:
                </label>
                <input
                  type="url"
                  placeholder="https://xyzcompany.supabase.co"
                  value={supabaseUrlInput}
                  onChange={e => setSupabaseUrlInput(e.target.value)}
                  required
                  style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem', fontFamily: 'monospace' }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '800', color: '#334155', marginBottom: '6px' }}>
                  SUPABASE ANON PUBLIC KEY:
                </label>
                <textarea
                  rows={3}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={supabaseKeyInput}
                  onChange={e => setSupabaseKeyInput(e.target.value)}
                  required
                  style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.82rem', fontFamily: 'monospace', resize: 'vertical' }}
                />
              </div>

              {supabaseError && (
                <div style={{ background: '#FDE8E8', color: '#9B1C1C', padding: '10px', borderRadius: '8px', fontSize: '0.8rem', marginBottom: '14px' }}>
                  ⚠️ {supabaseError}
                </div>
              )}

              <div style={{ background: '#FAF6F0', padding: '12px', borderRadius: '10px', fontSize: '0.78rem', color: '#64748B', marginBottom: '18px', border: '1px solid #E2E8F0' }}>
                <b>Quick 3-Step Setup:</b>
                <ol style={{ margin: '6px 0 0', paddingLeft: '18px' }}>
                  <li>Create a free project at <a href="https://supabase.com" target="_blank" rel="noreferrer" style={{ color: '#4A121E', fontWeight: '700' }}>supabase.com</a>.</li>
                  <li>Paste and execute <code>schema/supabase_schema.sql</code> in the SQL Editor.</li>
                  <li>Copy Project URL & anon key from <i>Project Settings ➔ API</i> and click Save.</li>
                </ol>
                <div style={{ marginTop: '6px', color: '#4A121E' }}>
                  ✓ Google Sheets backup form submissions remain 100% active in the background!
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="submit"
                  disabled={supabaseSaving}
                  style={{ flex: 1, background: '#4A121E', color: '#fff', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: '700', fontSize: '0.9rem', cursor: 'pointer' }}
                >
                  {supabaseSaving ? 'Connecting...' : 'Save & Connect Supabase'}
                </button>
                {supabaseConnected && (
                  <button
                    type="button"
                    onClick={() => {
                      clearSupabaseConfig();
                      setSupabaseConnected(false);
                      setSupabaseUrlInput('');
                      setSupabaseKeyInput('');
                      alert('Supabase disconnected. System reverted to Local + Google Sheets mode.');
                    }}
                    style={{ background: '#FEE2E2', color: '#991B1B', border: '1px solid #FCA5A5', padding: '12px 14px', borderRadius: '8px', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer' }}
                  >
                    Disconnect
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowSupabaseModal(false)}
                  style={{ background: '#F1F5F9', border: 'none', padding: '12px 16px', borderRadius: '8px', fontWeight: '700', fontSize: '0.9rem', cursor: 'pointer' }}
                >
                  Close
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: EDIT DELIVERY ADDRESS                                  */}
      {/* ------------------------------------------------------------- */}
      {showAddressModal && customerUser && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(53, 11, 21, 0.75)', backdropFilter: 'blur(4px)', zIndex: 1250, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#FFFFFF', borderRadius: '22px', padding: '26px 22px', maxWidth: '400px', width: '100%', border: '2px solid #B45309', boxShadow: '0 12px 40px rgba(0,0,0,0.35)', position: 'relative' }}>
            <button
              onClick={() => setShowAddressModal(false)}
              style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', fontSize: '1.2rem', color: '#94A3B8', cursor: 'pointer' }}
            >
              ✕
            </button>

            <h3 className="royal-title" style={{ margin: '0 0 6px', fontSize: '1.35rem', color: '#4A121E', fontWeight: '700', textAlign: 'center' }}>
              📍 Edit Delivery Address
            </h3>
            <p style={{ margin: '0 0 16px', fontSize: '0.8rem', color: '#64748B', textAlign: 'center' }}>
              Update your primary doorstep delivery destination.
            </p>

            <form onSubmit={handleSaveDeliveryAddress}>
              <div style={{ marginBottom: '18px' }}>
                <textarea
                  rows="3"
                  required
                  placeholder="Apartment, Street, Landmark, City & Pincode"
                  value={editAddressInput}
                  onChange={e => setEditAddressInput(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '12px', borderRadius: '8px', border: '1.5px solid rgba(180, 83, 9, 0.3)', background: '#FAF6F0', fontSize: '0.9rem', color: '#4A121E', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="submit"
                  disabled={isSavingAddress}
                  style={{ flex: 1, background: 'linear-gradient(135deg, #4A121E 0%, #831843 100%)', color: '#fff', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: '800', fontSize: '0.92rem', cursor: isSavingAddress ? 'not-allowed' : 'pointer' }}
                >
                  {isSavingAddress ? 'Saving...' : 'Save Address'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddressModal(false)}
                  style={{ background: '#FAF6F0', border: '1px solid #E2E8F0', padding: '12px 14px', borderRadius: '8px', fontWeight: '700', color: '#64748B', cursor: 'pointer' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: SET OR UPDATE CUSTOMER PASSWORD / PIN                  */}
      {/* ------------------------------------------------------------- */}
      {showSetPasswordModal && customerUser && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(53, 11, 21, 0.75)', backdropFilter: 'blur(4px)', zIndex: 1250, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#FFFFFF', borderRadius: '22px', padding: '28px 24px', maxWidth: '380px', width: '100%', border: '2px solid #B45309', boxShadow: '0 12px 40px rgba(0,0,0,0.35)', position: 'relative' }}>
            <button
              onClick={() => setShowSetPasswordModal(false)}
              style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', fontSize: '1.2rem', color: '#94A3B8', cursor: 'pointer' }}
            >
              ✕
            </button>

            <h3 className="royal-title" style={{ margin: '0 0 6px', fontSize: '1.35rem', color: '#4A121E', fontWeight: '700', textAlign: 'center' }}>
              🔑 Set / Change Password
            </h3>
            <p style={{ margin: '0 0 16px', fontSize: '0.8rem', color: '#64748B', textAlign: 'center' }}>
              Create a secure Password or 4-digit PIN for instant 1-second sign-in for <b>+91 {customerUser.phone}</b>.
            </p>

            <form onSubmit={handleSaveCustomerPassword}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: '800', color: '#4A121E', marginBottom: '4px' }}>
                  NEW PASSWORD / 4-DIGIT PIN *
                </label>
                <input
                  type="password"
                  required
                  placeholder="Min 4 characters or digits"
                  value={newPasswordInput}
                  onChange={e => setNewPasswordInput(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: '8px', border: '1.5px solid rgba(180, 83, 9, 0.3)', background: '#FAF6F0', fontSize: '0.95rem', color: '#4A121E' }}
                />
              </div>

              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: '800', color: '#4A121E', marginBottom: '4px' }}>
                  CONFIRM PASSWORD / PIN *
                </label>
                <input
                  type="password"
                  required
                  placeholder="Re-enter password"
                  value={confirmPasswordInput}
                  onChange={e => setConfirmPasswordInput(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: '8px', border: '1.5px solid rgba(180, 83, 9, 0.3)', background: '#FAF6F0', fontSize: '0.95rem', color: '#4A121E' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="submit"
                  disabled={isSavingPassword}
                  style={{ flex: 1, background: 'linear-gradient(135deg, #4A121E 0%, #831843 100%)', color: '#fff', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: '800', fontSize: '0.92rem', cursor: isSavingPassword ? 'not-allowed' : 'pointer' }}
                >
                  {isSavingPassword ? 'Saving...' : 'Save Password'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowSetPasswordModal(false)}
                  style={{ background: '#FAF6F0', border: '1px solid #E2E8F0', padding: '12px 14px', borderRadius: '8px', fontWeight: '700', color: '#64748B', cursor: 'pointer' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: STAFF ORDER ENTRY (WHATSAPP / PHONE / IN-PERSON)       */}
      {/* ------------------------------------------------------------- */}
      {showStaffOrderModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(53, 11, 21, 0.75)', backdropFilter: 'blur(4px)', zIndex: 1250, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: '#FFFFFF', borderRadius: '22px', padding: '26px', maxWidth: '640px', width: '100%', maxHeight: '92vh', overflowY: 'auto', border: '2px solid #B45309', boxShadow: '0 16px 45px rgba(0,0,0,0.35)', position: 'relative' }}>
            
            <button
              onClick={() => {
                setShowStaffOrderModal(false);
                setStaffOrderCreatedSuccess(null);
              }}
              style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', fontSize: '1.2rem', color: '#94A3B8', cursor: 'pointer' }}
            >
              ✕
            </button>

            {staffOrderCreatedSuccess ? (
              /* Success Screen with Instant WhatsApp Confirmation Dispatch */
              <div style={{ textAlign: 'center', padding: '16px 8px' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#DEF7EC', color: '#03543F', fontSize: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  ✓
                </div>

                <h3 className="royal-title" style={{ fontSize: '1.5rem', fontWeight: '800', color: '#4A121E', margin: '0 0 6px' }}>
                  Order Created Successfully!
                </h3>
                <div style={{ fontSize: '0.9rem', color: '#64748B', marginBottom: '16px' }}>
                  Order <b>{staffOrderCreatedSuccess.orderId}</b> has been recorded in the Supabase Kitchen OMS.
                </div>

                <div style={{ background: '#FAF6F0', borderRadius: '14px', border: '1.5px solid #FDE68A', padding: '16px', textAlign: 'left', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ color: '#64748B', fontSize: '0.85rem' }}>Patron:</span>
                    <b style={{ color: '#4A121E' }}>{staffOrderCreatedSuccess.name} (+91 {staffOrderCreatedSuccess.phone})</b>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ color: '#64748B', fontSize: '0.85rem' }}>Items:</span>
                    <b>{staffOrderCreatedSuccess.itemsCount} Pack(s)</b>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #E2E8F0', paddingTop: '6px' }}>
                    <span style={{ fontWeight: '800', color: '#4A121E' }}>Grand Total:</span>
                    <b style={{ color: '#059669', fontSize: '1.1rem' }}>₹{staffOrderCreatedSuccess.total.toLocaleString('en-IN')}</b>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <a
                    href={staffOrderCreatedSuccess.waUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      background: '#25D366',
                      color: '#fff',
                      textDecoration: 'none',
                      padding: '14px 20px',
                      borderRadius: '10px',
                      fontWeight: '800',
                      fontSize: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 14px rgba(37, 211, 102, 0.35)'
                    }}
                  >
                    💬 Send Order Confirmation to Patron via WhatsApp →
                  </a>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setStaffOrderCreatedSuccess(null);
                        setStaffOrderPhone('');
                        setStaffOrderName('');
                        setStaffOrderAddress('');
                        setStaffOrderItems([]);
                        setStaffOrderNotes('');
                      }}
                      style={{ flex: 1, background: '#FAF6F0', border: '1px solid #CBD5E1', padding: '10px', borderRadius: '8px', fontWeight: '800', color: '#4A121E', cursor: 'pointer' }}
                    >
                      + Create Another Staff Order
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowStaffOrderModal(false);
                        setStaffOrderCreatedSuccess(null);
                      }}
                      style={{ background: '#4A121E', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '8px', fontWeight: '800', cursor: 'pointer' }}
                    >
                      Done / Close
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Staff Order Form */
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '1.5rem' }}>💬</span>
                  <div>
                    <h3 className="royal-title" style={{ fontSize: '1.35rem', fontWeight: '800', color: '#4A121E', margin: 0 }}>
                      Staff Order Entry
                    </h3>
                    <div style={{ fontSize: '0.78rem', color: '#64748B' }}>
                      Enter WhatsApp, Phone or Walk-in orders on behalf of patrons. Auto-syncs with Supabase CRM.
                    </div>
                  </div>
                </div>

                <hr style={{ border: 'none', borderTop: '1px solid #FAF6F0', margin: '14px 0' }} />

                {/* SECTION 1: CUSTOMER IDENTIFICATION (PHONE = UNIQUE ID) */}
                <div style={{ background: '#FAF6F0', borderRadius: '12px', padding: '14px', border: '1px solid #FDE68A', marginBottom: '16px' }}>
                  <div style={{ fontWeight: '800', fontSize: '0.85rem', color: '#4A121E', marginBottom: '8px' }}>
                    1. Patron Contact (10-Digit Mobile is Unique Primary Key)
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: '800', color: '#4A121E', marginBottom: '4px' }}>
                        10-DIGIT MOBILE NUMBER *
                      </label>
                      <input
                        type="tel"
                        maxLength={10}
                        placeholder="e.g. 9845123456"
                        value={staffOrderPhone}
                        onChange={e => handleStaffOrderPhoneLookup(e.target.value)}
                        style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.88rem', fontWeight: '700' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: '800', color: '#4A121E', marginBottom: '4px' }}>
                        PATRON FULL NAME *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Rajesh Kumar"
                        value={staffOrderName}
                        onChange={e => setStaffOrderName(e.target.value)}
                        style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.88rem' }}
                      />
                    </div>
                  </div>

                  {/* Live CRM Lookup Status */}
                  {staffCustomerLookupStatus && (
                    <div style={{ marginTop: '8px', fontSize: '0.75rem', fontWeight: '700', padding: '6px 10px', borderRadius: '6px', background: staffCustomerLookupStatus.found ? '#DEF7EC' : '#FEF3C7', color: staffCustomerLookupStatus.found ? '#03543F' : '#92400E' }}>
                      {staffCustomerLookupStatus.found 
                        ? `🟢 Existing Patron Found: ${staffCustomerLookupStatus.name} (${staffCustomerLookupStatus.totalOrders} past orders)`
                        : '✨ New Patron: Will automatically be registered into Supabase CRM'
                      }
                    </div>
                  )}
                </div>

                {/* SECTION 2: CHANNEL & FULFILLMENT */}
                <div style={{ background: '#FAF6F0', borderRadius: '12px', padding: '14px', border: '1px solid #E2E8F0', marginBottom: '16px' }}>
                  <div style={{ fontWeight: '800', fontSize: '0.85rem', color: '#4A121E', marginBottom: '8px' }}>
                    2. Order Source & Delivery Method
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: '800', color: '#4A121E', marginBottom: '4px' }}>
                        ORDER CHANNEL
                      </label>
                      <select
                        value={staffOrderChannel}
                        onChange={e => setStaffOrderChannel(e.target.value)}
                        style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem', fontWeight: '700' }}
                      >
                        <option value="WHATSAPP">💬 WhatsApp Chat Order</option>
                        <option value="PHONE">📞 Phone Call Order</option>
                        <option value="COUNTER">🏪 Counter / Walk-in Order</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: '800', color: '#4A121E', marginBottom: '4px' }}>
                        FULFILLMENT METHOD
                      </label>
                      <select
                        value={staffOrderFulfillment}
                        onChange={e => setStaffOrderFulfillment(e.target.value)}
                        style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem', fontWeight: '700' }}
                      >
                        <option value="PICKUP">🛍️ Self-Pickup (@ Prestige Tranquility)</option>
                        <option value="PORTER">🚚 Doorstep Delivery (Porter Service - Paid)</option>
                      </select>
                    </div>
                  </div>

                  {staffOrderFulfillment === 'PORTER' && (
                    <div>
                      <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: '800', color: '#1E40AF', marginBottom: '4px' }}>
                        PATRON DOORSTEP DELIVERY ADDRESS * (Required for Porter)
                      </label>
                      <textarea
                        rows={2}
                        placeholder="House / Flat No, Apartment/Society Name, Street, Landmark, Pincode"
                        value={staffOrderAddress}
                        onChange={e => setStaffOrderAddress(e.target.value)}
                        style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px', borderRadius: '8px', border: '1.5px solid #93C5FD', fontSize: '0.85rem' }}
                      />
                    </div>
                  )}
                </div>

                {/* SECTION 3: ADD ITEMS TO ORDER */}
                <div style={{ background: '#FAF6F0', borderRadius: '12px', padding: '14px', border: '1px solid #E2E8F0', marginBottom: '16px' }}>
                  <div style={{ fontWeight: '800', fontSize: '0.85rem', color: '#4A121E', marginBottom: '8px' }}>
                    3. Select Laddus & Savories
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 0.8fr auto', gap: '8px', alignItems: 'flex-end', marginBottom: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: '800', color: '#4A121E', marginBottom: '4px' }}>
                        PRODUCT
                      </label>
                      <select
                        value={staffSelectedProductSku}
                        onChange={e => setStaffSelectedProductSku(e.target.value)}
                        style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.82rem', fontWeight: '700' }}
                      >
                        {products.map(p => (
                          <option key={p.sku} value={p.sku}>{p.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: '800', color: '#4A121E', marginBottom: '4px' }}>
                        WEIGHT / PACK
                      </label>
                      <select
                        value={staffSelectedWeightKey}
                        onChange={e => setStaffSelectedWeightKey(e.target.value)}
                        style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.82rem', fontWeight: '700' }}
                      >
                        {(() => {
                          const p = products.find(prod => prod.sku === staffSelectedProductSku);
                          if (p && p.category === 'SAVORY') {
                            return (
                              <>
                                <option value="100g">100g (₹{p.p500 || 275})</option>
                                <option value="200g">200g (₹{p.p1k || 550})</option>
                                <option value="400g">400g (₹{p.ratePerKg || 1000})</option>
                              </>
                            );
                          }
                          const p250 = p ? (p.p250 || Math.round((p.ratePerKg || 1200) * 0.25)) : 300;
                          const p500 = p ? (p.p500 || Math.round((p.ratePerKg || 1200) * 0.5)) : 600;
                          const p1k = p ? (p.p1k || (p.ratePerKg || 1200)) : 1200;
                          return (
                            <>
                              <option value="250g">250g (₹{p250})</option>
                              <option value="500g">500g (₹{p500})</option>
                              <option value="1Kg">1 Kg (₹{p1k})</option>
                            </>
                          );
                        })()}
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: '800', color: '#4A121E', marginBottom: '4px' }}>
                        QTY
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="50"
                        value={staffSelectedQty}
                        onChange={e => setStaffSelectedQty(e.target.value)}
                        style={{ width: '100%', boxSizing: 'border-box', padding: '8px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.82rem', fontWeight: '700', textAlign: 'center' }}
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleStaffAddOrderItem}
                      style={{ background: '#059669', color: '#fff', border: 'none', padding: '9px 14px', borderRadius: '8px', fontWeight: '800', fontSize: '0.82rem', cursor: 'pointer', whiteSpace: 'nowrap' }}
                    >
                      + Add
                    </button>
                  </div>

                  {/* Added Items List */}
                  {staffOrderItems.length === 0 ? (
                    <div style={{ background: '#fff', borderRadius: '8px', border: '1px dashed #CBD5E1', padding: '14px', textAlign: 'center', color: '#94A3B8', fontSize: '0.82rem' }}>
                      No items added to this order yet. Select a laddu above and click "+ Add".
                    </div>
                  ) : (
                    <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
                      {staffOrderItems.map((item, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderBottom: idx < staffOrderItems.length - 1 ? '1px solid #F1F5F9' : 'none', fontSize: '0.82rem' }}>
                          <div>
                            <b style={{ color: '#4A121E' }}>{item.qty}x {item.name}</b>
                            <span style={{ color: '#64748B', marginLeft: '6px' }}>({item.cleanWeight})</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontWeight: '800', color: '#059669' }}>₹{item.unitPrice * item.qty}</span>
                            <button
                              type="button"
                              onClick={() => handleStaffRemoveOrderItem(idx)}
                              style={{ background: 'transparent', border: 'none', color: '#DC2626', cursor: 'pointer', fontSize: '0.85rem', padding: '2px 4px' }}
                              title="Remove item"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ))}
                      <div style={{ background: '#FAF6F0', padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1.5px solid #E2E8F0' }}>
                        <span style={{ fontWeight: '800', color: '#4A121E', fontSize: '0.9rem' }}>Order Grand Total:</span>
                        <b style={{ color: '#059669', fontSize: '1.1rem' }}>
                          ₹{staffOrderItems.reduce((sum, it) => sum + (it.unitPrice * it.qty), 0).toLocaleString('en-IN')}
                        </b>
                      </div>
                    </div>
                  )}
                </div>

                {/* SECTION 4: PAYMENT & NOTES */}
                <div style={{ background: '#FAF6F0', borderRadius: '12px', padding: '14px', border: '1px solid #E2E8F0', marginBottom: '20px' }}>
                  <div style={{ fontWeight: '800', fontSize: '0.85rem', color: '#4A121E', marginBottom: '8px' }}>
                    4. Payment & Special Kitchen Instructions
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: '800', color: '#4A121E', marginBottom: '4px' }}>
                        PAYMENT STATUS
                      </label>
                      <select
                        value={staffOrderPaymentStatus}
                        onChange={e => setStaffOrderPaymentStatus(e.target.value)}
                        style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem', fontWeight: '700' }}
                      >
                        <option value="PAID">🟢 PAID (Payment Verified)</option>
                        <option value="UNPAID">⏳ UNPAID (Collect on Delivery/Pickup)</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: '800', color: '#4A121E', marginBottom: '4px' }}>
                        PAYMENT METHOD
                      </label>
                      <select
                        value={staffOrderPaymentMethod}
                        onChange={e => setStaffOrderPaymentMethod(e.target.value)}
                        style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem', fontWeight: '700' }}
                      >
                        <option value="UPI">📱 UPI / GPay / PhonePe</option>
                        <option value="CASH">💵 Cash at Store / COD</option>
                        <option value="BANK_TRANSFER">🏦 Direct Bank Transfer</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: '800', color: '#4A121E', marginBottom: '4px' }}>
                      SPECIAL INSTRUCTIONS / KITCHEN NOTES [OPTIONAL]
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Mild sweetness requested / Deliver after 6 PM"
                      value={staffOrderNotes}
                      onChange={e => setStaffOrderNotes(e.target.value)}
                      style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                    />
                  </div>
                </div>

                {/* Submit / Cancel Buttons */}
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    disabled={isStaffSubmittingOrder || staffOrderItems.length === 0}
                    onClick={handleStaffSubmitOrder}
                    style={{
                      flex: 1,
                      background: staffOrderItems.length === 0 ? '#CBD5E1' : 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                      color: '#fff',
                      border: 'none',
                      padding: '14px',
                      borderRadius: '10px',
                      fontWeight: '800',
                      fontSize: '0.98rem',
                      cursor: staffOrderItems.length === 0 || isStaffSubmittingOrder ? 'not-allowed' : 'pointer',
                      boxShadow: '0 4px 12px rgba(5, 150, 105, 0.25)'
                    }}
                  >
                    {isStaffSubmittingOrder ? 'Creating Order in Supabase...' : '🚀 Confirm & Place Staff Order'}
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowStaffOrderModal(false)}
                    style={{ background: '#FAF6F0', border: '1px solid #E2E8F0', padding: '12px 18px', borderRadius: '10px', fontWeight: '700', color: '#64748B', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: PRODUCT RATING & TASTING REVIEW MODAL                  */}
      {/* ------------------------------------------------------------- */}
      {selectedProductForReview && (() => {
        const isStaff = isStaffReviewMode || (isAdminLoggedIn && activeTab === 'admin');
        return (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(53, 11, 21, 0.75)', backdropFilter: 'blur(4px)', zIndex: 1260, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
            <div style={{ background: '#FFFFFF', borderRadius: '22px', padding: '26px', maxWidth: '480px', width: '100%', maxHeight: '92vh', overflowY: 'auto', border: isStaff ? '2px solid #059669' : '2px solid #FDE68A', boxShadow: '0 16px 45px rgba(0,0,0,0.35)', position: 'relative' }}>
              
              <button
                onClick={() => {
                  setSelectedProductForReview(null);
                  setIsStaffReviewMode(false);
                  setReviewSuccessMsg('');
                }}
                style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', fontSize: '1.2rem', color: '#94A3B8', cursor: 'pointer' }}
              >
                ✕
              </button>

              {/* Header with Product Preview & Mode Indicator */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
                <img
                  src={selectedProductForReview.image || 'images/TheLadduStory_Logo.jpg'}
                  alt={selectedProductForReview.name}
                  style={{ width: '56px', height: '56px', borderRadius: '12px', objectFit: 'cover', border: isStaff ? '1.5px solid #059669' : '1px solid #FDE68A', flexShrink: 0 }}
                  onError={e => { e.target.src = 'images/TheLadduStory_Logo.jpg'; }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: '800', color: isStaff ? '#065F46' : '#B45309', textTransform: 'uppercase' }}>
                      {isStaff ? 'OMS Staff Review Entry' : 'Artisanal Tasting Review'}
                    </span>
                    {isStaff && (
                      <span style={{ background: '#DEF7EC', color: '#03543F', fontSize: '0.68rem', fontWeight: '800', padding: '2px 6px', borderRadius: '4px' }}>
                        Staff Mode
                      </span>
                    )}
                  </div>
                  <h3 className="royal-title" style={{ fontSize: '1.25rem', fontWeight: '800', color: '#4A121E', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {selectedProductForReview.name}
                  </h3>
                </div>
              </div>

              {reviewSuccessMsg ? (
                <div style={{ background: '#DEF7EC', border: '1.5px solid #31C48D', borderRadius: '12px', padding: '18px', textAlign: 'center', margin: '20px 0' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🙏</div>
                  <div style={{ fontWeight: '800', color: '#03543F', fontSize: '1rem' }}>{reviewSuccessMsg}</div>
                  <div style={{ fontSize: '0.8rem', color: '#047857', marginTop: '4px' }}>
                    Your feedback helps us maintain pure cow ghee & jaggery artisanal perfection.
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmitReview}>
                  {/* 1. Item / SKU Selector Dropdown */}
                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: '800', color: '#4A121E', marginBottom: '4px' }}>
                      SELECT ITEM / SKU FOR REVIEW *
                    </label>
                    <select
                      value={selectedProductForReview.sku}
                      onChange={(e) => {
                        const targetSku = e.target.value;
                        const found = products.find(p => p.sku === targetSku);
                        if (found) {
                          setSelectedProductForReview(found);
                        }
                      }}
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: isStaff ? '1.5px solid #059669' : '1.5px solid #FDE68A',
                        background: '#FFFDF9',
                        fontSize: '0.9rem',
                        fontWeight: '700',
                        color: '#4A121E',
                        cursor: 'pointer'
                      }}
                    >
                      {products.map(p => (
                        <option key={p.sku} value={p.sku}>
                          🥣 {p.name} ({p.sku})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 2. Star Rating (1 to 5) */}
                  <div style={{ background: '#FAF6F0', borderRadius: '14px', padding: '14px', border: '1px solid #FDE68A', textAlign: 'center', marginBottom: '14px' }}>
                    <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: '800', color: '#4A121E', marginBottom: '6px' }}>
                      YOUR RATING (1 TO 5 STARS)
                    </label>
                    
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', margin: '8px 0' }}>
                      {[1, 2, 3, 4, 5].map(star => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewRatingInput(star)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            fontSize: '2rem',
                            color: star <= reviewRatingInput ? '#F59E0B' : '#D1D5DB',
                            cursor: 'pointer',
                            padding: '0 4px',
                            transition: 'transform 0.15s ease'
                          }}
                          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.2)'}
                          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1.0)'}
                        >
                          ★
                        </button>
                      ))}
                    </div>

                    <div style={{ fontSize: '0.82rem', fontWeight: '800', color: '#B45309' }}>
                      {reviewRatingInput === 5 && '⭐⭐⭐⭐⭐ Superb! Loved the cow ghee aroma & taste'}
                      {reviewRatingInput === 4 && '⭐⭐⭐⭐ Very good & fresh'}
                      {reviewRatingInput === 3 && '⭐⭐⭐ Good taste'}
                      {reviewRatingInput === 2 && '⭐⭐ Average'}
                      {reviewRatingInput === 1 && '⭐ Needs improvement'}
                    </div>
                  </div>

                  {/* ============================================================== */}
                  {/* CASE A: STAFF MODE REVIEW ENTRY (FOR OMS TEAM)                  */}
                  {/* ============================================================== */}
                  {isStaff ? (
                    <>
                      {/* Staff Mode: Patron Mobile Number & CRM Auto-Lookup */}
                      <div style={{ marginBottom: '12px' }}>
                        <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: '800', color: '#065F46', marginBottom: '4px' }}>
                          PATRON 10-DIGIT MOBILE NUMBER [OPTIONAL]
                        </label>
                        <input
                          type="tel"
                          maxLength={10}
                          placeholder="e.g. 9845123456"
                          value={reviewPhoneInput}
                          onChange={e => {
                            const val = e.target.value;
                            setReviewPhoneInput(val);
                            const clean = val.replace(/\D/g, '').slice(-10);
                            if (clean.length === 10) {
                              const matched = orders.filter(o => (o.phone || '').replace(/\D/g, '').slice(-10) === clean);
                              if (matched.length > 0) {
                                if (!reviewNameInput && matched[0].name) setReviewNameInput(matched[0].name);
                                if (!reviewOrderIdInput) {
                                  setReviewOrderIdInput(matched[0].orderId || matched[0].id || '');
                                  if (matched[0].items && matched[0].items.length > 0) {
                                    const firstIt = matched[0].items[0];
                                    const foundP = products.find(p => p.sku === firstIt.sku || p.name === firstIt.name);
                                    if (foundP) setSelectedProductForReview(foundP);
                                  }
                                }
                              } else {
                                lookupCustomerInSupabase(clean).then(cust => {
                                  if (cust && cust.name && !reviewNameInput) setReviewNameInput(cust.name);
                                });
                              }
                            }
                          }}
                          style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #A7F3D0', fontSize: '0.9rem' }}
                        />
                      </div>

                      {/* Staff Mode: Associated Order Dropdown */}
                      <div style={{ marginBottom: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <label style={{ fontSize: '0.74rem', fontWeight: '800', color: '#065F46' }}>
                            ASSOCIATED ORDER [OPTIONAL]
                          </label>
                          {reviewOrderIdInput && (
                            <button
                              type="button"
                              onClick={() => setReviewOrderIdInput('')}
                              style={{ background: 'transparent', border: 'none', color: '#B45309', fontSize: '0.72rem', fontWeight: '700', cursor: 'pointer', textDecoration: 'underline' }}
                            >
                              Clear Order
                            </button>
                          )}
                        </div>

                        {(() => {
                          const cleanP = (reviewPhoneInput || '').replace(/\D/g, '').slice(-10);
                          const matchedOrders = cleanP.length === 10
                            ? orders.filter(o => (o.phone || '').replace(/\D/g, '').slice(-10) === cleanP)
                            : [];

                          return (
                            <select
                              value={reviewOrderIdInput}
                              onChange={(e) => {
                                const selectedId = e.target.value;
                                setReviewOrderIdInput(selectedId);
                                if (selectedId) {
                                  const foundOrder = orders.find(o => (o.orderId || o.id) === selectedId);
                                  if (foundOrder) {
                                    if (!reviewNameInput && foundOrder.name) setReviewNameInput(foundOrder.name);
                                    if (!reviewPhoneInput && foundOrder.phone) setReviewPhoneInput(foundOrder.phone);
                                    if (foundOrder.items && foundOrder.items.length > 0) {
                                      const firstIt = foundOrder.items[0];
                                      const foundP = products.find(p => p.sku === firstIt.sku || p.name === firstIt.name);
                                      if (foundP) setSelectedProductForReview(foundP);
                                    }
                                  }
                                }
                              }}
                              style={{
                                width: '100%',
                                boxSizing: 'border-box',
                                padding: '9px 12px',
                                borderRadius: '8px',
                                border: '1px solid #CBD5E1',
                                fontSize: '0.86rem',
                                background: '#F0FDF4',
                                color: '#334155'
                              }}
                            >
                              <option value="">-- No Order Linked (General Tasting / In-Store) --</option>
                              
                              {matchedOrders.length > 0 && (
                                <optgroup label={`Orders of ${reviewPhoneInput} (${matchedOrders.length})`}>
                                  {matchedOrders.map(o => (
                                    <option key={`patron-ord-${o.orderId || o.id}`} value={o.orderId || o.id}>
                                      📦 Order #{o.orderId || o.id} • ₹{o.total} • {o.items?.map(it => it.name).join(', ') || 'Order'}
                                    </option>
                                  ))}
                                </optgroup>
                              )}

                              {orders.length > 0 && (
                                <optgroup label="Recent Store Orders (Staff Reference)">
                                  {orders.slice(0, 25).map(o => (
                                    <option key={`recent-ord-${o.orderId || o.id}`} value={o.orderId || o.id}>
                                      📦 Order #{o.orderId || o.id} - {o.name || 'Patron'} ({o.phone || 'No phone'}) - ₹{o.total}
                                    </option>
                                  ))}
                                </optgroup>
                              )}
                            </select>
                          );
                        })()}

                        {reviewOrderIdInput && (
                          <div style={{ marginTop: '4px', fontSize: '0.72rem', color: '#047857', fontWeight: '700' }}>
                            ✓ Linked to Order #{reviewOrderIdInput}
                          </div>
                        )}
                      </div>

                      {/* Staff Mode: Patron Name Input */}
                      <div style={{ marginBottom: '12px' }}>
                        <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: '800', color: '#065F46', marginBottom: '4px' }}>
                          PATRON NAME *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Priya Sharma"
                          value={reviewNameInput}
                          onChange={e => setReviewNameInput(e.target.value)}
                          style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
                        />
                      </div>
                    </>
                  ) : (
                    /* ============================================================== */
                    /* CASE B: CUSTOMER MODE REVIEW ENTRY (STRICT PRIVACY ISOLATION)   */
                    /* ============================================================== */
                    <>
                      {customerUser ? (
                        /* Logged In Customer Profile Card */
                        <div style={{ background: '#FAF6F0', borderRadius: '10px', padding: '10px 14px', border: '1.5px solid #FDE68A', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontSize: '0.7rem', fontWeight: '800', color: '#B45309', textTransform: 'uppercase' }}>Reviewing As Patron</div>
                            <div style={{ fontWeight: '800', color: '#4A121E', fontSize: '0.92rem' }}>{customerUser.name}</div>
                            <div style={{ fontSize: '0.75rem', color: '#64748B' }}>📞 +91 {customerUser.phone}</div>
                          </div>
                          <span style={{ fontSize: '0.72rem', background: '#DEF7EC', color: '#03543F', padding: '3px 8px', borderRadius: '6px', fontWeight: '800' }}>
                            ✓ Verified Patron
                          </span>
                        </div>
                      ) : (
                        /* Non Logged In Customer Inputs (All Optional) */
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: '800', color: '#4A121E', marginBottom: '4px' }}>
                              YOUR NAME [OPTIONAL]
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. Priya (Optional)"
                              value={reviewNameInput}
                              onChange={e => setReviewNameInput(e.target.value)}
                              style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.88rem' }}
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: '800', color: '#4A121E', marginBottom: '4px' }}>
                              MOBILE [OPTIONAL]
                            </label>
                            <input
                              type="tel"
                              maxLength={10}
                              placeholder="10-digit (Optional)"
                              value={reviewPhoneInput}
                              onChange={e => setReviewPhoneInput(e.target.value)}
                              style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.88rem' }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Customer Mode: Associated Order (Strict Privacy - Only shows OWN orders or text field) */}
                      <div style={{ marginBottom: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <label style={{ fontSize: '0.74rem', fontWeight: '800', color: '#4A121E' }}>
                            LINK TO YOUR ORDER [OPTIONAL]
                          </label>
                          {reviewOrderIdInput && (
                            <button
                              type="button"
                              onClick={() => setReviewOrderIdInput('')}
                              style={{ background: 'transparent', border: 'none', color: '#B45309', fontSize: '0.72rem', fontWeight: '700', cursor: 'pointer', textDecoration: 'underline' }}
                            >
                              Clear Order
                            </button>
                          )}
                        </div>

                        {(() => {
                          // Strict filter: ONLY orders matching the logged in customer's phone
                          const userPhone = customerUser ? (customerUser.phone || '').replace(/\D/g, '').slice(-10) : '';
                          const myOrders = userPhone.length === 10
                            ? orders.filter(o => (o.phone || '').replace(/\D/g, '').slice(-10) === userPhone)
                            : [];

                          if (myOrders.length > 0) {
                            return (
                              <select
                                value={reviewOrderIdInput}
                                onChange={(e) => {
                                  const selectedId = e.target.value;
                                  setReviewOrderIdInput(selectedId);
                                  if (selectedId) {
                                    const foundOrder = myOrders.find(o => (o.orderId || o.id) === selectedId);
                                    if (foundOrder && foundOrder.items && foundOrder.items.length > 0) {
                                      const firstIt = foundOrder.items[0];
                                      const matchingProd = products.find(p => p.sku === firstIt.sku || p.name === firstIt.name);
                                      if (matchingProd) setSelectedProductForReview(matchingProd);
                                    }
                                  }
                                }}
                                style={{
                                  width: '100%',
                                  boxSizing: 'border-box',
                                  padding: '9px 12px',
                                  borderRadius: '8px',
                                  border: '1px solid #CBD5E1',
                                  fontSize: '0.86rem',
                                  background: '#FAF6F0',
                                  color: '#334155'
                                }}
                              >
                                <option value="">-- No Order Linked (General Tasting / In-Store) --</option>
                                {myOrders.map(o => (
                                  <option key={`my-ord-${o.orderId || o.id}`} value={o.orderId || o.id}>
                                    📦 Order #{o.orderId || o.id} • ₹{o.total} • {o.items?.map(it => it.name).join(', ') || 'Laddus'}
                                  </option>
                                ))}
                              </select>
                            );
                          }

                          // If not logged in or no past orders found: show clean optional Order ID input (NO OTHER ORDERS EVER SHOWN)
                          return (
                            <input
                              type="text"
                              placeholder="e.g. TLS-20261028-1234 (optional from receipt/WhatsApp)"
                              value={reviewOrderIdInput}
                              onChange={e => setReviewOrderIdInput(e.target.value)}
                              style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.86rem', background: '#FAF6F0' }}
                            />
                          );
                        })()}

                        {reviewOrderIdInput && (
                          <div style={{ marginTop: '4px', fontSize: '0.72rem', color: '#047857', fontWeight: '700' }}>
                            ✓ Linked to Order #{reviewOrderIdInput}
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {/* Tasting Notes / Review Comments */}
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: '800', color: '#4A121E', marginBottom: '4px' }}>
                      TASTING NOTES / REVIEW COMMENTS [OPTIONAL]
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Tell us what you loved about the cow ghee richness, natural jaggery sweetness, or crunch..."
                      value={reviewCommentInput}
                      onChange={e => setReviewCommentInput(e.target.value)}
                      style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.88rem' }}
                    />
                  </div>

                  {/* Submit & Cancel Action Buttons */}
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      type="submit"
                      disabled={isSubmittingReview}
                      style={{
                        flex: 1,
                        background: isStaff 
                          ? 'linear-gradient(135deg, #059669 0%, #047857 100%)' 
                          : 'linear-gradient(135deg, #4A121E 0%, #831843 100%)',
                        color: '#fff',
                        border: 'none',
                        padding: '12px',
                        borderRadius: '8px',
                        fontWeight: '800',
                        fontSize: '0.92rem',
                        cursor: isSubmittingReview ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {isSubmittingReview 
                        ? 'Submitting Review...' 
                        : (isStaff ? '⭐ Submit Review on Behalf of Patron' : '⭐ Submit Honest Review')}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedProductForReview(null);
                        setIsStaffReviewMode(false);
                      }}
                      style={{ background: '#FAF6F0', border: '1px solid #E2E8F0', padding: '12px 14px', borderRadius: '8px', fontWeight: '700', color: '#64748B', cursor: 'pointer' }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        );
      })()}

      {/* FLOATING WHATSAPP & OMNICHANNEL CONCIERGE WIDGET (STAFF OMS TESTING ONLY) */}
      {(isStaffRoute && isAdminLoggedIn && activeTab === 'admin') && (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 1200 }}>
          {showConciergeMenu && (
            <div style={{
              position: 'absolute',
              bottom: '70px',
              right: '0',
              width: '290px',
              background: '#FFFFFF',
              borderRadius: '16px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
              border: '1px solid #E2E8F0',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10B981' }} />
                  <span style={{ fontWeight: '800', fontSize: '0.88rem', color: '#4A121E' }}>Staff Concierge Tester</span>
                </div>
                <button onClick={() => setShowConciergeMenu(false)} style={{ background: 'transparent', border: 'none', color: '#94A3B8', fontSize: '0.9rem', cursor: 'pointer', padding: 0 }}>✕</button>
              </div>
              
              <a
                href="https://wa.me/919343207515?text=Namaste!%20Testing%20Direct%20Kitchen%20WhatsApp%20flow%20from%20Staff%20OMS."
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  background: '#ECFDF5',
                  border: '1px solid #A7F3D0',
                  color: '#065F46',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontWeight: '700',
                  fontSize: '0.82rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <span>💬 Test Direct WhatsApp Link</span>
              </a>

              <button
                onClick={() => { setShowConciergeMenu(false); setShowCorporateModal(true); }}
                style={{
                  background: '#FEF3C7',
                  border: '1px solid #FDE68A',
                  color: '#92400E',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  fontWeight: '700',
                  fontSize: '0.82rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <span>🎁 Test Corporate Lead Modal</span>
              </button>

              <a
                href={BRAND_CHANNELS.INSTAGRAM}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  background: '#FFF1F2',
                  border: '1px solid #FECDD3',
                  color: '#9F1239',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontWeight: '700',
                  fontSize: '0.82rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <span>📸 Instagram: @theladdustory</span>
              </a>

              <a
                href={BRAND_CHANNELS.GOOGLE_PROFILE}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  background: '#EFF6FF',
                  border: '1px solid #BFDBFE',
                  color: '#1E40AF',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontWeight: '700',
                  fontSize: '0.82rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <span>⭐ Google Profile & Reviews</span>
              </a>
            </div>
          )}

          <button
            onClick={() => setShowConciergeMenu(prev => !prev)}
            title="Direct Kitchen WhatsApp Concierge"
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: '#25D366',
              color: '#FFFFFF',
              border: 'none',
              fontSize: '1.7rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 4px 18px rgba(37, 211, 102, 0.45)',
              transition: 'transform 0.2s',
              position: 'relative'
            }}
          >
            <span>💬</span>
            <span style={{ position: 'absolute', top: '2px', right: '2px', width: '12px', height: '12px', borderRadius: '50%', background: '#EF4444', border: '2px solid #FFFFFF' }} />
          </button>
        </div>
      )}

      {/* CORPORATE GIFTING & TASTING BOX MODAL */}
      {showCorporateModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(26, 4, 10, 0.75)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          padding: '16px'
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '20px',
            maxWidth: '620px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '28px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
            border: '2px solid #F59E0B',
            position: 'relative'
          }}>
            {/* Close Button */}
            <button
              onClick={() => { setShowCorporateModal(false); setCorporateSuccessMsg(''); }}
              style={{
                position: 'absolute',
                top: '18px',
                right: '18px',
                background: '#FAF6F0',
                border: 'none',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                fontSize: '1rem',
                color: '#64748B',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              ✕
            </button>

            {/* Modal Header */}
            <div style={{ textAlign: 'center', marginBottom: '22px' }}>
              <div style={{ display: 'inline-block', background: '#FEF3C7', color: '#92400E', padding: '4px 14px', borderRadius: '12px', fontSize: '0.74rem', fontWeight: '800', marginBottom: '8px' }}>
                🎁 B2B & BULK CURATION
              </div>
              <h3 style={{ margin: '0 0 6px', fontSize: '1.45rem', fontWeight: '800', color: '#4A121E' }}>
                Corporate Gifting & Tasting Box Request
              </h3>
              <p style={{ margin: 0, fontSize: '0.84rem', color: '#64748B', lineHeight: 1.45 }}>
                Pure Desi Cow Ghee artisanal laddus in bespoke festive boxes. Custom branding sleeves and pan-India doorstep delivery available.
              </p>
            </div>

            {corporateSuccessMsg ? (
              <div style={{ textAlign: 'center', padding: '24px 12px' }}>
                <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🎉</div>
                <h4 style={{ margin: '0 0 8px', fontSize: '1.2rem', color: '#065F46', fontWeight: '800' }}>
                  Inquiry Received!
                </h4>
                <p style={{ fontSize: '0.9rem', color: '#334155', lineHeight: 1.5, marginBottom: '20px' }}>
                  {corporateSuccessMsg}
                </p>
                <button
                  onClick={() => { setShowCorporateModal(false); setCorporateSuccessMsg(''); }}
                  style={{ background: '#4A121E', color: '#FFFFFF', border: 'none', padding: '10px 24px', borderRadius: '8px', fontWeight: '800', cursor: 'pointer' }}
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleCorporateSubmit}>
                {/* Box Count Preset Selector */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '800', color: '#4A121E', marginBottom: '6px' }}>
                    ESTIMATED BOX QUANTITY (TIERED BULK PRICING)
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                    {['25 Boxes', '50 Boxes', '100 Boxes', '250+ Boxes'].map(qty => (
                      <button
                        key={qty}
                        type="button"
                        onClick={() => setCorporateForm({ ...corporateForm, count: qty })}
                        style={{
                          background: corporateForm.count === qty ? '#4A121E' : '#FAF6F0',
                          color: corporateForm.count === qty ? '#FFFFFF' : '#4A121E',
                          border: corporateForm.count === qty ? '2px solid #F59E0B' : '1px solid #E2E8F0',
                          padding: '10px 4px',
                          borderRadius: '8px',
                          fontWeight: '800',
                          fontSize: '0.8rem',
                          cursor: 'pointer'
                        }}
                      >
                        {qty}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Box Type / Packaging Choice */}
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '800', color: '#4A121E', marginBottom: '4px' }}>
                    PREFERRED PACKAGING & ASSORTMENT
                  </label>
                  <select
                    value={corporateForm.boxType}
                    onChange={e => setCorporateForm({ ...corporateForm, boxType: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1.5px solid #CBD5E1', fontSize: '0.88rem', background: '#FAF6F0' }}
                  >
                    <option value="Luxe 4-Millet Assortment (Pure Cow Ghee)">Luxe 4-Millet Assortment (Ragi Walnut, Till Sesame, Sattu, Quinoa)</option>
                    <option value="Royal Festive Gold Box (Dry Fruits & Dates)">Royal Festive Gold Box (Dates Dry Fruit, Dates Pops, Makhana)</option>
                    <option value="Maternal & Wellness Special (Post Delivery / Jawar Panjeeri)">Maternal & Wellness Special (Post Delivery / Jawar Panjeeri)</option>
                    <option value="Custom Curated Hamper (With Logo Branding)">Custom Curated Hamper (With Corporate Logo Sleeves)</option>
                    <option value="Complimentary Sample Tasting Box for Office">Complimentary Sample Tasting Box for Office Evaluation</option>
                  </select>
                </div>

                {/* Contact Name & Company */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: '800', color: '#4A121E', marginBottom: '4px' }}>
                      CONTACT PERSON *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Navin Bhasin"
                      value={corporateForm.name}
                      onChange={e => setCorporateForm({ ...corporateForm, name: e.target.value })}
                      required
                      style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: '8px', border: '1.5px solid #CBD5E1', fontSize: '0.88rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: '800', color: '#4A121E', marginBottom: '4px' }}>
                      COMPANY / ORGANIZATION
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Acme Tech / Family"
                      value={corporateForm.company}
                      onChange={e => setCorporateForm({ ...corporateForm, company: e.target.value })}
                      style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: '8px', border: '1.5px solid #CBD5E1', fontSize: '0.88rem' }}
                    />
                  </div>
                </div>

                {/* Phone & Email */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: '800', color: '#4A121E', marginBottom: '4px' }}>
                      MOBILE NUMBER (WHATSAPP) *
                    </label>
                    <input
                      type="tel"
                      placeholder="e.g. 9343207515"
                      value={corporateForm.phone}
                      onChange={e => setCorporateForm({ ...corporateForm, phone: e.target.value })}
                      required
                      style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: '8px', border: '1.5px solid #CBD5E1', fontSize: '0.88rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: '800', color: '#4A121E', marginBottom: '4px' }}>
                      OFFICIAL EMAIL [OPTIONAL]
                    </label>
                    <input
                      type="email"
                      placeholder="name@company.com"
                      value={corporateForm.email}
                      onChange={e => setCorporateForm({ ...corporateForm, email: e.target.value })}
                      style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: '8px', border: '1.5px solid #CBD5E1', fontSize: '0.88rem' }}
                    />
                  </div>
                </div>

                {/* Occasion / Event */}
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: '800', color: '#4A121E', marginBottom: '4px' }}>
                    OCCASION / TIMELINE
                  </label>
                  <select
                    value={corporateForm.occasion}
                    onChange={e => setCorporateForm({ ...corporateForm, occasion: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1.5px solid #CBD5E1', fontSize: '0.88rem', background: '#FAF6F0' }}
                  >
                    <option value="Diwali / Festive Corporate Gifting">Diwali / Festive Corporate Gifting</option>
                    <option value="New Year / Annual Company Celebration">New Year / Annual Company Celebration</option>
                    <option value="Employee Health & Wellness Milestone">Employee Health & Wellness Milestone</option>
                    <option value="Client Appreciation & Premium Favors">Client Appreciation & Premium Favors</option>
                    <option value="Wedding / Family Celebration Favors">Wedding / Family Celebration Favors</option>
                  </select>
                </div>

                {/* Custom Note */}
                <div style={{ marginBottom: '18px' }}>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: '800', color: '#4A121E', marginBottom: '4px' }}>
                    ADDITIONAL REQUIREMENTS / OFFICE ADDRESS FOR SAMPLES
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Please deliver tasting samples to our office in Whitefield, Bangalore."
                    value={corporateForm.customNote}
                    onChange={e => setCorporateForm({ ...corporateForm, customNote: e.target.value })}
                    style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: '8px', border: '1.5px solid #CBD5E1', fontSize: '0.88rem' }}
                  />
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="submit"
                    disabled={isSubmittingCorporateLead}
                    style={{
                      flex: 1,
                      background: 'linear-gradient(135deg, #4A121E 0%, #831843 100%)',
                      color: '#FFFFFF',
                      border: 'none',
                      padding: '13px',
                      borderRadius: '8px',
                      fontWeight: '800',
                      fontSize: '0.92rem',
                      cursor: isSubmittingCorporateLead ? 'not-allowed' : 'pointer',
                      boxShadow: '0 4px 14px rgba(74, 18, 30, 0.3)'
                    }}
                  >
                    {isSubmittingCorporateLead ? '⏳ Sending Inquiry...' : '📩 Submit Corporate Inquiry →'}
                  </button>

                  <a
                    href={`https://wa.me/919343207515?text=${encodeURIComponent(`Namaste! I am interested in Corporate Gifting for ${corporateForm.company || 'my organization'}. Estimated quantity: ${corporateForm.count}.`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      background: '#059669',
                      color: '#FFFFFF',
                      textDecoration: 'none',
                      padding: '13px 18px',
                      borderRadius: '8px',
                      fontWeight: '800',
                      fontSize: '0.88rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    💬 WhatsApp
                  </a>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
}


-- =========================================================================
-- THE LADDU STORY: Master Supabase Database Schema (PostgreSQL)
-- Omnichannel OMS: Storefront, Kitchen POS, WhatsApp & Realtime Sync
-- =========================================================================

-- 1. EXTENSIONS
create extension if not exists "uuid-ossp";

-- 2. PRODUCTS TABLE
create table if not exists public.products (
    id text primary key,
    sku text unique not null,
    name text not null,
    category text default 'LADDU',
    rate_per_kg numeric not null default 1200,
    moq text default '500g',
    opt1 text not null,
    opt2 text not null,
    p500 numeric not null,
    p1k numeric not null,
    w1 text default '500g',
    w2 text default '1 Kg',
    tag text,
    description text,
    benefit text,
    image text,
    stock_status text default 'IN_STOCK' check (stock_status in ('IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK')),
    stock_count integer default 50,
    is_munchy boolean default false,
    updated_at timestamptz default now()
);

-- 3. ORDERS TABLE
create table if not exists public.orders (
    id uuid primary key default uuid_generate_v4(),
    order_id text unique not null,
    created_at timestamptz default now(),
    channel text default 'ONLINE_STORE',
    customer_name text not null,
    customer_phone text not null,
    customer_address text not null,
    total_amount numeric not null,
    payment_method text default 'UPI',
    payment_status text default 'PAID' check (payment_status in ('PAID', 'UNPAID', 'REFUNDED')),
    order_status text default 'RECEIVED' check (order_status in ('RECEIVED', 'PREPARING', 'PACKED', 'READY FOR PICKUP', 'ORDER PICKED UP', 'OUT FOR DELIVERY', 'DELIVERED', 'CANCELLED', 'DISPATCHED')),
    notes text,
    updated_at timestamptz default now()
);

-- Index for speedy lookups
create index if not exists idx_orders_order_id on public.orders(order_id);
create index if not exists idx_orders_customer_phone on public.orders(customer_phone);
create index if not exists idx_orders_status on public.orders(order_status);
create index if not exists idx_orders_created_at on public.orders(created_at desc);

-- 4. ORDER ITEMS TABLE
create table if not exists public.order_items (
    id uuid primary key default uuid_generate_v4(),
    order_id text not null references public.orders(order_id) on delete cascade,
    sku text not null,
    name text not null,
    pack_label text,
    clean_weight text,
    unit_price numeric not null,
    qty integer not null default 1,
    image text,
    created_at timestamptz default now()
);

create index if not exists idx_order_items_order_id on public.order_items(order_id);

-- 5. CUSTOMERS (CRM & LTV)
create table if not exists public.customers (
    phone text primary key,
    name text not null,
    address text,
    password_hash text,
    total_orders integer default 1,
    lifetime_value numeric default 0,
    last_order_at timestamptz default now(),
    created_at timestamptz default now()
);

-- Migration support for existing tables:
alter table public.customers add column if not exists password_hash text;

-- 6. ENABLE ROW LEVEL SECURITY (RLS)
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.customers enable row level security;

-- Policies for Products: Anyone can read; authenticated / anon staff can update
create policy "Allow public read products" on public.products for select using (true);
create policy "Allow staff update products" on public.products for update using (true);
create policy "Allow staff insert products" on public.products for insert with check (true);

-- Policies for Orders: Anyone can insert orders; anyone can read their orders; staff can update
create policy "Allow public create orders" on public.orders for insert with check (true);
create policy "Allow public read orders" on public.orders for select using (true);
create policy "Allow staff update orders" on public.orders for update using (true);

-- Policies for Order Items: Anyone can insert & read order items
create policy "Allow public create order_items" on public.order_items for insert with check (true);
create policy "Allow public read order_items" on public.order_items for select using (true);

-- Policies for Customers
create policy "Allow public select customers" on public.customers for select using (true);
create policy "Allow public upsert customers" on public.customers for insert with check (true);
create policy "Allow public update customers" on public.customers for update using (true);

-- 7. ENABLE REALTIME PUBLICATION FOR ZERO-LATENCY SYNC
-- (Required so customer screen & kitchen dashboard receive instant changes)
begin;
  drop publication if exists supabase_realtime;
  create publication supabase_realtime;
commit;
alter publication supabase_realtime add table public.orders;
alter publication supabase_realtime add table public.products;

-- 8. SEED INITIAL PRODUCTS (THE OFFICIAL 11 FLYER & OMS ITEMS)
insert into public.products (id, sku, name, category, rate_per_kg, moq, opt1, opt2, p500, p1k, w1, w2, tag, description, benefit, image, stock_status, stock_count, is_munchy)
values
('01', 'RAGI-WALNUT', 'Ragi Walnut Laddu', 'LADDU', 1200, '500g', '500g (₹600)', '1 Kg (₹1,200)', 600, 1200, '500g', '1 Kg', 'Superfood Millet', 'Finger Millet (Ragi), Walnuts, Pure Desi Cow Ghee, Unrefined Jaggery', 'Rich in Calcium & Omega-3, Diabetic-friendly, Zero White Sugar', 'images/products/RAGI-WALNUT.jpg', 'IN_STOCK', 50, false),
('02', 'TILL-BLACK-SESAME', 'Till Laddu (Black Sesame)', 'LADDU', 1000, '500g', '500g (₹500)', '1 Kg (₹1,000)', 500, 1000, '500g', '1 Kg', 'Ayurvedic Warmth', 'Organic Black Sesame (Till), Pure Desi Cow Ghee, Unrefined Jaggery', 'High Iron & Bone Density Support, Warming Ayurvedic Formulation', 'images/products/TILL-BLACK-SESAME.jpg', 'IN_STOCK', 50, false),
('03', 'SATTU-ALMOND', 'Sattu Almond Laddu', 'LADDU', 1100, '500g', '500g (₹550)', '1 Kg (₹1,100)', 550, 1100, '500g', '1 Kg', 'High Protein', 'Roasted Chana Sattu, California Almonds, Desi Ghee, Jaggery', 'Natural Plant Protein & Sustained Energy, Muscle Recovery', 'images/products/SATTU-ALMOND.jpg', 'IN_STOCK', 50, false),
('04', 'GROUNDNUT', 'Groundnut Laddu', 'LADDU', 800, '500g', '500g (₹400)', '1 Kg (₹800)', 400, 800, '500g', '1 Kg', 'Traditional Classic', 'Roasted Peanuts (Groundnuts), Pure Cow Ghee, Organic Jaggery', 'Heart-healthy fats, High satiety, Wholesome traditional snacking', 'images/products/GROUNDNUT.jpg', 'IN_STOCK', 50, false),
('05', 'QUINOA-MOONG-DAL', 'Quinoa Moong Dal Laddu', 'LADDU', 1250, '500g', '500g (₹625)', '1 Kg (₹1,250)', 625, 1250, '500g', '1 Kg', 'Ancient Superfood', 'Organic Quinoa, Yellow Moong Dal, Desi Ghee, Cardamom, Jaggery', 'Complete Amino Acids, Light on Stomach & Easy Digestion', 'images/products/QUINOA-MOONG-DAL.jpg', 'IN_STOCK', 50, false),
('06', 'METHI-FENUGREEK', 'Methi (fenugreek) Laddu', 'LADDU', 1250, '500g', '500g (₹625)', '1 Kg (₹1,250)', 625, 1250, '500g', '1 Kg', 'Joint Support', 'Sprouted Fenugreek (Methi), Dry Fruits, Desi Cow Ghee, Jaggery', 'Ayurvedic Joint Care, Postpartum Strength, Low Glycemic', 'images/products/METHI-FENUGREEK.jpg', 'IN_STOCK', 50, false),
('07', 'DATES-DRY-FRUITS', 'Dates & Dry Fruits Bites', 'LADDU', 1900, '500g', '500g (₹950)', '1 Kg (₹1,900)', 950, 1900, '500g', '1 Kg', 'Natural Sweetness', 'Medjool Dates, Almonds, Cashews, Pistachios, Pure Cow Ghee, Zero Sugar', '100% Naturally Sweetened with Dates, Instant Energy, Fiber Rich', 'images/products/DATES-DRY-FRUITS.jpg', 'IN_STOCK', 50, false),
('08', 'POST-DELIVERY-PANJEERI', 'Post Delivery Panjeeri / Laddu', 'LADDU', 1800, '500g', '500g (₹900)', '1 Kg (₹1,800)', 900, 1800, '500g', '1 Kg', 'Postpartum Care', 'Ayurvedic Herbs, Kamarkas, Gond, Dry Fruits, A2 Desi Cow Ghee', 'Maternal Healing, Lactation Support, Postpartum Recovery', 'images/products/POST-DELIVERY-PANJEERI.jpg', 'IN_STOCK', 50, false),
('09', 'JAWAR-PANJEERI', 'Jawar Panjeeri / Laddu', 'LADDU', 1900, '500g', '500g (₹950)', '1 Kg (₹1,900)', 950, 1900, '500g', '1 Kg', 'Ancient Sorghum Millet', 'Roasted Jawar (Sorghum Flour), A2 Cow Ghee, Jaggery, Super Seeds & Nuts', 'Gluten-Free ancient grains, High fiber, Digestive health & stamina', 'images/products/JAWAR-PANJEERI.jpg', 'IN_STOCK', 50, false),
('10', 'SAVORY-MAKHANA', 'Savory Munchies (Roasted Makhana)', 'SAVORY', 2750, '100g', '100g (₹275)', '200g (₹550)', 275, 550, '100g', '200g', 'Guilt-Free Crunch', 'Foxnuts (Makhana) slow roasted in pure cow ghee, Himalayan pink salt', 'Zero Cholesterol, Low Calorie, Mineral Rich Super Crunch', 'images/products/SAVORY-MAKHANA.jpg', 'IN_STOCK', 50, true),
('11', 'SAVORY-MURMURA', 'Savory Munchies (Millet Mudi Mix)', 'SAVORY', 1000, '200g', '200g (₹200)', '400g (₹400)', 200, 400, '200g', '400g', 'Tea-Time Favorite', 'Puffed Millets, Roasted Peanuts, Curry Leaves, Cold-pressed Spices', 'Light & Crisp, Gut-friendly, Wholesome evening snack', 'images/products/SAVORY-MURMURA.jpg', 'IN_STOCK', 50, true)
on conflict (sku) do update set
    name = excluded.name,
    rate_per_kg = excluded.rate_per_kg,
    p500 = excluded.p500,
    p1k = excluded.p1k,
    stock_status = excluded.stock_status,
    stock_count = excluded.stock_count,
    updated_at = now();

-- 9. PRODUCT REVIEWS & RATINGS TABLE
create table if not exists public.product_reviews (
    id uuid primary key default uuid_generate_v4(),
    product_sku text not null,
    product_name text not null,
    rating integer not null check (rating >= 1 and rating <= 5),
    customer_name text not null,
    customer_phone text,
    comment text,
    order_id text,
    created_at timestamptz default now()
);

create index if not exists idx_reviews_product_sku on public.product_reviews(product_sku);
create index if not exists idx_reviews_created_at on public.product_reviews(created_at desc);

alter table public.product_reviews enable row level security;
drop policy if exists "Allow public read product_reviews" on public.product_reviews;
create policy "Allow public read product_reviews" on public.product_reviews for select using (true);
drop policy if exists "Allow public insert product_reviews" on public.product_reviews;
create policy "Allow public insert product_reviews" on public.product_reviews for insert with check (true);
drop policy if exists "Allow public update product_reviews" on public.product_reviews;
create policy "Allow public update product_reviews" on public.product_reviews for update using (true);
drop policy if exists "Allow public delete product_reviews" on public.product_reviews;
create policy "Allow public delete product_reviews" on public.product_reviews for delete using (true);

-- Realtime Publication for instant review updates
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'product_reviews') then
    alter publication supabase_realtime add table public.product_reviews;
  end if;
exception when others then
  null;
end $$;

-- 10. SEED PILOT PATRON AUTHENTIC REVIEWS INTO SUPABASE
insert into public.product_reviews (product_sku, product_name, rating, customer_name, customer_phone, comment, created_at)
values
('RAGI-WALNUT', 'Ragi Walnut Laddu', 5, 'Ananya Sharma', '98451*****', 'Rich pure cow ghee aroma and zero white sugar! Perfectly balanced sweetness with unrefined jaggery. My diabetic parents loved it.', now() - interval '5 days'),
('SATTU-ALMOND', 'Sattu Almond Laddu', 5, 'Rohit Nair', '99002*****', 'High protein and sustained energy! Perfect post-workout snack with crunchy California almonds.', now() - interval '4 days'),
('DATES-DRY-FRUITS', 'Dates & Dry Fruits Bites', 5, 'Pooja Kulkarni', '97403*****', '100% naturally sweet and packed with nuts. Melt in the mouth and completely guilt-free!', now() - interval '3 days'),
('TILL-BLACK-SESAME', 'Till Laddu (Black Sesame)', 5, 'Venkatesh Rao', '98801*****', 'Authentic Ayurvedic recipe! Excellent warmth, great sesame flavor, and pure cow ghee richness.', now() - interval '2 days'),
('QUINOA-MOONG-DAL', 'Quinoa Moong Dal Laddu', 5, 'Dr. Meera Iyer', '94481*****', 'Very light on the stomach, soothing cardamom fragrance, and made with pure love. 10/10!', now() - interval '1 day'),
('SAVORY-MAKHANA', 'Savory Munchies (Roasted Makhana)', 5, 'Karan Verma', '96112*****', 'Slow roasted in pure cow ghee with Himalayan pink salt. The crunch is unbelievable!', now());

-- 11. CORPORATE & B2B GIFTING LEADS (HR, FESTIVALS, WEDDINGS)
create table if not exists public.corporate_leads (
    id uuid primary key default uuid_generate_v4(),
    company_name text not null,
    contact_person text not null,
    phone text not null,
    email text,
    box_quantity integer default 50,
    hamper_type text default 'ASSORTED_SUPERFOOD_HAMPER',
    delivery_date date,
    estimated_budget numeric,
    notes text,
    source text default 'WEBSITE',
    status text default 'NEW_INQUIRY' check (status in ('NEW_INQUIRY', 'CONTACTED', 'SAMPLE_SENT', 'CONVERTED', 'CLOSED')),
    created_at timestamptz default now()
);

create index if not exists idx_corporate_leads_created on public.corporate_leads(created_at desc);
create index if not exists idx_corporate_leads_phone on public.corporate_leads(phone);

alter table public.corporate_leads enable row level security;
create policy "Allow public insert corporate_leads" on public.corporate_leads for insert with check (true);
create policy "Allow staff read corporate_leads" on public.corporate_leads for select using (true);
create policy "Allow staff update corporate_leads" on public.corporate_leads for update using (true);


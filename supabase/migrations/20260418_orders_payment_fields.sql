alter table orders
  add column if not exists payment_intent_id text,
  add column if not exists payment_status text check (payment_status in ('pending', 'paid', 'failed'));

create index if not exists idx_orders_payment_intent on orders(payment_intent_id);

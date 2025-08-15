-- Seed file removed per user request.
         make_date(extract(year from m.m_cur)::int, extract(month from m.m_cur)::int, o.due_day) as due_date,
         o.rent_price as amount_due,
         case when random()<0.70 then o.rent_price
              when random()<0.90 then o.rent_price * 0.5 else 0 end as amount_paid,
         case when random()<0.70 then current_date else null end as payment_date,
         case when random()<0.70 then 'cash' else null end as method
  from occ o cross join months m
  where (o.id, m.m_cur) not in (select room_id, billing_month from existing)
  union all
  select o.id, m.m_prev,
         make_date(extract(year from m.m_prev)::int, extract(month from m.m_prev)::int, o.due_day),
         o.rent_price,
         case when random()<0.85 then o.rent_price else o.rent_price * 0.5 end,
         case when random()<0.85 then (m.m_prev + (random()*27)::int) else null end,
         'cash'
  from occ o cross join months m
  where (o.id, m.m_prev) not in (select room_id, billing_month from existing)
)
insert into payment (room_id, billing_month, due_date, amount_due, amount_paid, payment_date, method)
select room_id, billing_month, due_date, amount_due, amount_paid, payment_date, method from to_make;

-- 3. Penalties examples
insert into penalty (room_id, type, custom_description, amount, incident_date, paid, paid_date, notes)
select r.id, 'late_payment', null, 50000, current_date - interval '2 day', false, null, 'Late 2 days'
from room r where r.number='01'
on conflict do nothing;

insert into penalty (room_id, type, custom_description, amount, incident_date, paid, paid_date, notes)
select r.id, 'custom', 'Broken chair', 75000, current_date - interval '10 day', true, current_date - interval '5 day', 'Reimbursed'
from room r where r.number='05'
on conflict do nothing;

-- 4. Expenses
with months as (
  select date_trunc('month', current_date)::date as m_cur,
         date_trunc('month', current_date - interval '1 month')::date as m_prev
)
insert into expense (date, category, amount, notes)
values
  ((select m_cur + 3 from months), 'electricity', 150000, 'PLN'),
  ((select m_cur + 5 from months), 'water', 80000, 'PDAM'),
  ((select m_prev + 7 from months), 'maintenance', 120000, 'Light fixtures'),
  ((select m_prev + 12 from months), 'internet', 400000, 'ISP')
on conflict do nothing;

commit;

-- Verification:
-- select count(*) from room;
-- select billing_month, count(*) from payment group by 1 order by 1;
-- select * from penalty order by incident_date desc limit 5;
-- select * from expense order by date desc limit 5;

-- Afya Corner: order status workflow, enforced in the database.
--   new → confirmed → completed
--   new or confirmed → cancelled
-- Completed and cancelled orders are final. The admin only offers valid moves, but this trigger is
-- what guarantees them (like a PL/SQL BEFORE UPDATE trigger raising an application error).

create function public.check_order_status() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = old.status then
    return new;
  end if;
  if (old.status = 'new' and new.status in ('confirmed', 'cancelled'))
     or (old.status = 'confirmed' and new.status in ('completed', 'cancelled')) then
    return new;
  end if;
  raise exception using errcode = 'P0001', message = 'invalid_status_change',
    detail = format('An order that is %s cannot become %s.', old.status, new.status);
end;
$$;

create trigger orders_status_workflow before update of status on public.orders
  for each row execute function public.check_order_status();

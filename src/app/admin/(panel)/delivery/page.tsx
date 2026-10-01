import type { Metadata } from "next";
import { AdminForm, FieldError, SaveButton } from "@/components/admin/admin-form";
import { AdminHeading, INPUT, LABEL } from "@/components/admin/ui";
import { requireOwner } from "@/lib/admin/auth";
import { deleteArea, saveArea } from "../content-actions";

export const metadata: Metadata = { title: "Delivery areas" };

type Area = { id: number; name: string; fee_kes: number; is_pickup: boolean; active: boolean; sort_order: number };

export default async function DeliveryAreasPage() {
  const { supabase } = await requireOwner();
  const { data } = await supabase.from("delivery_areas").select("id, name, fee_kes, is_pickup, active, sort_order").order("sort_order");

  return (
    <>
      <AdminHeading title="Delivery areas" />
      <p className="mb-5 max-w-2xl text-muted">
        Fees are whole shillings. The shop lists pick-up first, then areas from cheapest to dearest. Untick
        &ldquo;Offered&rdquo; to pause an area without deleting it.
      </p>
      <ul className="max-w-4xl space-y-3">
        {(data ?? []).map((area) => (
          <li key={area.id} className={`rounded-2xl border border-line p-4 ${area.active ? "bg-surface" : "bg-paper"}`}>
            <AreaForm area={area} />
            <div className="mt-3 border-t border-line pt-3">
              <AdminForm action={deleteArea.bind(null, area.id)} confirm={`Delete the delivery area ${area.name}?`}>
                <SaveButton variant="danger" size="sm" pendingLabel="Deleting…">
                  Delete
                </SaveButton>
              </AdminForm>
            </div>
          </li>
        ))}
      </ul>
      <section aria-labelledby="add-area" className="mt-8 max-w-4xl rounded-2xl border border-dashed border-line p-4">
        <h2 id="add-area" className="mb-3 font-extrabold">
          Add an area
        </h2>
        <AreaForm />
      </section>
    </>
  );
}

function AreaForm({ area }: { area?: Area }) {
  const prefix = area ? `a${area.id}` : "new";
  return (
    <AdminForm
      action={saveArea.bind(null, area?.id ?? null)}
      className="grid items-end gap-3 sm:grid-cols-[1fr_8rem_6rem] lg:grid-cols-[1fr_8rem_6rem_auto_auto_auto]"
      aria-label={area ? `Edit ${area.name}` : "Add an area"}
    >
      <div>
        <label htmlFor={`${prefix}-name`} className={LABEL}>Name</label>
        <input id={`${prefix}-name`} name="name" defaultValue={area?.name} className={INPUT} />
        <FieldError name="name" id={`${prefix}-name-error`} />
      </div>
      <div>
        <label htmlFor={`${prefix}-fee`} className={LABEL}>Fee (KES)</label>
        <input id={`${prefix}-fee`} name="fee_kes" inputMode="numeric" defaultValue={area?.fee_kes ?? 0} className={`${INPUT} tabular-nums`} />
        <FieldError name="fee_kes" id={`${prefix}-fee-error`} />
      </div>
      <div>
        <label htmlFor={`${prefix}-sort`} className={LABEL}>Order</label>
        <input id={`${prefix}-sort`} name="sort_order" inputMode="numeric" defaultValue={area?.sort_order ?? 99} className={INPUT} />
      </div>
      <label className="flex min-h-11 items-center gap-2 font-bold">
        <input type="checkbox" name="is_pickup" defaultChecked={area?.is_pickup ?? false} className="size-5 accent-brand" />
        Pick-up point
      </label>
      <label className="flex min-h-11 items-center gap-2 font-bold">
        <input type="checkbox" name="active" defaultChecked={area?.active ?? true} className="size-5 accent-brand" />
        Offered
      </label>
      <SaveButton size="sm" variant={area ? "secondary" : "primary"}>
        {area ? "Save" : "Add area"}
      </SaveButton>
    </AdminForm>
  );
}

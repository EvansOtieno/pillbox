import type { Metadata } from "next";
import { AdminForm, FieldError, SaveButton } from "@/components/admin/admin-form";
import { AdminHeading, INPUT, LABEL } from "@/components/admin/ui";
import { requireStaff } from "@/lib/admin/auth";
import { deleteCategory, saveCategory } from "../content-actions";

export const metadata: Metadata = { title: "Categories" };

type Category = { id: number; name: string; slug: string; description: string; sort_order: number };

export default async function CategoriesPage() {
  const { supabase, role } = await requireStaff();
  const { data } = await supabase.from("categories").select("id, name, slug, description, sort_order, products(count)").order("sort_order");

  return (
    <>
      <AdminHeading title="Categories" />
      <p className="mb-5 max-w-2xl text-muted">
        The order number sets the order on the home page and in the shop filter (lowest first).
      </p>
      <ul className="max-w-4xl space-y-3">
        {(data ?? []).map((c) => (
          <li key={c.id} className="rounded-2xl border border-line bg-surface p-4">
            <CategoryForm category={c} />
            <p className="mt-3 flex flex-wrap items-center gap-4 border-t border-line pt-3 text-sm text-muted">
              {c.products[0]?.count ?? 0} products
              {role === "owner" && (
                <AdminForm action={deleteCategory.bind(null, c.id)} confirm={`Delete the category ${c.name}?`}>
                  <SaveButton variant="danger" size="sm" pendingLabel="Deleting…">
                    Delete
                  </SaveButton>
                </AdminForm>
              )}
            </p>
          </li>
        ))}
      </ul>
      <section aria-labelledby="add-category" className="mt-8 max-w-4xl rounded-2xl border border-dashed border-line p-4">
        <h2 id="add-category" className="mb-3 font-extrabold">
          Add a category
        </h2>
        <CategoryForm />
      </section>
    </>
  );
}

function CategoryForm({ category }: { category?: Category }) {
  const prefix = category ? `c${category.id}` : "new";
  return (
    <AdminForm action={saveCategory.bind(null, category?.id ?? null)} className="grid gap-3 md:grid-cols-[1fr_1fr_6rem]" aria-label={category ? `Edit ${category.name}` : "Add a category"}>
      <div>
        <label htmlFor={`${prefix}-name`} className={LABEL}>Name</label>
        <input id={`${prefix}-name`} name="name" defaultValue={category?.name} className={INPUT} />
        <FieldError name="name" id={`${prefix}-name-error`} />
      </div>
      <div>
        <label htmlFor={`${prefix}-slug`} className={LABEL}>Web address</label>
        <input id={`${prefix}-slug`} name="slug" defaultValue={category?.slug} placeholder="Made from the name" className={INPUT} />
      </div>
      <div>
        <label htmlFor={`${prefix}-sort`} className={LABEL}>Order</label>
        <input id={`${prefix}-sort`} name="sort_order" inputMode="numeric" defaultValue={category?.sort_order ?? 99} className={INPUT} />
      </div>
      <div className="md:col-span-3">
        <label htmlFor={`${prefix}-desc`} className={LABEL}>Description</label>
        <input id={`${prefix}-desc`} name="description" defaultValue={category?.description} className={INPUT} />
      </div>
      <div className="md:col-span-3">
        <SaveButton size="sm" variant={category ? "secondary" : "primary"}>
          {category ? "Save" : "Add category"}
        </SaveButton>
      </div>
    </AdminForm>
  );
}

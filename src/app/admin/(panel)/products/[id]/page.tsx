import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminForm, FieldError, SaveButton } from "@/components/admin/admin-form";
import { ImageUploader } from "@/components/admin/image-uploader";
import { INPUT, LABEL } from "@/components/admin/ui";
import { requireStaff } from "@/lib/admin/auth";
import { deleteProduct, saveProduct, setProductImage } from "../actions";

export const metadata: Metadata = { title: "Edit product" };

const RX_OPTIONS = [
  { value: "general", label: "General sale", help: "Anyone can buy it online." },
  { value: "pharmacy_only", label: "Pharmacy-only (P)", help: "Can be bought; a pharmacist confirms before dispatch." },
  { value: "prescription_only", label: "Prescription-only", help: "Not sold online; customers consult a pharmacist." },
] as const;

export default async function ProductEditPage({ params, searchParams }: PageProps<"/admin/products/[id]">) {
  const { supabase, role } = await requireStaff();
  const { id: rawId } = await params;
  const isNew = rawId === "new";
  const id = isNew ? null : Number(rawId);
  if (!isNew && !Number.isInteger(id)) notFound();

  const [{ data: categories }, { data: product }] = await Promise.all([
    supabase.from("categories").select("id, name").order("sort_order"),
    isNew
      ? Promise.resolve({ data: null })
      : supabase.from("products").select("*").eq("id", id!).maybeSingle(),
  ]);
  if (!isNew && !product) notFound();
  const created = (await searchParams).created;

  return (
    <>
      <Link href="/admin/products" className="text-sm text-muted underline hover:text-brand">
        All products
      </Link>
      <div className="mt-2 mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{product ? product.name : "Add a product"}</h1>
        {product?.published && (
          <Link href={`/product/${product.slug}`} className="font-bold text-brand underline">
            View in the shop
          </Link>
        )}
      </div>
      {created && (
        <p role="status" className="mb-6 rounded-xl bg-mist p-3 font-bold text-brand">
          Product added. You can upload a photo now.
        </p>
      )}

      <div className="grid gap-10 xl:grid-cols-[1fr_20rem]">
        <AdminForm action={saveProduct.bind(null, id)} className="max-w-3xl space-y-6" aria-label="Product details">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field name="name" label="Name" className="sm:col-span-2">
              <input id="name" name="name" defaultValue={product?.name} required className={INPUT} />
            </Field>
            <Field name="slug" label="Web address" help="Leave empty to create it from the name.">
              <input id="slug" name="slug" defaultValue={product?.slug} className={INPUT} />
            </Field>
            <Field name="sku" label="Product code">
              <input id="sku" name="sku" defaultValue={product?.sku} required className={INPUT} />
            </Field>
            <Field name="price_kes" label="Price (KES, whole shillings)">
              <input id="price_kes" name="price_kes" inputMode="numeric" defaultValue={product?.price_kes} required className={`${INPUT} tabular-nums`} />
            </Field>
            <Field name="category_id" label="Category">
              <select id="category_id" name="category_id" defaultValue={product?.category_id ?? ""} required className={INPUT}>
                <option value="" disabled>
                  Choose a category
                </option>
                {(categories ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <fieldset>
            <legend className={LABEL}>Medicine class</legend>
            <div className="grid gap-2 sm:grid-cols-3">
              {RX_OPTIONS.map((o) => (
                <label key={o.value} className="flex cursor-pointer gap-3 rounded-xl border border-line bg-surface p-3 has-checked:border-brand has-checked:bg-mist">
                  <input type="radio" name="rx_class" value={o.value} defaultChecked={(product?.rx_class ?? "general") === o.value} className="mt-1 size-4 accent-brand" />
                  <span>
                    <span className="block font-bold">{o.label}</span>
                    <span className="text-sm text-muted">{o.help}</span>
                  </span>
                </label>
              ))}
            </div>
            <FieldError name="rx_class" />
          </fieldset>

          <Field name="short_description" label="Short description" help="One line, shown under the name.">
            <input id="short_description" name="short_description" defaultValue={product?.short_description} className={INPUT} />
          </Field>
          <Field name="description" label="Description" help="A blank line starts a new paragraph.">
            <textarea id="description" name="description" rows={8} defaultValue={product?.description} className={INPUT} />
          </Field>

          <fieldset className="flex flex-wrap gap-x-8 gap-y-2">
            <legend className="sr-only">Visibility</legend>
            <Check name="in_stock" label="In stock" checked={product?.in_stock ?? true} />
            <Check name="featured" label="Featured on the home page" checked={product?.featured ?? false} />
            <Check name="published" label="Shown in the shop" checked={product?.published ?? true} />
          </fieldset>

          <div className="border-t border-line pt-6">
            <SaveButton>{isNew ? "Add product" : "Save changes"}</SaveButton>
          </div>
        </AdminForm>

        {product && (
          <aside className="space-y-8">
            <section aria-labelledby="photo-title">
              <h2 id="photo-title" className="mb-3 text-lg font-extrabold">
                Photo
              </h2>
              <ImageUploader productId={product.id} imagePath={product.image_path} productName={product.name} setImage={setProductImage} />
            </section>
            {role === "owner" && (
              <section aria-labelledby="danger-title" className="rounded-2xl border border-rx/30 p-5">
                <h2 id="danger-title" className="font-extrabold text-rx">
                  Delete product
                </h2>
                <p className="mt-1 mb-4 text-sm text-muted">
                  Removes it from the shop for good. Past orders keep their copy of the item. To hide it for a while, untick
                  &ldquo;Shown in the shop&rdquo; instead.
                </p>
                <AdminForm action={deleteProduct.bind(null, product.id)} confirm={`Delete ${product.name}? This can't be undone.`}>
                  <SaveButton variant="danger" pendingLabel="Deleting…">
                    Delete product
                  </SaveButton>
                </AdminForm>
              </section>
            )}
          </aside>
        )}
      </div>
    </>
  );
}

function Field({
  name,
  label,
  help,
  className = "",
  children,
}: {
  name: string;
  label: string;
  help?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label htmlFor={name} className={LABEL}>
        {label}
      </label>
      {help && <p className="-mt-0.5 mb-1 text-sm text-muted">{help}</p>}
      {children}
      <FieldError name={name} />
    </div>
  );
}

function Check({ name, label, checked }: { name: string; label: string; checked: boolean }) {
  return (
    <label className="flex min-h-11 items-center gap-2 font-bold">
      <input type="checkbox" name={name} defaultChecked={checked} className="size-5 accent-brand" />
      {label}
    </label>
  );
}

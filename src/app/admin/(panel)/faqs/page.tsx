import type { Metadata } from "next";
import { AdminForm, FieldError, SaveButton } from "@/components/admin/admin-form";
import { AdminHeading, INPUT, LABEL } from "@/components/admin/ui";
import { requireStaff } from "@/lib/admin/auth";
import { deleteFaq, saveFaq } from "../content-actions";

export const metadata: Metadata = { title: "FAQs" };

type Faq = { id: number; question: string; answer: string; sort_order: number };

export default async function FaqsPage() {
  const { supabase } = await requireStaff();
  const { data } = await supabase.from("faqs").select("id, question, answer, sort_order").order("sort_order");

  return (
    <>
      <AdminHeading title="Questions and answers" />
      <p className="mb-5 max-w-2xl text-muted">
        In an answer, <code className="rounded bg-mist px-1">{"{delivery_fees}"}</code> shows the live delivery fee table and{" "}
        <code className="rounded bg-mist px-1">{"{hours}"}</code> the opening hours. A blank line starts a new paragraph.
      </p>
      <ul className="max-w-4xl space-y-3">
        {(data ?? []).map((faq) => (
          <li key={faq.id} className="rounded-2xl border border-line bg-surface p-4">
            <FaqForm faq={faq} />
            <div className="mt-3 border-t border-line pt-3">
              <AdminForm action={deleteFaq.bind(null, faq.id)} confirm={`Delete the question "${faq.question}"?`}>
                <SaveButton variant="danger" size="sm" pendingLabel="Deleting…">
                  Delete
                </SaveButton>
              </AdminForm>
            </div>
          </li>
        ))}
      </ul>
      <section aria-labelledby="add-faq" className="mt-8 max-w-4xl rounded-2xl border border-dashed border-line p-4">
        <h2 id="add-faq" className="mb-3 font-extrabold">
          Add a question
        </h2>
        <FaqForm />
      </section>
    </>
  );
}

function FaqForm({ faq }: { faq?: Faq }) {
  const prefix = faq ? `f${faq.id}` : "new";
  return (
    <AdminForm action={saveFaq.bind(null, faq?.id ?? null)} className="grid gap-3 md:grid-cols-[1fr_6rem]" aria-label={faq ? `Edit: ${faq.question}` : "Add a question"}>
      <div>
        <label htmlFor={`${prefix}-q`} className={LABEL}>Question</label>
        <input id={`${prefix}-q`} name="question" defaultValue={faq?.question} className={INPUT} />
        <FieldError name="question" id={`${prefix}-q-error`} />
      </div>
      <div>
        <label htmlFor={`${prefix}-sort`} className={LABEL}>Order</label>
        <input id={`${prefix}-sort`} name="sort_order" inputMode="numeric" defaultValue={faq?.sort_order ?? 99} className={INPUT} />
      </div>
      <div className="md:col-span-2">
        <label htmlFor={`${prefix}-a`} className={LABEL}>Answer</label>
        <textarea id={`${prefix}-a`} name="answer" rows={4} defaultValue={faq?.answer} className={INPUT} />
        <FieldError name="answer" id={`${prefix}-a-error`} />
      </div>
      <div className="md:col-span-2">
        <SaveButton size="sm" variant={faq ? "secondary" : "primary"}>
          {faq ? "Save" : "Add question"}
        </SaveButton>
      </div>
    </AdminForm>
  );
}

import type { Metadata } from "next";
import { ChevronDownIcon } from "@/components/icons";
import { DeliveryFeeTable, HoursBlock, PageHeading } from "@/components/sections";
import { getDeliveryAreas, getFaqs, getSettings } from "@/lib/data/storefront";
import { deliveryFeesText } from "@/lib/domain/delivery";
import { faqParts, faqSchema, type FaqToken } from "@/lib/domain/faq";
import { hoursLine } from "@/lib/domain/hours";
import { hoursFrom } from "@/lib/site";

export const metadata: Metadata = {
  title: "Questions and answers",
  description: "How ordering, delivery, payment and prescriptions work at Afya Corner.",
};

export default async function FaqPage() {
  const [settings, faqs, areas] = await Promise.all([getSettings(), getFaqs(), getDeliveryAreas()]);
  const hours = hoursFrom(settings);

  // {delivery_fees} and {hours} in an answer become live components here, plain text for search engines.
  const blocks: Record<FaqToken, React.ReactNode> = {
    "{delivery_fees}": <DeliveryFeeTable areas={areas} />,
    "{hours}": <HoursBlock hours={hours} />,
  };
  const schema = faqSchema(faqs, { "{delivery_fees}": deliveryFeesText(areas), "{hours}": hoursLine(hours) });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <PageHeading title="Questions and answers" />
      <div className="mt-8 max-w-3xl border-t border-line">
        {faqs.map((faq) => (
          <details key={faq.id} className="group border-b border-line">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-lg font-bold [&::-webkit-details-marker]:hidden">
              {faq.question}
              <ChevronDownIcon className="size-5 shrink-0 text-muted transition-transform duration-200 group-open:rotate-180" />
            </summary>
            <div className="space-y-4 pb-6 text-[1.0625rem] leading-relaxed">
              {faqParts(faq.answer).map((part, i) =>
                part.type === "token" ? <div key={i}>{blocks[part.token]}</div> : <p key={i}>{part.text}</p>,
              )}
            </div>
          </details>
        ))}
      </div>
      <script
        type="application/ld+json"
        // JSON.stringify output with "<" escaped cannot break out of the script tag.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }}
      />
    </div>
  );
}

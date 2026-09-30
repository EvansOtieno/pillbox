/**
 * FAQ answers may contain live-data tokens. On the page, a token becomes a block (the fee table or
 * the hours component); in plain text (search engines) it becomes a sentence.
 */
export const FAQ_TOKENS = ["{delivery_fees}", "{hours}"] as const;
export type FaqToken = (typeof FAQ_TOKENS)[number];

export type FaqPart = { type: "text"; text: string } | { type: "token"; token: FaqToken };

export interface Faq {
  question: string;
  answer: string;
}

const TOKEN_PATTERN = /(\{delivery_fees\}|\{hours\})/;

/**
 * Split an answer into paragraphs and tokens, for rendering. Blank lines separate paragraphs;
 * tokens are pulled out wherever they appear, so a table never ends up inside a <p>.
 */
export function faqParts(answer: string): FaqPart[] {
  const parts: FaqPart[] = [];
  for (const chunk of answer.split(TOKEN_PATTERN)) {
    if ((FAQ_TOKENS as readonly string[]).includes(chunk)) {
      parts.push({ type: "token", token: chunk as FaqToken });
      continue;
    }
    for (const paragraph of chunk.split(/\n\s*\n/)) {
      const text = paragraph.trim();
      if (text) parts.push({ type: "text", text });
    }
  }
  return parts;
}

/** Answer with tokens replaced by plain text. */
export function faqPlainText(answer: string, tokens: Record<FaqToken, string>): string {
  return FAQ_TOKENS.reduce((text, token) => text.split(token).join(tokens[token]), answer);
}

/** schema.org FAQPage structured data: plain-text answers, no HTML, no tokens. */
export function faqSchema(faqs: readonly Faq[], tokens: Record<FaqToken, string>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: faqPlainText(f.answer, tokens) },
    })),
  };
}

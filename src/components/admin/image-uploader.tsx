"use client";

import Image from "next/image";
import { useRef, useState, useTransition } from "react";
import type { ActionResult } from "@/lib/admin/action-result";
import { IMAGE_TYPES, MAX_IMAGE_BYTES, productImageUrl } from "@/lib/images";
import { createBrowserSupabase } from "@/lib/supabase/browser";

/**
 * Product photo upload. The browser sends the file straight to Supabase Storage with the staff
 * member's session (Storage RLS: staff only), then a Server Action points the product at it.
 */
export function ImageUploader({
  productId,
  imagePath,
  productName,
  setImage,
}: {
  productId: number;
  imagePath: string | null;
  productName: string;
  setImage: (id: number, path: string | null) => Promise<ActionResult>;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, startTransition] = useTransition();

  function upload(file: File) {
    if (!(IMAGE_TYPES as readonly string[]).includes(file.type)) {
      setMessage({ ok: false, text: "Use a JPG, PNG, WebP or AVIF photo." });
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setMessage({ ok: false, text: "The photo is larger than 2 MB. Export a smaller copy and try again." });
      return;
    }
    startTransition(async () => {
      setMessage({ ok: true, text: "Uploading…" });
      const ext = file.type.split("/")[1].replace("jpeg", "jpg");
      const path = `products/${productId}/${Date.now()}.${ext}`;
      const { error } = await createBrowserSupabase().storage.from("product-images").upload(path, file, {
        contentType: file.type,
        cacheControl: "31536000", // new uploads get new names, so they can be cached for a year
      });
      if (error) {
        setMessage({ ok: false, text: "The upload failed. Check your connection and try again." });
        return;
      }
      const result = await setImage(productId, path);
      setMessage({ ok: result.ok, text: result.message });
      if (input.current) input.current.value = "";
    });
  }

  function remove() {
    startTransition(async () => {
      const result = await setImage(productId, null);
      setMessage({ ok: result.ok, text: result.message });
    });
  }

  return (
    <div>
      <div className="relative aspect-square w-full max-w-72 overflow-hidden rounded-2xl border border-line bg-mist">
        {imagePath ? (
          <Image src={productImageUrl(imagePath)} alt={productName} fill sizes="18rem" className="object-contain p-2" />
        ) : (
          <p className="flex h-full items-center justify-center p-6 text-center text-sm text-muted">
            No photo yet. The shop shows the category icon instead.
          </p>
        )}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <label className="inline-flex h-11 cursor-pointer items-center rounded-full border border-line bg-surface px-4 font-bold hover:border-brand has-focus-visible:outline-3 has-focus-visible:outline-cross">
          {imagePath ? "Replace photo" : "Upload a photo"}
          <input
            ref={input}
            type="file"
            accept={IMAGE_TYPES.join(",")}
            className="sr-only"
            disabled={busy}
            onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
          />
        </label>
        {imagePath && (
          <button type="button" onClick={remove} disabled={busy} className="min-h-11 text-sm font-bold text-rx underline">
            Remove photo
          </button>
        )}
      </div>
      <p className="mt-2 text-sm text-muted">JPG, PNG, WebP or AVIF, up to 2 MB. Square photos on a plain background look best.</p>
      <p role="status" className={`mt-1 text-sm font-bold ${message?.ok === false ? "text-rx" : "text-brand"}`}>
        {message?.text}
      </p>
    </div>
  );
}

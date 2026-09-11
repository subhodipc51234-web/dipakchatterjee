// app/admin/(protected)/settings/BrandingTextForm.tsx
//
// Dynamic text controls for the header branding block (name + subtitle
// beside the icon) and the footer (tagline, copyright name, closing
// note). Revalidates the whole public site layout on save, so changes
// show up immediately on both desktop and mobile.

"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Save } from "lucide-react";
import type { SiteSettings } from "@/types/domain";
import { updateBrandingText } from "./actions";

const brandingSchema = z.object({
  header_name: z.string().trim().max(120).optional(),
  header_subtitle: z.string().trim().max(160).optional(),
  footer_tagline: z.string().trim().max(300).optional(),
  footer_copyright_name: z.string().trim().max(120).optional(),
  footer_note: z.string().trim().max(200).optional(),
  office_email: z.string().trim().email("Enter a valid email address.").max(200).optional().or(z.literal("")),
});

type BrandingFormValues = z.infer<typeof brandingSchema>;

export default function BrandingTextForm({ settings }: { settings: SiteSettings | null }) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BrandingFormValues>({
    resolver: zodResolver(brandingSchema),
    defaultValues: {
      header_name: settings?.header_name ?? "",
      header_subtitle: settings?.header_subtitle ?? "",
      footer_tagline: settings?.footer_tagline ?? "",
      footer_copyright_name: settings?.footer_copyright_name ?? "",
      footer_note: settings?.footer_note ?? "",
      office_email: settings?.office_email ?? "",
    },
  });

  function submit(values: BrandingFormValues) {
    setServerError(null);
    setSaved(false);
    startTransition(async () => {
      try {
        await updateBrandingText({
          header_name: values.header_name ?? "",
          header_subtitle: values.header_subtitle ?? "",
          footer_tagline: values.footer_tagline ?? "",
          footer_copyright_name: values.footer_copyright_name ?? "",
          footer_note: values.footer_note ?? "",
          office_email: values.office_email ?? "",
        });
        setSaved(true);
      } catch (err) {
        setServerError(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  }

  return (
    <div className="bg-white border border-line rounded-xl p-6 md:p-8">
      <p className="text-sm font-semibold text-navy-900 mb-1">Header &amp; footer branding</p>
      <p className="text-xs text-ink-400 mb-5">
        Leave any field blank to fall back to the original site copy. These update the header
        (name + subtitle beside the icon) and the footer, on both desktop and mobile.
      </p>

      <form onSubmit={handleSubmit(submit)} className="space-y-5">
        <div>
          <p className="text-xs font-semibold text-ink-400 uppercase tracking-wide mb-3">Header</p>

          <div className="space-y-4">
            <div>
              <label htmlFor="header_name" className="block text-sm font-medium text-navy-900 mb-1.5">
                Name
              </label>
              <input
                id="header_name"
                type="text"
                {...register("header_name")}
                placeholder="Add name..."
                className="w-full rounded-md border border-line bg-white px-4 py-3 text-sm text-ink focus:border-saffron focus:outline-none"
              />
              {errors.header_name && (
                <p className="text-xs text-rust mt-1.5">{errors.header_name.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="header_subtitle" className="block text-sm font-medium text-navy-900 mb-1.5">
                Subtitle / tags
              </label>
              <input
                id="header_subtitle"
                type="text"
                {...register("header_subtitle")}
                placeholder="Add subtitle..."
                className="w-full rounded-md border border-line bg-white px-4 py-3 text-sm text-ink focus:border-saffron focus:outline-none"
              />
              {errors.header_subtitle && (
                <p className="text-xs text-rust mt-1.5">{errors.header_subtitle.message}</p>
              )}
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-line">
          <p className="text-xs font-semibold text-ink-400 uppercase tracking-wide mb-3 mt-5">Contact</p>

          <div>
            <label htmlFor="office_email" className="block text-sm font-medium text-navy-900 mb-1.5">
              Contact email
            </label>
            <input
              id="office_email"
              type="email"
              {...register("office_email")}
              placeholder="office@example.com"
              className="w-full rounded-md border border-line bg-white px-4 py-3 text-sm text-ink focus:border-saffron focus:outline-none"
            />
            <p className="text-xs text-ink-400 mt-1.5">
              Shown in the footer and on the complaint page. Updating it here changes it
              everywhere on the site.
            </p>
            {errors.office_email && (
              <p className="text-xs text-rust mt-1.5">{errors.office_email.message}</p>
            )}
          </div>
        </div>

        <div className="pt-2 border-t border-line">
          <p className="text-xs font-semibold text-ink-400 uppercase tracking-wide mb-3 mt-5">Footer</p>

          <div className="space-y-4">
            <div>
              <label htmlFor="footer_tagline" className="block text-sm font-medium text-navy-900 mb-1.5">
                Footer tagline
              </label>
              <textarea
                id="footer_tagline"
                rows={2}
                {...register("footer_tagline")}
                placeholder="Add a short description..."
                className="w-full rounded-md border border-line bg-white px-4 py-3 text-sm text-ink focus:border-saffron focus:outline-none resize-y"
              />
              {errors.footer_tagline && (
                <p className="text-xs text-rust mt-1.5">{errors.footer_tagline.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="footer_copyright_name" className="block text-sm font-medium text-navy-900 mb-1.5">
                Copyright name
              </label>
              <input
                id="footer_copyright_name"
                type="text"
                {...register("footer_copyright_name")}
                placeholder="Add name..."
                className="w-full rounded-md border border-line bg-white px-4 py-3 text-sm text-ink focus:border-saffron focus:outline-none"
              />
              <p className="text-xs text-ink-400 mt-1.5">
                Shown as the footer heading and in &ldquo;&copy; {new Date().getFullYear()} [name]. All rights
                reserved.&rdquo;
              </p>
              {errors.footer_copyright_name && (
                <p className="text-xs text-rust mt-1.5">{errors.footer_copyright_name.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="footer_note" className="block text-sm font-medium text-navy-900 mb-1.5">
                Footer note
              </label>
              <input
                id="footer_note"
                type="text"
                {...register("footer_note")}
                placeholder="Add a closing note..."
                className="w-full rounded-md border border-line bg-white px-4 py-3 text-sm text-ink focus:border-saffron focus:outline-none"
              />
              {errors.footer_note && (
                <p className="text-xs text-rust mt-1.5">{errors.footer_note.message}</p>
              )}
            </div>
          </div>
        </div>

        {serverError && (
          <p className="text-sm text-rust" role="alert">
            {serverError}
          </p>
        )}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center gap-2 bg-saffron hover:bg-saffron-600 disabled:opacity-60 text-white font-semibold px-5 py-3 rounded-md transition-colors"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isPending ? "Saving…" : "Save"}
          </button>
          {saved && !isPending && <span className="text-xs text-forest">Saved.</span>}
        </div>
      </form>
    </div>
  );
}

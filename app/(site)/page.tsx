// app/(site)/page.tsx
//
// Public homepage. Hero copy, hero image, CTA buttons, and the
// affiliated-organization logos all come from site_settings/cta_buttons/
// organizations (editable at /admin/settings -> Landing), falling back to
// the original static index.html copy when unset. The About/Public
// Life/press sections and the feed come straight from Supabase.
//
// The hero renders twice: a `md:hidden` mobile-only version (heading
// overlaid on the image, body copy/CTAs live below it in normal flow so
// nothing overlaps or blocks taps) and a `hidden md:block` desktop
// version that is the original side-by-side layout, byte-for-byte — so
// the desktop hero is guaranteed unaffected by the mobile redesign.
//
// "Submit a complaint" only ever appears once per viewport — in the
// header nav (and its mobile drawer) — so it isn't duplicated beside the
// hero CTA buttons.

import { createClient } from "@/utils/supabase/server";
import type { CtaButton, FeatureWithMedia, Organization, PostWithMedia, SiteSettings } from "@/types/domain";
import FeatureSection from "@/components/features/FeatureSection";
import PostsFeed from "@/components/posts/PostsFeed";
import OrganizationLogos from "@/components/OrganizationLogos";
import CtaButtonGroup from "@/components/CtaButtonGroup";
import RevealOnScroll from "@/components/RevealOnScroll";

const FALLBACK_HEADLINE = "A life spent teaching, organising, and showing up when it matters.";
const FALLBACK_BODY =
  "Dipak Chatterjee has spent over two decades as a schoolteacher and headmaster in Chanchal, North Malda, alongside a parallel life of community organising. This is his record of work, and a direct line for anyone who needs help.";

export default async function HomePage() {
  const supabase = await createClient();

  const [{ data: features }, { data: posts }, { data: settings }, { data: organizations }, { data: ctaButtons }] =
    await Promise.all([
      supabase
        .from("features")
        .select("*, feature_media(*)")
        .eq("is_published", true)
        .order("display_order", { ascending: true })
        .order("display_order", { foreignTable: "feature_media", ascending: true }),
      supabase
        .from("posts")
        .select("*, post_media(*)")
        .eq("is_published", true)
        .order("published_at", { ascending: false })
        .order("created_at", { ascending: false })
        .order("display_order", { foreignTable: "post_media", ascending: true }),
      supabase.from("site_settings").select("*").eq("id", "default").single(),
      supabase.from("organizations").select("*").order("display_order", { ascending: true }),
      supabase.from("cta_buttons").select("*").order("display_order", { ascending: true }),
    ]);

  const s = settings as SiteSettings | null;
  const headline = s?.hero_headline || FALLBACK_HEADLINE;
  const body = s?.hero_body || FALLBACK_BODY;
  const themePrimary = s?.theme_primary_color || "#C1832B";
  const orgs = (organizations as Organization[]) ?? [];
  const ctas = (ctaButtons as CtaButton[]) ?? [];

  return (
    <main id="main">
      {/* Mobile-only hero: ONLY the heading sits over the photo (with a
          gradient behind it for legibility). Body copy, CTAs, and the
          organization logos live below the image in normal document
          flow — never overlapping it, so nothing is ever visually
          blocked or untappable. */}
      <section className="md:hidden border-b border-line dark:border-white/10">
        <div className="relative w-full aspect-[4/5] overflow-hidden">
          {s?.hero_image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={s.hero_image_url}
              alt="Portrait of Dipak Chatterjee"
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 w-full h-full bg-navy-900" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-navy-900 via-navy-900/30 to-transparent" />

          <div className="absolute inset-x-0 bottom-0 px-5 pb-6">
            <h1 className="font-display text-4xl leading-[1.1] text-white">{headline}</h1>
          </div>
        </div>

        <div className="px-5 pt-6 pb-10 bg-paper-100 dark:bg-navy-900">
          <p className="text-ink-600 dark:text-paper-100/70 text-base leading-relaxed">{body}</p>

          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
            <CtaButtonGroup buttons={ctas} themePrimary={themePrimary} />
          </div>

          <OrganizationLogos organizations={orgs} />
        </div>
      </section>

      {/* Desktop hero — unchanged side-by-side layout. */}
      <section className="hidden md:block ledger-lines border-b border-line dark:border-white/10">
        <div className="max-w-6xl mx-auto px-5 md:px-8 pt-12 md:pt-20 pb-14 md:pb-24 grid md:grid-cols-[1.1fr_0.9fr] gap-12 md:gap-10 items-center">
          <div>
            <h1 className="font-display text-4xl sm:text-5xl md:text-[3.4rem] leading-[1.08] text-navy-900 dark:text-white">
              {headline}
            </h1>

            <p className="mt-6 text-ink-600 dark:text-paper-100/70 text-base md:text-lg max-w-xl leading-relaxed">
              {body}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
              <CtaButtonGroup buttons={ctas} themePrimary={themePrimary} />
            </div>

            <OrganizationLogos organizations={orgs} />
          </div>

          <div>
            <div className="relative max-w-sm mx-auto md:max-w-none">
              <div className="absolute -inset-3 border border-[var(--theme-primary)]/60 rounded-lg hidden sm:block" />
              <div className="relative w-full rounded-lg aspect-[4/5] shadow-[0_18px_40px_-16px_rgba(21,31,51,0.35)] bg-navy-800 overflow-hidden flex items-center justify-center">
                {s?.hero_image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={s.hero_image_url}
                    alt="Portrait of Dipak Chatterjee"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="font-display text-6xl text-paper-100/30">DC</span>
                )}
              </div>
              <div className="relative -mt-8 mr-6 ml-auto w-max bg-[var(--theme-secondary)] text-paper-100 px-5 py-3 rounded-md shadow-lg hidden sm:block">
                <p className="text-xs text-paper-100/70">Chanchal, North Malda</p>
                <p className="font-display text-sm">Community Leader</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {((features as FeatureWithMedia[]) ?? []).map((feature) => (
        <RevealOnScroll key={feature.id}>
          <FeatureSection feature={feature} galleryIntervalMs={s?.gallery_interval_ms ?? undefined} />
        </RevealOnScroll>
      ))}

      <PostsFeed posts={(posts as PostWithMedia[]) ?? []} />
    </main>
  );
}

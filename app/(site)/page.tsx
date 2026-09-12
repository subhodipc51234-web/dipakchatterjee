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
// version (components/DesktopHero.tsx) with the original side-by-side
// layout, plus client state so the portrait resizes in sync with the
// bio's Read More/Read Less.
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
import ExpandableBio from "@/components/ExpandableBio";
import DesktopHero from "@/components/DesktopHero";

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
  // No fallback text here (unlike headline/body): a blank badge field
  // means "don't show the badge", not "show placeholder copy".
  const badgeSubtitle = s?.hero_badge_subtitle?.trim() || "";
  const badgeTitle = s?.hero_badge_title?.trim() || "";
  const orgMaxPerRow = s?.org_max_per_row ?? 6;
  const orgs = (organizations as Organization[]) ?? [];
  const ctas = (ctaButtons as CtaButton[]) ?? [];

  return (
    <main id="main">
      {/* Mobile-only hero: ONLY the heading sits over the photo (with a
          gradient behind it for legibility). Body copy, CTAs, and the
          organization logos live below the image in normal document
          flow — never overlapping it, so nothing is ever visually
          blocked or untappable. */}
      <section className="md:hidden border-b border-line">
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

        <div className="px-5 pt-6 pb-10 bg-paper-100">
          <ExpandableBio text={body} />

          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
            <CtaButtonGroup buttons={ctas} themePrimary={themePrimary} />
          </div>

          <OrganizationLogos organizations={orgs} maxPerRow={orgMaxPerRow} />
        </div>
      </section>

      {/* Desktop hero — same side-by-side layout, now a client component
          so the portrait can grow/shrink in sync with Read More/Read
          Less (see components/DesktopHero.tsx). */}
      <section className="hidden md:block ledger-lines border-b border-line">
        <DesktopHero
          headline={headline}
          body={body}
          ctas={ctas}
          themePrimary={themePrimary}
          orgs={orgs}
          orgMaxPerRow={orgMaxPerRow}
          heroImageUrl={s?.hero_image_url}
          badgeSubtitle={badgeSubtitle}
          badgeTitle={badgeTitle}
        />
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

// app/admin/(protected)/settings/page.tsx
import { createClient } from "@/utils/supabase/server";
import type { CtaButton, FooterBlockWithLinks, Organization, SiteSettings, SocialLink } from "@/types/domain";
import SiteImageUploader from "./SiteImageUploader";
import LandingForm from "./LandingForm";
import OrganizationsManager from "./OrganizationsManager";
import ThemeColorForm from "./ThemeColorForm";
import CtaButtonsManager from "./CtaButtonsManager";
import BrandingTextForm from "./BrandingTextForm";
import FooterBlocksManager from "./FooterBlocksManager";
import SocialLinksManager from "./SocialLinksManager";

export default async function SettingsPage() {
  const supabase = await createClient();

  const [{ data: settings }, { data: organizations }, { data: ctaButtons }, { data: footerBlocks }, { data: socialLinks }] =
    await Promise.all([
      supabase.from("site_settings").select("*").eq("id", "default").single(),
      supabase.from("organizations").select("*").order("display_order", { ascending: true }),
      supabase.from("cta_buttons").select("*").order("display_order", { ascending: true }),
      supabase
        .from("footer_blocks")
        .select("*, footer_links(*)")
        .order("display_order", { ascending: true })
        .order("display_order", { foreignTable: "footer_links", ascending: true }),
      supabase.from("social_links").select("*").order("display_order", { ascending: true }),
    ]);

  const s = settings as SiteSettings | null;
  const themePrimary = s?.theme_primary_color || "#C1832B";
  const themeSecondary = s?.theme_secondary_color || "#151F33";

  return (
    <div className="max-w-2xl">
      <p className="text-sm font-semibold text-saffron-600 mb-2">Settings</p>
      <h1 className="font-display text-3xl text-navy-900 mb-1">Landing</h1>
      <p className="text-sm text-ink-600 mb-8">
        The hero section, images, colors, and affiliated organizations shown on the public
        homepage.
      </p>

      <div className="space-y-6">
        <LandingForm settings={s} />

        <BrandingTextForm settings={s} />

        <FooterBlocksManager blocks={(footerBlocks as FooterBlockWithLinks[]) ?? []} />

        <SocialLinksManager links={(socialLinks as SocialLink[]) ?? []} />

        <CtaButtonsManager buttons={(ctaButtons as CtaButton[]) ?? []} themePrimary={themePrimary} />

        <ThemeColorForm primaryColor={themePrimary} secondaryColor={themeSecondary} />

        <SiteImageUploader
          kind="hero"
          label="Hero Image"
          helpText="Large portrait shown at the top of the homepage. Recommended: a 4:5 portrait photo."
          currentUrl={s?.hero_image_url ?? null}
          previewClassName="w-32 aspect-[4/5] rounded-lg"
        />

        <SiteImageUploader
          kind="avatar"
          label="Profile Avatar"
          helpText="Small circular photo shown in the site header next to the name."
          currentUrl={s?.avatar_url ?? null}
          previewClassName="w-16 h-16 rounded-full"
        />

        <OrganizationsManager organizations={(organizations as Organization[]) ?? []} />
      </div>
    </div>
  );
}

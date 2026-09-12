// app/admin/(protected)/settings/page.tsx
import { createClient } from "@/utils/supabase/server";
import type {
  CtaButton,
  Feature,
  FooterBlockWithLinks,
  HeaderAction,
  NavLink,
  Organization,
  SiteSettings,
  SocialLink,
} from "@/types/domain";
import SiteImageUploader from "./SiteImageUploader";
import LandingForm from "./LandingForm";
import OrganizationsManager from "./OrganizationsManager";
import ThemeColorForm from "./ThemeColorForm";
import CtaButtonsManager from "./CtaButtonsManager";
import BrandingTextForm from "./BrandingTextForm";
import FooterBlocksManager from "./FooterBlocksManager";
import SocialLinksManager from "./SocialLinksManager";
import HeaderNavigationManager from "./HeaderNavigationManager";
import HomepageLayoutManager from "./HomepageLayoutManager";
import UsersManager from "./UsersManager";
import SettingsTabs from "./SettingsTabs";
import { computeHomepageOrder } from "@/lib/homepage-layout";
import type { Profile } from "@/types/domain";

export default async function SettingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: viewerProfile } = user
    ? await supabase.from("profiles").select("is_admin, is_moderator").eq("id", user.id).single()
    : { data: null };

  // Settings holds site-wide content controls and the Users & Access
  // panel. ADMIN and MODERATOR both get full content/settings access —
  // kept off-limits to a plain USER account even though the dashboard
  // shell itself lets one in (see the (protected) layout). Users &
  // Access itself further restricts mutation controls to the ADMIN
  // alone — see viewerIsOwner below and UsersManager.tsx.
  if (!viewerProfile?.is_admin && !viewerProfile?.is_moderator) {
    return (
      <div className="max-w-2xl">
        <p className="text-sm font-semibold text-saffron-600 mb-2">Settings</p>
        <h1 className="font-display text-3xl text-navy-900 mb-4">Admins only</h1>
        <p className="text-sm text-ink-600">
          Site settings are managed by the ADMIN and MODERATOR accounts.
        </p>
      </div>
    );
  }

  const [
    { data: settings },
    { data: organizations },
    { data: ctaButtons },
    { data: footerBlocks },
    { data: socialLinks },
    { data: navLinks },
    { data: headerActions },
    { data: features },
    { data: profiles },
  ] = await Promise.all([
    supabase.from("site_settings").select("*").eq("id", "default").single(),
    supabase.from("organizations").select("*").order("display_order", { ascending: true }),
    supabase.from("cta_buttons").select("*").order("display_order", { ascending: true }),
    supabase
      .from("footer_blocks")
      .select("*, footer_links(*)")
      .order("display_order", { ascending: true })
      .order("display_order", { foreignTable: "footer_links", ascending: true }),
    supabase.from("social_links").select("*").order("display_order", { ascending: true }),
    supabase.from("nav_links").select("*").order("display_order", { ascending: true }),
    supabase.from("header_actions").select("*").order("display_order", { ascending: true }),
    // Every feature, published or not — the Layout Builder needs to
    // show and let an admin re-enable a currently-hidden section.
    supabase.from("features").select("*").order("display_order", { ascending: true }),
    supabase.from("profiles").select("*").order("created_at", { ascending: true }),
  ]);

  const s = settings as SiteSettings | null;
  const themePrimary = s?.theme_primary_color || "#C1832B";
  const themeSecondary = s?.theme_secondary_color || "#151F33";
  const featureList = (features as Feature[]) ?? [];
  const homepageOrder = computeHomepageOrder(s?.homepage_layout, featureList);

  return (
    <div className="max-w-2xl">
      <p className="text-sm font-semibold text-saffron-600 mb-2">Settings</p>
      <h1 className="font-display text-3xl text-navy-900 mb-1">Landing</h1>
      <p className="text-sm text-ink-600 mb-8">
        The hero section, images, colors, and affiliated organizations shown on the public
        homepage.
      </p>

      <SettingsTabs
        general={
          <>
            <BrandingTextForm settings={s} />
            <FooterBlocksManager blocks={(footerBlocks as FooterBlockWithLinks[]) ?? []} />
            <SocialLinksManager links={(socialLinks as SocialLink[]) ?? []} />
            <ThemeColorForm primaryColor={themePrimary} secondaryColor={themeSecondary} />
          </>
        }
        sections={
          <HomepageLayoutManager
            initialOrder={homepageOrder}
            features={featureList}
            organizationsVisible={s?.show_organizations_section ?? true}
            postsVisible={s?.show_posts_feed_section ?? true}
          />
        }
        header={
          <HeaderNavigationManager
            navLinks={(navLinks as NavLink[]) ?? []}
            headerActions={(headerActions as HeaderAction[]) ?? []}
            themePrimary={themePrimary}
          />
        }
        hero={
          <>
            <LandingForm settings={s} />
            <CtaButtonsManager buttons={(ctaButtons as CtaButton[]) ?? []} themePrimary={themePrimary} />
          </>
        }
        media={
          <>
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

            <OrganizationsManager
              organizations={(organizations as Organization[]) ?? []}
              orgMaxPerRow={s?.org_max_per_row ?? 6}
            />
          </>
        }
        users={
          <UsersManager
            users={(profiles as Profile[]) ?? []}
            viewerId={user!.id}
            viewerIsOwner={Boolean(viewerProfile.is_admin)}
          />
        }
      />
    </div>
  );
}

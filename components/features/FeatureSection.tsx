// components/features/FeatureSection.tsx
//
// Renders one published Feature row. Layout is chosen by `feature.type`,
// styled after the corresponding section in the original static
// index.html (About, Public Life, Notable Works were separate hand-built
// sections there — here they're one component branching on type).

import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import MediaPlayer from "@/components/MediaPlayer";
import PublicLifeGallery from "@/components/PublicLifeGallery";
import type { FeatureWithMedia } from "@/types/domain";

const proseComponents: Components = {
  p: ({ children }) => <p className="leading-relaxed">{children}</p>,
};

const statComponents: Components = {
  ul: ({ children }) => (
    <dl className="grid grid-cols-1 sm:grid-cols-3 gap-6">{children}</dl>
  ),
  li: ({ children }) => (
    <div className="border-l-2 border-[var(--theme-primary)] pl-4">
      <dd className="font-display text-3xl md:text-4xl text-navy-900">
        {children}
      </dd>
    </div>
  ),
  strong: ({ children }) => <span className="block">{children}</span>,
};

function MediaGrid({ media, dark }: { media: FeatureWithMedia["feature_media"]; dark?: boolean }) {
  if (media.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-6">
      {media.map((item) => (
        <MediaPlayer
          key={item.id}
          kind={item.kind}
          src={item.public_url}
          caption={item.caption ?? undefined}
          className={dark ? "[&_figcaption]:text-paper-100/70" : ""}
        />
      ))}
    </div>
  );
}

function AboutFeature({ feature }: { feature: FeatureWithMedia }) {
  return (
    <section id="about" className="py-16 md:py-24 bg-paper-100">
      <div className="max-w-6xl mx-auto px-5 md:px-8 grid grid-cols-1 md:grid-cols-[0.8fr_1.2fr] gap-10 md:gap-16">
        <div>
          <p className="text-[var(--theme-primary)] font-semibold text-sm mb-3">About</p>
          <h2 className="font-display text-3xl md:text-4xl text-navy-900 leading-tight">
            {feature.title}
          </h2>
          {feature.subtitle && (
            <p className="mt-3 text-ink-600 leading-relaxed">{feature.subtitle}</p>
          )}
        </div>

        <div className="space-y-5 text-ink-600 leading-relaxed max-w-2xl">
          {feature.body_markdown && (
            <ReactMarkdown components={proseComponents}>{feature.body_markdown}</ReactMarkdown>
          )}
          <MediaGrid media={feature.feature_media} />
        </div>
      </div>
    </section>
  );
}

function PublicLifeFeature({ feature, galleryIntervalMs }: { feature: FeatureWithMedia; galleryIntervalMs?: number }) {
  return (
    <section
      id="public-life"
      className="py-16 md:py-24 bg-paper-100 border-y border-line"
    >
      <div className="max-w-6xl mx-auto px-5 md:px-8">
        <div className="max-w-2xl mb-10">
          <p className="text-[var(--theme-primary)] font-semibold text-sm mb-3">Image Gallery</p>
          <h2 className="font-display text-3xl md:text-4xl text-navy-900 leading-tight">
            {feature.title}
          </h2>
          {feature.subtitle && (
            <p className="mt-3 text-ink-600 leading-relaxed">{feature.subtitle}</p>
          )}
          {feature.body_markdown && (
            <div className="mt-4 text-ink-600 leading-relaxed">
              <ReactMarkdown components={proseComponents}>{feature.body_markdown}</ReactMarkdown>
            </div>
          )}
        </div>

        <PublicLifeGallery media={feature.feature_media} intervalMs={galleryIntervalMs} />
      </div>
    </section>
  );
}

function StatsFeature({ feature }: { feature: FeatureWithMedia }) {
  return (
    <section className="py-16 md:py-24 bg-paper-100">
      <div className="max-w-6xl mx-auto px-5 md:px-8">
        {(feature.title || feature.subtitle) && (
          <div className="mb-10 max-w-2xl">
            {feature.title && (
              <h2 className="font-display text-3xl md:text-4xl text-navy-900 leading-tight">
                {feature.title}
              </h2>
            )}
            {feature.subtitle && (
              <p className="mt-3 text-ink-600 leading-relaxed">{feature.subtitle}</p>
            )}
          </div>
        )}

        {feature.body_markdown && (
          <ReactMarkdown components={statComponents}>{feature.body_markdown}</ReactMarkdown>
        )}
      </div>
    </section>
  );
}

function CustomFeature({ feature }: { feature: FeatureWithMedia }) {
  return (
    <section id={`feature-${feature.id}`} className="py-16 md:py-24 bg-[var(--theme-secondary)]">
      <div className="max-w-6xl mx-auto px-5 md:px-8">
        <div className="max-w-xl mb-10">
          {feature.subtitle && (
            <p className="text-[var(--theme-primary)] font-semibold text-sm mb-3">{feature.subtitle}</p>
          )}
          <h2 className="font-display text-3xl md:text-4xl text-white leading-tight">
            {feature.title}
          </h2>
        </div>

        {feature.body_markdown && (
          <div className="text-paper-100/80 leading-relaxed max-w-2xl">
            <ReactMarkdown components={proseComponents}>{feature.body_markdown}</ReactMarkdown>
          </div>
        )}

        <MediaGrid media={feature.feature_media} dark />
      </div>
    </section>
  );
}

export default function FeatureSection({
  feature,
  galleryIntervalMs,
}: {
  feature: FeatureWithMedia;
  galleryIntervalMs?: number;
}) {
  switch (feature.type) {
    case "about":
      return <AboutFeature feature={feature} />;
    case "public_life_gallery":
      return <PublicLifeFeature feature={feature} galleryIntervalMs={galleryIntervalMs} />;
    case "stats":
      return <StatsFeature feature={feature} />;
    case "custom_section":
      return <CustomFeature feature={feature} />;
    default:
      return null;
  }
}

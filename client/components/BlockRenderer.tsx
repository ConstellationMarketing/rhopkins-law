import type { ContentBlock } from "@site/lib/blocks";
import StructuredPagePreview from "@site/components/StructuredPagePreview";
import HeroBlock from "@site/components/blocks/HeroBlock";
import HeadingBlock from "@site/components/blocks/HeadingBlock";
import ContentSectionBlock from "@site/components/blocks/ContentSectionBlock";
import CTABlock from "@site/components/blocks/CTABlock";
import TeamMembersBlock from "@site/components/blocks/TeamMembersBlock";
import TestimonialsBlock from "@site/components/blocks/TestimonialsBlock";
import ContactSectionBlock from "@site/components/blocks/ContactSectionBlock";
import MapBlock from "@site/components/blocks/MapBlock";
import PracticeAreasGridBlock from "@site/components/blocks/PracticeAreasGridBlock";
import RecentPostsBlock from "@site/components/blocks/RecentPostsBlock";
import LegacyBlock from "@site/components/blocks/LegacyBlock";

interface BlockRendererProps {
  content: ContentBlock[];
  isPreview?: boolean;
  publishedAt?: string | null;
  showPublishedDate?: boolean | null;
}

export default function BlockRenderer({
  content,
  isPreview = false,
  publishedAt,
  showPublishedDate,
}: BlockRendererProps) {
  if (!content) {
    return (
      <div className="p-8 text-center text-gray-500">
        <p>No content available</p>
      </div>
    );
  }

  // Structured page content (objects with hero, features, etc.) — not a block array
  if (!Array.isArray(content) && typeof content === "object") {
    return <StructuredPagePreview content={content} />;
  }

  if (!Array.isArray(content)) {
    return (
      <div className="p-8 text-center text-gray-500">
        <p>No content available</p>
      </div>
    );
  }

  // Calculate the index among content-section blocks only
  let contentSectionIndex = -1;

  return (
    <div>
      {content.map((block, index) => {
        if (block.type === "content-section") {
          contentSectionIndex++;
        }
        return (
          <RenderBlock
            key={index}
            block={block}
            index={index}
            contentSectionIndex={block.type === "content-section" ? contentSectionIndex : -1}
            isPreview={isPreview}
            publishedAt={publishedAt}
            showPublishedDate={showPublishedDate}
          />
        );
      })}
    </div>
  );
}

function RenderBlock({
  block,
  index,
  contentSectionIndex,
  isPreview,
  publishedAt,
  showPublishedDate,
}: {
  block: ContentBlock;
  index: number;
  contentSectionIndex: number;
  isPreview: boolean;
  publishedAt?: string | null;
  showPublishedDate?: boolean | null;
}) {
  switch (block.type) {
    case "hero":
      return <HeroBlock block={block} />;
    case "heading":
      return <HeadingBlock block={block} />;
    case "content-section":
      return (
        <ContentSectionBlock
          block={block}
          index={index}
          publishedAt={publishedAt}
          showPublishedDate={contentSectionIndex === 0 ? showPublishedDate : false}
        />
      );
    case "cta":
      return <CTABlock block={block} />;
    case "team-members":
      return <TeamMembersBlock block={block} />;
    case "testimonials":
      return <TestimonialsBlock block={block} />;
    case "contact-section":
      return <ContactSectionBlock block={block} />;
    case "map":
      return <MapBlock block={block} />;
    case "practice-areas-grid":
      return <PracticeAreasGridBlock block={block} />;
    case "recent-posts":
      return <RecentPostsBlock block={block} />;
    default:
      return <LegacyBlock block={block} />;
  }
}

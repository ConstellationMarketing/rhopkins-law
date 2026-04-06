import { useState } from "react";
import { MapPinned } from "lucide-react";
import type { ContentBlock } from "@site/lib/blocks";
import RichText from "@site/components/shared/RichText";

interface MapBlockProps {
  block: Extract<ContentBlock, { type: "map" }>;
}

export default function MapBlock({ block }: MapBlockProps) {
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  return (
    <div className="bg-white py-[40px] md:py-[60px]">
      <div className="max-w-[2560px] mx-auto w-[95%] md:w-[90%] lg:w-[85%]">
        {(block.heading || block.subtext) && (
          <div className="text-center mb-[20px] md:mb-[30px]">
            {block.heading && (
              <h2 className="font-playfair text-[32px] md:text-[48px] lg:text-[54px] leading-tight md:leading-[54px] text-black pb-[10px]">
                {block.heading}
              </h2>
            )}
            {block.subtext && (
              <RichText
                html={block.subtext}
                className="font-outfit text-[16px] md:text-[20px] leading-[24px] md:leading-[30px] text-black/80"
              />
            )}
          </div>
        )}

        <div className="w-full h-[400px] md:h-[500px]">
          {block.mapEmbedUrl && isMapLoaded ? (
            <iframe
              src={block.mapEmbedUrl}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="eager"
              referrerPolicy="no-referrer-when-downgrade"
              title="Location Map"
            />
          ) : (
            <button
              type="button"
              onClick={() => setIsMapLoaded(true)}
              className="w-full h-full border border-black/10 bg-slate-50 flex flex-col items-center justify-center gap-4 text-center px-6"
            >
              <span className="flex items-center justify-center w-[64px] h-[64px] rounded-full bg-brand-accent text-white">
                <MapPinned className="w-8 h-8" strokeWidth={1.5} />
              </span>
              <span className="font-playfair text-[28px] md:text-[36px] leading-tight text-black">Load Map</span>
              <span className="font-outfit text-[16px] md:text-[18px] text-black/70 max-w-[520px]">
                Load the interactive map on demand to reduce page weight.
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

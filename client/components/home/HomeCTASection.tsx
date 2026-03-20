import type { HomeCTAContent } from "@site/lib/cms/homePageTypes";
import { useGlobalPhone } from "@site/contexts/SiteSettingsContext";
import CallBox from "@site/components/shared/CallBox";
import RichText from "@site/components/shared/RichText";
import { Phone, Calendar } from "lucide-react";

interface HomeCTASectionProps {
  content: HomeCTAContent;
}

export default function HomeCTASection({ content }: HomeCTASectionProps) {
  const { phoneNumber, phoneDisplay, phoneLabel } = useGlobalPhone();

  if (!content.heading) return null;

  return (
    <div className="py-[40px] md:py-[60px]" style={{ backgroundColor: "#365D96" }}>
      <div className="max-w-[2560px] mx-auto w-[95%] md:w-[90%] lg:w-[80%]">
        <div className="text-center mb-[30px] md:mb-[40px]">
          <h2 className="font-playfair text-[36px] md:text-[48px] lg:text-[60px] leading-tight text-white pb-[15px]">
            {content.heading}
          </h2>
          <RichText
            html={content.description}
            className="font-outfit text-[18px] md:text-[22px] leading-[26px] md:leading-[32px] text-white/80"
          />
        </div>

        <div className="flex flex-col md:flex-row gap-6 md:gap-8 justify-center items-center md:items-start">
          <CallBox
            icon={Phone}
            title={phoneLabel}
            subtitle={phoneDisplay}
            phone={phoneNumber}
            className="bg-transparent"
            variant="dark"
          />
          <CallBox
            icon={Calendar}
            title={content.secondaryButton.label}
            subtitle={content.secondaryButton.sublabel}
            link={content.secondaryButton.link}
            className="bg-brand-accent hover:bg-brand-accent-dark"
            variant="dark"
            accentIcon
          />
        </div>
      </div>
    </div>
  );
}

import { Phone } from "lucide-react";
import { useGlobalPhone } from "@site/contexts/SiteSettingsContext";

export default function Hero() {
  const { phoneDisplay, phoneLabel, phoneNumber } = useGlobalPhone();

  return (
    <div className="max-w-[2560px] mx-auto w-[95%] py-[27px] my-[40px]">
      <div className="flex flex-col lg:flex-row lg:items-center gap-8 lg:gap-[3%]">
        {/* Headline Section */}
        <div className="lg:w-[65.667%]">
          <div className="mb-[40px]">
            <div className="relative">
              <p className="font-playfair text-[clamp(2rem,5vw,68.8px)] font-light leading-[1.2] text-white text-left">
                {phoneLabel}
              </p>
            </div>
          </div>

          {/* Call Box */}
          <a
            href={`tel:${phoneNumber.replace(/\D/g, "")}`}
            className="p-[8px] w-full max-w-[400px] cursor-pointer block"
          >
            <div className="flex items-start gap-4">
              <span
                className="flex items-center justify-center w-[44px] h-[44px] rounded-full flex-shrink-0 mt-1"
                style={{ backgroundColor: "#A1134C" }}
              >
                <Phone className="w-[22px] h-[22px] text-white" strokeWidth={1.5} />
              </span>
              <div className="flex-1">
                <h4 className="font-outfit text-[18px] leading-[18px] text-white pb-[10px] font-normal">
                  {phoneLabel}
                </h4>
                <p className="font-outfit text-[clamp(1.5rem,4vw,40px)] text-white leading-tight">
                  {phoneDisplay}
                </p>
              </div>
            </div>
          </a>
        </div>

        {/* Spacer for form (will be added separately) */}
        <div className="lg:w-[31.3333%]"></div>
      </div>
    </div>
  );
}

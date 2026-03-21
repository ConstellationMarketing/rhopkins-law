import type { PracticeAreaItem } from "@site/lib/cms/homePageTypes";
import PracticeAreaCard from "@site/components/practice/PracticeAreaCard";

interface PracticeAreasGridProps {
  areas?: PracticeAreaItem[];
}

export default function PracticeAreasGrid({ areas }: PracticeAreasGridProps) {
  if (!areas || areas.length === 0) {
    return null;
  }

  return (
    <div
      className="pb-[40px] md:pb-[60px]"
      style={{
        background: "linear-gradient(to bottom, #EFF0EB 10%, white 10%)",
      }}
    >
      <div className="max-w-[2560px] mx-auto w-[95%] md:w-[90%] lg:w-[85%]">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {areas.map((area, index) => (
            <PracticeAreaCard
              key={index}
              title={area.title}
              description={area.description}
              image={area.image}
              imageAlt={area.imageAlt}
              link={area.link}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

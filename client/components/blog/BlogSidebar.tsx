import { useEffect, useState } from "react";
import { Phone, Calendar } from "lucide-react";
import CallBox from "@site/components/shared/CallBox";
import { useGlobalPhone } from "@site/contexts/SiteSettingsContext";

interface AwardImage {
  src: string;
  alt: string;
}


export default function BlogSidebar() {
  const { phoneDisplay, phoneNumber, phoneLabel } = useGlobalPhone();
  const [attorneyImage, setAttorneyImage] = useState("");
  const [awardImages, setAwardImages] = useState<AwardImage[]>([]);

  useEffect(() => {
    fetchSidebarSettings();
  }, []);

  const fetchSidebarSettings = async () => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) return;

    try {
      const res = await fetch(
        `${supabaseUrl}/rest/v1/blog_sidebar_settings?select=attorney_image,award_images&limit=1`,
        {
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
          },
        },
      );

      if (!res.ok) return;

      const rows = await res.json();
      if (!Array.isArray(rows) || rows.length === 0) return;

      const settings = rows[0];

      if (settings.attorney_image) {
        setAttorneyImage(settings.attorney_image);
      }

      if (Array.isArray(settings.award_images)) {
        setAwardImages(settings.award_images);
      }
    } catch (err) {
      console.error("Error fetching sidebar settings:", err);
    }
  };

  return (
    <aside className="space-y-6">
      {/* Attorney Photo */}
      {attorneyImage && (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
          <img
            src={attorneyImage}
            alt="Attorney"
            className="w-full h-auto object-cover"
            width={400}
            height={500}
          />
        </div>
      )}

      {/* Phone CTA */}
      <CallBox
        icon={Phone}
        title={phoneLabel}
        subtitle={phoneDisplay}
        phone={phoneNumber}
        className="w-full md:w-full"
      />

      {/* Consultation CTA */}
      <CallBox
        icon={Calendar}
        title="Schedule Today"
        subtitle="Book a Consultation"
        link="/contact/"
        className="w-full md:w-full"
      />

      {/* Awards */}
      {awardImages.length > 0 && (
        <div className="space-y-4 pt-2">
          <h3
            className="text-lg font-semibold text-gray-900"
            style={{ fontFamily: "Playfair Display, serif" }}
          >
            Awards & Recognition
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {awardImages.map((award, index) => (
              <div
                key={award.src || index}
                className="bg-white border border-gray-100 rounded-md p-3 flex items-center justify-center"
              >
                <img
                  src={award.src}
                  alt={award.alt}
                  className="max-h-20 w-auto object-contain"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}

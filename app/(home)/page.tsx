import { HeroSpotlight } from "@/components/HeroSpotlight";
import { IntroBridge } from "@/components/IntroBridge";
import { SectionProof } from "@/components/SectionProof";
import { SectionProjects } from "@/components/SectionProjects";
import { SectionPlayground } from "@/components/SectionPlayground";
import { SectionSkills } from "@/components/SectionSkills";
import { SectionNow } from "@/components/SectionNow";
import { SectionContact } from "@/components/SectionContact";

export default function HomePage() {
  return (
    <>
      <HeroSpotlight />
      <div className="home-rhythm">
        <IntroBridge />
        <SectionProof />
        <SectionProjects />
        <SectionPlayground />
        <SectionSkills />
        <SectionNow />
        <SectionContact />
      </div>
    </>
  );
}

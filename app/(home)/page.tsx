import { HeroSpotlight } from "@/components/HeroSpotlight";
import { IntroBridge } from "@/components/IntroBridge";
import { SectionProof } from "@/components/SectionProof";
import { SectionProjects } from "@/components/SectionProjects";
import { SectionSkills } from "@/components/SectionSkills";
import { SectionNow } from "@/components/SectionNow";
import { SectionContact } from "@/components/SectionContact";
import { Bend } from "@/components/canvasui/Bend";

export default function HomePage() {
  return (
    <>
      <HeroSpotlight />
      <div className="home-rhythm">
        <IntroBridge />
        <SectionProof />
        <Bend />
        <SectionProjects />
        <SectionSkills />
        <SectionNow />
        <SectionContact />
      </div>
    </>
  );
}

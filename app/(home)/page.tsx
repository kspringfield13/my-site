import { HeroSpotlight } from "@/components/HeroSpotlight";
import { IntroBridge } from "@/components/IntroBridge";
import { SectionProof } from "@/components/SectionProof";
import { SectionProjects } from "@/components/SectionProjects";
import { SectionSkills } from "@/components/SectionSkills";
import { SectionNow } from "@/components/SectionNow";
import { SectionContact } from "@/components/SectionContact";
import { ParticleScrollStage } from "@/components/canvasui/ParticleScrollStage";

export default function HomePage() {
  return (
    <>
      <HeroSpotlight />
      <ParticleScrollStage>
        <div className="home-rhythm">
          <IntroBridge />
          <SectionProof />
          <SectionProjects />
          <SectionSkills />
          <SectionNow />
          <SectionContact />
        </div>
      </ParticleScrollStage>
    </>
  );
}

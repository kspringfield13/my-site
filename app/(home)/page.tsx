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
      <div className="home-rhythm">
        <ParticleScrollStage>
          <IntroBridge />
          <SectionProof />
        </ParticleScrollStage>
        <SectionProjects />
        <SectionSkills />
        <SectionNow />
        <SectionContact />
      </div>
    </>
  );
}

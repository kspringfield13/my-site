import { HeroSpotlight } from "@/components/HeroSpotlight";
import { SectionProof } from "@/components/SectionProof";
import { SectionProjects } from "@/components/SectionProjects";
import { SectionSkills } from "@/components/SectionSkills";
import { SectionNow } from "@/components/SectionNow";
import { SectionContact } from "@/components/SectionContact";

export default function HomePage() {
  return (
    <>
      <HeroSpotlight />
      <SectionProof />
      <SectionProjects />
      <SectionSkills />
      <SectionNow />
      <SectionContact />
    </>
  );
}

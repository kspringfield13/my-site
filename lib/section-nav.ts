export function jumpToSection(sectionId: string) {
  if (typeof window === "undefined") return;

  const target = document.getElementById(sectionId);
  if (!target) return;

  target.scrollIntoView({ behavior: "smooth", block: "start" });
  target.classList.add("section-highlight");
  window.setTimeout(() => {
    target.classList.remove("section-highlight");
  }, 1400);
}

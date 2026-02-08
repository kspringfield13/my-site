import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { TerminalDock } from "@/components/TerminalDock";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main id="main" className="site-shell">
        {children}
      </main>
      <Footer />
      <TerminalDock />
    </>
  );
}

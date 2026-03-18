import Navbar from "./components/Navbar";
import HeroBadge from "./components/HeroBadge";
import HeroContent from "./components/HeroContent";
import HeroVisual from "./components/HeroVisual";
import GradientOrb from "./components/ui/GradientOrb";
import HowItWorks from "./components/HowItWorks";
import FeaturesGrid from "./components/FeaturesGrid";
import TestimonialsSection from "@/components/ui/testimonial-v2";
import Pricing from "./components/Pricing";
import FinalCTA from "./components/FinalCTA";
import Footer from "./components/Footer";
import { LeadFormProvider } from "./contexts/LeadFormContext";
import LeadForm from "./components/LeadForm";

export default function App() {
  return (
    <LeadFormProvider>
      <main className="bg-background">
        <Navbar />

      {/* Hero */}
      <section className="relative flex flex-col items-center px-4 pt-28 sm:pt-32 pb-8 overflow-hidden">
        <GradientOrb />
        <div className="relative z-10 flex flex-col items-center w-full">
          <HeroBadge />
          <div className="mt-6">
            <HeroContent />
          </div>
        </div>
      </section>

      <HeroVisual />

      <HowItWorks />

      <FeaturesGrid />

      <TestimonialsSection />

      <Pricing />

      <FinalCTA />

      <Footer />
      <LeadForm />
    </main>
    </LeadFormProvider>
  );
}

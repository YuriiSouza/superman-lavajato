import { Hero } from "@/components/Hero";
import { ServicesPreview } from "@/components/ServicesPreview";
import { About } from "@/components/About";
import { Testimonials } from "@/components/Testimonials";
import { Location } from "@/components/Location";

export default function HomePage() {
  return (
    <>
      <Hero />
      <ServicesPreview />
      <About />
      <Testimonials />
      <Location />
    </>
  );
}

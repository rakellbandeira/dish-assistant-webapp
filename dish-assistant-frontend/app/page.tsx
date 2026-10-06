import SiteHeader from "@/components/layouts/SiteHeader";
import SiteFooter from "@/components/layouts/SiteFooter";
import MenuRecommender from "@/components/menu/MenuRecommender";
import LikedDishesSection from "@/components/dishes/LikedDishesSection";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-neutral font-body">
      <SiteHeader/>

      <main className="flex flex-1 flex-col items-center px-6 py-16 sm:px-8 sm:py-20">
        <h1 className="text-center font-heading text-4xl font-bold text-error sm:text-6xl">
          Find your next favorite dish
        </h1>

        <p className="mt-4 mb-10 max-w-md text-center text-base text-secondary">
          Paste a restaurant&apos;s menu and we&apos;ll suggest dishes you&apos;ll love, plus a few new ones worth trying.
        </p>

        <MenuRecommender />

        <div className="mt-14 flex w-full justify-center">
          <LikedDishesSection />
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

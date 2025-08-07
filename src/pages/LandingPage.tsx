import { Button } from "@/components/ui/button";
import { TrendingUp, Users, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import FeatureCard from "@/components/ui/FeatureCard";
import TestimonialCard from "@/components/ui/TestimonialCard";

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation currentPage="landing" />
      {/* Hero Section */}
      <section className="relative bg-gradient-primary text-white py-20 px-4">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center mb-6">
            <img
              src="/myshopke.png"
              alt="MyShopKE - Agricultural Marketplace"
              className="h-50 md:h-60 w-auto"
            />
          </div>
          <p className="text-xl md:text-2xl mb-8 text-white/90 max-w-3xl mx-auto">
            Empowering Kenyan farmers with smart crop recommendations and direct
            market access
          </p>
          <p className="text-lg mb-10 text-white/80 max-w-2xl mx-auto">
            Make informed farming decisions with AI-powered demand forecasting
            and connect directly with buyers through our marketplace
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              asChild
              size="lg"
              variant="secondary"
              className="text-lg px-8 py-3"
            >
              <Link to="/forecast" className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Get Crop Recommendations
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="text-lg px-8 py-3 border-white hover:bg-white text-primary"
            >
              <Link to="/marketplace" className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Browse Marketplace
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">
              Everything You Need to Succeed
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Our platform combines smart technology with local market knowledge
              to help farmers make better decisions
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <FeatureCard
              icon={<TrendingUp className="h-6 w-6 text-primary" />}
              title="Smart Demand Forecasting"
              description="Get personalized crop recommendations based on your location, land size, and planting season"
              features={[
                "AI-powered market demand analysis",
                "Region-specific crop suggestions",
                "Expected yield and profit estimates",
                "Seasonal planting guidance",
              ]}
              ctaText="Try Demand Forecast"
              ctaLink="/forecast"
            />

            <FeatureCard
              icon={<Users className="h-6 w-6 text-primary" />}
              title="Direct Marketplace"
              description="Connect directly with buyers and sell your produce without middlemen"
              features={[
                "List your produce for free",
                "Direct contact with restaurants & buyers",
                "No commission fees",
                "WhatsApp & phone integration",
              ]}
              ctaText="Browse Marketplace"
              ctaLink="/marketplace"
            />
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">
              How MyShopKE Works
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Simple steps to smarter farming and better sales
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-white">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">
                Get Recommendations
              </h3>
              <p className="text-muted-foreground">
                Enter your location, land size, and planting season to receive
                personalized crop recommendations
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-white">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Plant & Grow</h3>
              <p className="text-muted-foreground">
                Follow our guidance to plant the right crops at the right time
                for maximum market demand
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-white">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Sell Direct</h3>
              <p className="text-muted-foreground">
                List your harvest on our marketplace and connect directly with
                buyers for better prices
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">
              Success Stories from Our Community
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              See how MyShopKE is helping farmers and buyers across Kenya
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            <TestimonialCard
              name="Grace Wanjiku"
              role="farmer"
              location="Kiambu County"
              quote="MyShopKE helped me switch to growing kale and tomatoes. My income increased by 40% in just one season!"
            />

            <TestimonialCard
              name="David Kimani"
              role="buyer"
              location="Nairobi"
              quote="I can now source fresh vegetables directly from farmers. The quality is better and prices are fair for everyone."
            />

            <TestimonialCard
              name="Mary Chebet"
              role="farmer"
              location="Uasin Gishu County"
              quote="The demand forecast tool showed me when to plant maize for the best prices. I sold my entire harvest before others even started harvesting."
            />

            <TestimonialCard
              name="James Ochieng"
              role="buyer"
              location="Kisumu"
              quote="Finding reliable farmers was always a challenge. MyShopKE marketplace connects me directly with quality produce suppliers."
            />

            <TestimonialCard
              name="Sarah Muthoni"
              role="farmer"
              location="Meru County"
              quote="I used to struggle with what crops to plant. Now I make informed decisions and my farm is more profitable than ever."
            />

            <TestimonialCard
              name="Peter Njoroge"
              role="buyer"
              location="Nakuru"
              quote="The direct contact feature is amazing. I can call farmers directly and negotiate fair prices without middlemen taking cuts."
            />
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 px-4 bg-primary text-white">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Transform Your Farming?
          </h2>
          <p className="text-xl mb-8 text-white/90 max-w-2xl mx-auto">
            Join thousands of Kenyan farmers who are already using MyShopKE to
            make smarter decisions and increase their profits
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              asChild
              size="lg"
              variant="secondary"
              className="text-lg px-8 py-3"
            >
              <Link to="/forecast" className="flex items-center gap-2">
                Start with Crop Forecast
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="text-lg px-8 py-3 border-white hover:bg-white text-primary"
            >
              <Link to="/marketplace" className="flex items-center gap-2">
                Explore Marketplace
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;

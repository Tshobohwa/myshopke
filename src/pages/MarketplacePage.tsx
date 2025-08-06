import Marketplace from "@/components/Marketplace";
import Navigation from "@/components/Navigation";

const MarketplacePage = () => {
    return (
        <div className="min-h-screen bg-background">
            <Navigation currentPage="marketplace" />
            <Marketplace />
        </div>
    );
};

export default MarketplacePage;
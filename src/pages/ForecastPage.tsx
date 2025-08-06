import DemandForecast from "@/components/DemandForecast";
import Navigation from "@/components/Navigation";

const ForecastPage = () => {
    return (
        <div className="min-h-screen bg-background">
            <Navigation currentPage="forecast" />
            <DemandForecast />
        </div>
    );
};

export default ForecastPage;
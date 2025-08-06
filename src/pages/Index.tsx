import { useState } from "react";
import Header from "@/components/Header";
import DemandForecast from "@/components/DemandForecast";
import Marketplace from "@/components/Marketplace";

const Index = () => {
  const [activeTab, setActiveTab] = useState('forecast');

  return (
    <div className="min-h-screen bg-background">
      <Header activeTab={activeTab} onTabChange={setActiveTab} />
      
      <main>
        {activeTab === 'forecast' ? (
          <DemandForecast />
        ) : (
          <Marketplace />
        )}
      </main>
    </div>
  );
};

export default Index;
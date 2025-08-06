import AuthButton from "./AuthButton";

interface HeaderProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const Header = ({ activeTab, onTabChange }: HeaderProps) => {
  return (
    <header className="bg-card border-b shadow-soft">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <img
              src="/myshopkesmall.png"
              alt="MyShopKE - Agricultural Marketplace"
              className="h-36 w-auto"
            />
          </div>
          <AuthButton />
        </div>

        <nav className="mt-4">
          <div className="flex space-x-1 bg-muted rounded-lg p-1">
            <button
              onClick={() => onTabChange("forecast")}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${activeTab === "forecast"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
                }`}
            >
              Demand Forecast
            </button>
            <button
              onClick={() => onTabChange("marketplace")}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${activeTab === "marketplace"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
                }`}
            >
              Marketplace
            </button>
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Header;

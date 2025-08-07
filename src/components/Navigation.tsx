import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Home, TrendingUp, Users } from "lucide-react";
import AuthButton from "./AuthButton";

interface NavigationProps {
  currentPage?: "landing" | "forecast" | "marketplace";
}

const Navigation = ({ currentPage }: NavigationProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { path: "/", label: "Home", icon: Home },
    { path: "/forecast", label: "Demand Forecast", icon: TrendingUp },
    { path: "/marketplace", label: "Marketplace", icon: Users },
  ];

  const isActive = (path: string) => location.pathname === path;

  const NavLinks = ({ mobile = false }: { mobile?: boolean }) => (
    <>
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.path}
            to={item.path}
            onClick={() => mobile && setIsOpen(false)}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive(item.path)
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
              } ${mobile ? "w-full justify-start" : ""}`}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-24 md:h-28 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <img
              src="/myshopke.png"
              alt="MyShopKE - Agricultural Marketplace"
              className="h-16 w-auto transform scale-[1.95] origin-left"
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            <nav className="flex items-center space-x-1">
              <NavLinks />
            </nav>
            <AuthButton />
          </div>

          {/* Mobile Navigation */}
          <div className="flex md:hidden items-center space-x-2">
            <AuthButton />
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <div className="flex flex-col space-y-4 mt-8">
                  <div className="flex items-center mb-6">
                    <img
                      src="/myshopke.png"
                      alt="MyShopKE - Agricultural Marketplace"
                      className="h-12 w-auto transform scale-[1.95] origin-left"
                    />
                  </div>
                  <nav className="flex flex-col space-y-2">
                    <NavLinks mobile />
                  </nav>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Breadcrumb Navigation */}
        {location.pathname !== "/" && (
          <div className="flex items-center space-x-2 py-2 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-foreground">
              Home
            </Link>
            <span>/</span>
            <span className="text-foreground">
              {navItems.find((item) => item.path === location.pathname)
                ?.label || "Page"}
            </span>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navigation;

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TrendingUp, MapPin, Calendar, Ruler, AlertCircle, Leaf, DollarSign, BarChart3 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useApi } from "@/hooks/use-api";
import { forecastApi, publicApi, preferencesApi } from "@/lib/api";
import { kenyanLocations, seasons, enhancedRecommendations, EnhancedCropRecommendation } from "@/data/mockData";
import heroFarmland from "@/assets/hero-farmland.jpg";
import demandForecast from "@/assets/demand-forecast.jpg";

const DemandForecast = () => {
  const { user, isAuthenticated } = useAuth();
  const [location, setLocation] = useState("");
  const [landSize, setLandSize] = useState("");
  const [landUnit, setLandUnit] = useState("acres");
  const [season, setSeason] = useState("");
  const [recommendations, setRecommendations] = useState<EnhancedCropRecommendation[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [locations, setLocations] = useState(kenyanLocations);

  // API hooks
  const forecastRequest = useApi(forecastApi.getCropRecommendations);
  const userRecommendationsRequest = useApi(forecastApi.getUserRecommendations);
  const locationsRequest = useApi(publicApi.getLocations);
  const savePreferencesRequest = useApi(preferencesApi.savePreferences);

  // Load locations and user preferences on mount
  useEffect(() => {
    const loadInitialData = async () => {
      // Load locations from API
      try {
        const locationsData = await locationsRequest.execute();
        if (locationsData) {
          setLocations(locationsData);
        }
      } catch (error) {
        // Fallback to mock data if API fails
        console.warn('Failed to load locations from API, using mock data');
      }

      // Load user recommendations if authenticated
      if (isAuthenticated && user?.role === 'FARMER') {
        try {
          const userRecs = await userRecommendationsRequest.execute();
          if (userRecs && userRecs.length > 0) {
            setRecommendations(userRecs);
            setShowResults(true);
          }
        } catch (error) {
          console.warn('Failed to load user recommendations');
        }

        // Pre-fill user's location if available
        if (user.profile?.location) {
          setLocation(user.profile.location);
        }
      }
    };

    loadInitialData();
  }, [isAuthenticated, user]);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!location) {
      newErrors.location = "Please select your location";
    }
    if (!landSize || parseFloat(landSize) <= 0) {
      newErrors.landSize = "Please enter a valid land size";
    }
    if (!season) {
      newErrors.season = "Please select a planting season";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setErrors({});

    try {
      // Call backend API for crop recommendations
      const recommendationsData = await forecastRequest.execute({
        location,
        landSize: parseFloat(landSize),
        landUnit,
        season,
      });

      if (recommendationsData) {
        setRecommendations(recommendationsData);
        setShowResults(true);

        // Save user preferences if authenticated
        if (isAuthenticated) {
          try {
            await savePreferencesRequest.execute({
              searchFilters: {
                location,
                landSize: parseFloat(landSize),
                landUnit,
                season,
                lastSearchDate: new Date().toISOString(),
              },
            });
          } catch (error) {
            console.warn('Failed to save preferences:', error);
          }
        }
      } else {
        // Fallback to mock data if API fails
        console.warn('API failed, using mock data');
        const recs = enhancedRecommendations[location] || enhancedRecommendations["default"];
        setRecommendations(recs);
        setShowResults(true);
      }
    } catch (error) {
      console.error('Error getting recommendations:', error);
      // Fallback to mock data
      const recs = enhancedRecommendations[location] || enhancedRecommendations["default"];
      setRecommendations(recs);
      setShowResults(true);
    }
  };

  const getProfitColor = (potential: string) => {
    switch (potential) {
      case 'high': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-red-600';
      default: return 'text-muted-foreground';
    }
  };

  const getProfitIcon = (potential: string) => {
    switch (potential) {
      case 'high': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'medium': return <BarChart3 className="h-4 w-4 text-yellow-600" />;
      case 'low': return <DollarSign className="h-4 w-4 text-red-600" />;
      default: return <BarChart3 className="h-4 w-4" />;
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Hero Section */}
      <div className="relative rounded-xl overflow-hidden">
        <img
          src={heroFarmland}
          alt="Kenyan farmland"
          className="w-full h-48 object-cover"
        />
        <div className="absolute inset-0 bg-gradient-primary opacity-80"></div>
        <div className="absolute inset-0 flex items-center justify-center text-center">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">Smart Crop Recommendations</h2>
            <p className="text-white/90">Get data-driven insights for your farming decisions</p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Form */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Demand Forecast Tool
            </CardTitle>
            <CardDescription>
              Enter your farming details to get personalized crop recommendations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="location" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Location
                </Label>
                <Select value={location} onValueChange={setLocation}>
                  <SelectTrigger className={errors.location ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select your county" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((loc) => (
                      <SelectItem key={loc.name || loc.county} value={loc.name || loc.county}>
                        {loc.name || loc.county}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.location && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{errors.location}</AlertDescription>
                  </Alert>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="landSize" className="flex items-center gap-2">
                  <Ruler className="h-4 w-4" />
                  Land Size
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="landSize"
                    type="number"
                    placeholder="e.g., 2.5"
                    value={landSize}
                    onChange={(e) => setLandSize(e.target.value)}
                    step="0.1"
                    min="0.1"
                    className={`flex-1 ${errors.landSize ? "border-red-500" : ""}`}
                  />
                  <Select value={landUnit} onValueChange={setLandUnit}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="acres">Acres</SelectItem>
                      <SelectItem value="hectares">Hectares</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {errors.landSize && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{errors.landSize}</AlertDescription>
                  </Alert>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="season" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Planting Season
                </Label>
                <Select value={season} onValueChange={setSeason}>
                  <SelectTrigger className={errors.season ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select planting season" />
                  </SelectTrigger>
                  <SelectContent>
                    {seasons.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.name}
                        <span className="block text-xs text-muted-foreground mt-1">
                          {s.description}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.season && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{errors.season}</AlertDescription>
                  </Alert>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={forecastRequest.loading}>
                {forecastRequest.loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Analyzing Market Data...
                  </>
                ) : (
                  "Get Crop Recommendations"
                )}
              </Button>

              {forecastRequest.error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{forecastRequest.error}</AlertDescription>
                </Alert>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Results */}
        <div className="space-y-4">
          {!showResults ? (
            <Card className="shadow-soft">
              <CardContent className="pt-6">
                <div className="text-center">
                  <img
                    src={demandForecast}
                    alt="Demand forecast"
                    className="w-full max-w-sm mx-auto mb-4 rounded-lg"
                  />
                  <p className="text-muted-foreground">
                    Fill out the form to see your personalized crop recommendations
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-primary">Top 3 Crop Recommendations</h3>
                <div className="text-sm text-muted-foreground">
                  For {landSize} {landUnit} in {location}
                </div>
              </div>
              {recommendations.map((rec, index) => (
                <Card key={index} className="shadow-soft">
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <Leaf className="h-5 w-5 text-primary" />
                        <h4 className="font-semibold text-lg">{rec.crop}</h4>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-success">
                          {rec.demandScore}% Demand Score
                        </div>
                        <div className="text-sm text-muted-foreground">{rec.priceRange}</div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground">{rec.reason}</p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2">
                          <BarChart3 className="h-4 w-4 text-muted-foreground" />
                          <span>Expected Yield: {rec.expectedYield}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {getProfitIcon(rec.profitPotential)}
                          <span className={getProfitColor(rec.profitPotential)}>
                            {rec.profitPotential.charAt(0).toUpperCase() + rec.profitPotential.slice(1)} Profit Potential
                          </span>
                        </div>
                      </div>

                      <div className="bg-muted/50 p-3 rounded-lg">
                        <p className="text-sm font-medium mb-1">Market Demand:</p>
                        <p className="text-sm text-muted-foreground">{rec.marketDemand}</p>
                      </div>

                      <div className="bg-blue-50 p-3 rounded-lg">
                        <p className="text-sm font-medium mb-1 text-blue-800">Seasonal Advice:</p>
                        <p className="text-sm text-blue-700">{rec.seasonalAdvice}</p>
                      </div>
                    </div>

                    <div className="mt-3">
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-gradient-primary h-2 rounded-full transition-all duration-1000"
                          style={{ width: `${rec.demandScore}%` }}
                        ></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DemandForecast;
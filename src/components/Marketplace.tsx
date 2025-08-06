import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Phone, MessageSquare, MapPin, Calendar, Package, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useApi } from "@/hooks/use-api";
import { marketplaceApi, farmerApi, publicApi, preferencesApi } from "@/lib/api";
import { kenyanLocations, cropDatabase, sampleListings, EnhancedListing } from "@/data/mockData";
import freshProduce from "@/assets/fresh-produce.jpg";

const Marketplace = () => {
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const [listings, setListings] = useState<EnhancedListing[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState("all-counties");
  const [cropFilter, setCropFilter] = useState("all-crops");
  const [statusFilter, setStatusFilter] = useState("all-status");
  const [isAddingListing, setIsAddingListing] = useState(false);
  const [locations, setLocations] = useState(kenyanLocations);
  const [categories, setCategories] = useState(cropDatabase);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const hasInitialized = useRef(false);

  // API hooks
  const listingsRequest = useApi(marketplaceApi.getListings);
  const createListingRequest = useApi(farmerApi.createListing);
  const locationsRequest = useApi(publicApi.getLocations);
  const categoriesRequest = useApi(publicApi.getCategories);
  const saveInteractionRequest = useApi(preferencesApi.saveInteraction);

  // Form state for new listing
  const [newListing, setNewListing] = useState({
    crop: "",
    quantity: "",
    unit: "kg",
    location: "",
    specificArea: "",
    harvestDate: "",
    price: "",
    priceUnit: "KSh/kg",
    farmerName: "",
    phone: "",
    whatsapp: "",
    description: ""
  });

  const cropTypes = categories.map(crop => crop.name);
  const locationNames = locations.map(loc => loc.name);
  console.log(locations)
  console.log(locationNames)
  const units = ["kg", "bags (50kg)", "bags (90kg)", "tons", "pieces", "bunches", "crates"];
  const priceUnits = ["KSh/kg", "KSh/piece", "KSh/bunch", "KSh/bag", "KSh/crate"];

  // Load initial data - only run once on mount
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const loadInitialData = async () => {
      try {
        // Load locations
        const locationsData = await locationsRequest.execute();
        if (locationsData) {
          setLocations(locationsData);
        }

        // Load categories
        const categoriesData = await categoriesRequest.execute();
        if (categoriesData) {
          setCategories(categoriesData);
        }

        // Load initial listings
        const params: Record<string, string | number> = {
          page: 1,
          limit: 10,
        };

        const response = await listingsRequest.execute(params);
        if (response && typeof response === 'object' && 'listings' in response) {
          setListings(response.listings as EnhancedListing[]);
          setCurrentPage((response as { page?: number }).page || 1);
          setTotalPages((response as { totalPages?: number }).totalPages || 1);
        }
      } catch (error) {
        console.warn('Failed to load initial data, using fallback');
        setListings(sampleListings);
      }
    };

    loadInitialData();
  }, []); // Empty dependency array - only run once

  // // Reload listings when filters change
  // useEffect(() => {
  //   // Skip if this is the initial load
  //   if (!hasInitialized.current) return;

  //   const timeoutId = setTimeout(async () => {
  //     try {
  //       const params: Record<string, string | number> = {
  //         page: 1,
  //         limit: 10,
  //       };

  //       if (searchQuery) params.search = searchQuery;
  //       if (locationFilter !== "all-counties") params.location = locationFilter;
  //       if (cropFilter !== "all-crops") params.crop = cropFilter;
  //       if (statusFilter !== "all-status") params.status = statusFilter;

  //       const response = await listingsRequest.execute(params);
  //       if (response && typeof response === 'object' && 'listings' in response) {
  //         setListings(response.listings as EnhancedListing[]);
  //         setCurrentPage((response as { page?: number }).page || 1);
  //         setTotalPages((response as { totalPages?: number }).totalPages || 1);
  //       }
  //     } catch (error) {
  //       console.error('Failed to load listings:', error);
  //       // Fallback to sample data
  //       setListings(sampleListings);
  //     }
  //   }, 500); // Debounce search

  //   return () => clearTimeout(timeoutId);
  // }, [searchQuery, locationFilter, cropFilter, statusFilter, listingsRequest]);



  const handleAddListing = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated || user?.role !== 'FARMER') {
      toast({
        title: "Authentication Required",
        description: "Please log in as a farmer to add listings.",
        variant: "destructive",
      });
      return;
    }

    try {
      const listingData = {
        cropType: newListing.crop,
        quantity: parseFloat(newListing.quantity),
        unit: newListing.unit,
        pricePerUnit: parseFloat(newListing.price),
        harvestDate: newListing.harvestDate,
        location: newListing.location,
        description: newListing.description,
      };

      const response = await createListingRequest.execute(listingData);

      if (response) {
        // Reset form
        setNewListing({
          crop: "",
          quantity: "",
          unit: "kg",
          location: "",
          specificArea: "",
          harvestDate: "",
          price: "",
          priceUnit: "KSh/kg",
          farmerName: "",
          phone: "",
          whatsapp: "",
          description: ""
        });
        setIsAddingListing(false);

        // Reload listings to show the new one
        const params: Record<string, string | number> = {
          page: 1,
          limit: 10,
        };

        if (searchQuery) params.search = searchQuery;
        if (locationFilter !== "all-counties") params.location = locationFilter;
        if (cropFilter !== "all-crops") params.crop = cropFilter;
        if (statusFilter !== "all-status") params.status = statusFilter;

        const refreshResponse = await listingsRequest.execute(params);
        if (refreshResponse && typeof refreshResponse === 'object' && 'listings' in refreshResponse) {
          setListings(refreshResponse.listings as EnhancedListing[]);
          setCurrentPage((refreshResponse as { page?: number }).page || 1);
          setTotalPages((refreshResponse as { totalPages?: number }).totalPages || 1);
        }

        toast({
          title: "Listing Added",
          description: "Your produce listing has been added successfully!"
        });
      }
    } catch (error) {
      console.error('Failed to add listing:', error);
    }
  };

  const handleContact = async (type: 'phone' | 'whatsapp', phone: string, crop: string, farmerName: string, listingId: string) => {
    // Log interaction if user is authenticated
    if (isAuthenticated && user?.role === 'BUYER') {
      try {
        await saveInteractionRequest.execute({
          listingId,
          type: 'CONTACT',
          metadata: { contactType: type, crop, farmerName }
        });
      } catch (error) {
        console.warn('Failed to log interaction:', error);
      }
    }

    if (type === 'phone') {
      window.open(`tel:${phone}`, '_self');
    } else {
      const message = `Hi ${farmerName}, I'm interested in your ${crop} listing on MyShopKE. Can we discuss the details?`;
      const encodedMessage = encodeURIComponent(message);
      window.open(`https://wa.me/${phone.replace('+', '')}?text=${encodedMessage}`, '_blank');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Available</Badge>;
      case 'reserved':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Reserved</Badge>;
      case 'sold':
        return <Badge variant="secondary" className="bg-gray-100 text-gray-800">Sold</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="relative rounded-xl overflow-hidden">
        <img
          src={freshProduce}
          alt="Fresh produce"
          className="w-full h-48 object-cover"
        />
        <div className="absolute inset-0 bg-gradient-primary opacity-80"></div>
        <div className="absolute inset-0 flex items-center justify-center text-center">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">Farmer Marketplace</h2>
            <p className="text-white/90">Connect directly with farmers for fresh produce</p>
          </div>
        </div>
      </div>

      {/* Actions and Filters */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search crops, farmers, or locations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Show different actions based on user role */}
          {isAuthenticated && user?.role === 'FARMER' ? (
            <Dialog open={isAddingListing} onOpenChange={setIsAddingListing}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add Listing
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Produce Listing</DialogTitle>
                  <DialogDescription>
                    List your produce to connect with buyers
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddListing} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="crop">Crop Type</Label>
                      <Select value={newListing.crop} onValueChange={(value) => setNewListing({ ...newListing, crop: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select crop" />
                        </SelectTrigger>
                        <SelectContent>
                          {cropTypes.map((crop) => (
                            <SelectItem key={crop} value={crop}>{crop}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="quantity">Quantity</Label>
                      <Input
                        type="number"
                        placeholder="e.g., 100"
                        value={newListing.quantity}
                        onChange={(e) => setNewListing({ ...newListing, quantity: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="unit">Unit</Label>
                      <Select value={newListing.unit} onValueChange={(value) => setNewListing({ ...newListing, unit: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {units.map((unit) => (
                            <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="price">Price</Label>
                      <Input
                        type="number"
                        placeholder="e.g., 100"
                        value={newListing.price}
                        onChange={(e) => setNewListing({ ...newListing, price: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="priceUnit">Price Unit</Label>
                    <Select value={newListing.priceUnit} onValueChange={(value) => setNewListing({ ...newListing, priceUnit: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {priceUnits.map((unit) => (
                          <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">County</Label>
                    <Select value={newListing.location} onValueChange={(value) => setNewListing({ ...newListing, location: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select county" />
                      </SelectTrigger>
                      <SelectContent>
                        {locationNames.map((loc) => (
                          <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="specificArea">Specific Area (Optional)</Label>
                    <Input
                      placeholder="e.g., Thika, Limuru"
                      value={newListing.specificArea}
                      onChange={(e) => setNewListing({ ...newListing, specificArea: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="harvestDate">Harvest Date</Label>
                    <Input
                      type="date"
                      value={newListing.harvestDate}
                      onChange={(e) => setNewListing({ ...newListing, harvestDate: e.target.value })}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="farmerName">Your Name</Label>
                      <Input
                        placeholder="John Doe"
                        value={newListing.farmerName}
                        onChange={(e) => setNewListing({ ...newListing, farmerName: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        placeholder="+254712345678"
                        value={newListing.phone}
                        onChange={(e) => setNewListing({ ...newListing, phone: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="whatsapp">WhatsApp (Optional)</Label>
                    <Input
                      placeholder="+254712345678"
                      value={newListing.whatsapp}
                      onChange={(e) => setNewListing({ ...newListing, whatsapp: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      placeholder="Describe your produce..."
                      value={newListing.description}
                      onChange={(e) => setNewListing({ ...newListing, description: e.target.value })}
                      rows={3}
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={createListingRequest.loading}>
                    {createListingRequest.loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Adding Listing...
                      </>
                    ) : (
                      "Add Listing"
                    )}
                  </Button>

                  {createListingRequest.error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{createListingRequest.error}</AlertDescription>
                    </Alert>
                  )}
                </form>
              </DialogContent>
            </Dialog>
          ) : isAuthenticated && user?.role === 'BUYER' ? (
            <div className="text-sm text-muted-foreground bg-muted/50 px-3 py-2 rounded-md">
              Browse and contact farmers for fresh produce
            </div>
          ) : (
            <div className="text-sm text-muted-foreground bg-muted/50 px-3 py-2 rounded-md">
              Sign in as a farmer to add listings or as a buyer to browse
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Select value={locationFilter} onValueChange={setLocationFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by county" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-counties">All Counties</SelectItem>
              {locationNames.map((loc) => (
                <SelectItem key={loc} value={loc}>{loc}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={cropFilter} onValueChange={setCropFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by crop" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-crops">All Crops</SelectItem>
              {cropTypes.map((crop) => (
                <SelectItem key={crop} value={crop}>{crop}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-status">All Status</SelectItem>
              <SelectItem value="available">Available</SelectItem>
              <SelectItem value="reserved">Reserved</SelectItem>
              <SelectItem value="sold">Sold</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results Summary */}
      <div className="text-sm text-muted-foreground">
        Showing {listings.length} listings
        {listingsRequest.loading && " (Loading...)"}
      </div>

      {/* Loading State */}
      {listingsRequest.loading && (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}

      {/* Error State */}
      {listingsRequest.error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load listings: {listingsRequest.error}
          </AlertDescription>
        </Alert>
      )}

      {/* Listings */}
      {!listingsRequest.loading && (
        <div className="grid gap-4">
          {listings.length === 0 ? (
            <Card className="shadow-soft">
              <CardContent className="pt-6 text-center">
                <p className="text-muted-foreground">No listings found matching your criteria</p>
              </CardContent>
            </Card>
          ) : (
            listings.map((listing) => (
              <Card key={listing.id} className="shadow-soft hover:shadow-strong transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl">{listing.crop}</CardTitle>
                      <CardDescription className="flex items-center gap-1 mt-1">
                        <Package className="h-4 w-4" />
                        {listing.quantity} {listing.unit} • {listing.price} {listing.priceUnit}
                      </CardDescription>
                    </div>
                    {getStatusBadge(listing.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">{listing.description}</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{listing.specificArea ? `${listing.specificArea}, ` : ""}{listing.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>Harvest: {new Date(listing.harvestDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Farmer: {listing.farmerName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        Listed: {new Date(listing.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {listing.status === 'available' && (
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleContact('phone', listing.phone, listing.crop, listing.farmerName, listing.id)}
                        className="flex items-center gap-2"
                      >
                        <Phone className="h-4 w-4" />
                        Call
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleContact('whatsapp', listing.whatsapp || listing.phone, listing.crop, listing.farmerName, listing.id)}
                        className="flex items-center gap-2"
                      >
                        <MessageSquare className="h-4 w-4" />
                        WhatsApp
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default Marketplace;
# Design Document

## Overview

The MyShopKE landing page enhancement will transform the existing application from a basic two-tab interface into a comprehensive platform with a compelling landing page that showcases the platform's value proposition. The design maintains the existing React + TypeScript + Tailwind CSS + shadcn/ui architecture while adding new components and improving the user experience flow.

The enhancement focuses on creating a seamless user journey from initial discovery through feature utilization, with particular emphasis on mobile-first responsive design and intuitive navigation patterns that work well for Kenyan farmers and buyers.

## Architecture

### Current Architecture Analysis

The existing application uses:

- **Frontend Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **Routing**: React Router DOM v6
- **State Management**: React hooks (useState) with local component state
- **Build Tool**: Vite
- **UI Components**: Comprehensive shadcn/ui component library

### Enhanced Architecture

The enhancement will extend the current architecture by:

- Adding new route structure for landing page and feature sections
- Implementing responsive navigation system
- Creating reusable UI components for landing page sections
- Enhancing existing components with improved data handling and UX

### Route Structure

```
/ (root) - Landing Page
├── /forecast - Demand Forecast Tool
├── /marketplace - Farmer Marketplace
└── /* - 404 Not Found (existing)
```

## Components and Interfaces

### New Components

#### 1. LandingPage Component

**Purpose**: Main landing page showcasing platform benefits and features
**Location**: `src/pages/LandingPage.tsx`

**Sections**:

- **Hero Section**: Eye-catching banner with value proposition
- **Features Section**: Highlight demand forecasting and marketplace
- **How It Works**: Step-by-step process explanation
- **Success Stories**: Testimonials from farmers and buyers
- **Call-to-Action**: Clear navigation to main features

**Props Interface**:

```typescript
interface LandingPageProps {
  // No props needed - standalone page component
}
```

#### 2. Navigation Component

**Purpose**: Responsive navigation header for all pages
**Location**: `src/components/Navigation.tsx`

**Props Interface**:

```typescript
interface NavigationProps {
  currentPage?: "landing" | "forecast" | "marketplace";
}
```

#### 3. FeatureCard Component

**Purpose**: Reusable card component for feature highlights
**Location**: `src/components/ui/FeatureCard.tsx`

**Props Interface**:

```typescript
interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  ctaText: string;
  ctaLink: string;
}
```

#### 4. TestimonialCard Component

**Purpose**: Display farmer/buyer success stories
**Location**: `src/components/ui/TestimonialCard.tsx`

**Props Interface**:

```typescript
interface TestimonialProps {
  name: string;
  role: "farmer" | "buyer";
  location: string;
  quote: string;
  avatar?: string;
}
```

### Enhanced Existing Components

#### 1. Enhanced Header Component

**Current**: Basic tab navigation between forecast and marketplace
**Enhancement**:

- Add logo/branding consistency
- Implement responsive mobile navigation
- Add breadcrumb navigation
- Include "Home" navigation option

#### 2. Enhanced DemandForecast Component

**Current**: Basic form with mock recommendations
**Enhancement**:

- Improve form validation and user feedback
- Add unit selection for land size (acres/hectares)
- Enhance recommendation display with more detailed information
- Add export/save functionality for recommendations
- Implement better error handling

**Enhanced Data Interface**:

```typescript
interface EnhancedCropRecommendation {
  crop: string;
  demandScore: number;
  priceRange: string;
  reason: string;
  expectedYield: string;
  profitPotential: "low" | "medium" | "high";
  seasonalAdvice: string;
}

interface ForecastFormData {
  location: string;
  landSize: number;
  landUnit: "acres" | "hectares";
  season: string;
}
```

#### 3. Enhanced Marketplace Component

**Current**: Basic listing system with search and filters
**Enhancement**:

- Improve mobile card layout
- Add image upload capability for listings
- Implement better contact flow
- Add listing expiration and status management
- Enhance search with fuzzy matching

**Enhanced Data Interface**:

```typescript
interface EnhancedListing {
  id: string;
  crop: string;
  quantity: number;
  unit: string;
  location: string;
  specificArea?: string;
  harvestDate: string;
  price: number;
  priceUnit: string;
  farmerName: string;
  phone: string;
  whatsapp?: string;
  description: string;
  images?: string[];
  status: "available" | "sold" | "reserved";
  createdAt: string;
  expiresAt: string;
}
```

## Data Models

### Location Data

```typescript
interface LocationData {
  counties: {
    name: string;
    regions: string[];
    majorCrops: string[];
  }[];
}
```

### Crop Database

```typescript
interface CropInfo {
  name: string;
  category: "cereal" | "vegetable" | "fruit" | "legume" | "cash_crop";
  commonUnits: string[];
  seasonality: {
    longRains: boolean;
    shortRains: boolean;
    drySeason: boolean;
  };
  averagePrice: {
    min: number;
    max: number;
    unit: string;
  };
}
```

### Mock Data Structure

The application will use comprehensive mock data including:

- **Kenyan Counties**: All 47 counties with major agricultural regions
- **Crop Information**: 20+ common Kenyan crops with pricing and seasonal data
- **Sample Listings**: 10+ realistic marketplace listings
- **Testimonials**: 6+ success stories from different regions

## Error Handling

### Form Validation

- **Client-side validation**: Real-time validation using react-hook-form with zod schemas
- **User feedback**: Clear error messages with suggestions for correction
- **Progressive enhancement**: Form works without JavaScript for basic functionality

### Data Handling

- **Graceful degradation**: Default recommendations when specific location data unavailable
- **Error boundaries**: React error boundaries to catch and display component errors
- **Loading states**: Skeleton loaders and loading indicators for better UX

### Contact Integration

- **Phone number validation**: Ensure proper Kenyan phone number format
- **WhatsApp integration**: Fallback to SMS if WhatsApp unavailable
- **Error handling**: Clear messaging when contact methods fail

## Testing Strategy

### Component Testing

- **Unit tests**: Test individual components with Jest and React Testing Library
- **Integration tests**: Test component interactions and data flow
- **Accessibility tests**: Ensure WCAG compliance and screen reader compatibility

### User Experience Testing

- **Mobile responsiveness**: Test on various device sizes and orientations
- **Performance testing**: Ensure fast loading on slower mobile connections
- **Usability testing**: Validate intuitive navigation and feature discovery

### Data Validation Testing

- **Form validation**: Test all input validation scenarios
- **Mock data integrity**: Ensure realistic and consistent test data
- **Edge cases**: Test with empty states, long text, and boundary values

## Mobile-First Design Principles

### Responsive Breakpoints

- **Mobile**: 320px - 768px (primary focus)
- **Tablet**: 768px - 1024px
- **Desktop**: 1024px+ (enhancement)

### Touch-Friendly Interface

- **Button sizes**: Minimum 44px touch targets
- **Spacing**: Adequate spacing between interactive elements
- **Gestures**: Support for common mobile gestures (swipe, tap, scroll)

### Performance Optimization

- **Image optimization**: Responsive images with appropriate formats
- **Code splitting**: Lazy load non-critical components
- **Caching**: Implement appropriate caching strategies for static assets

## Visual Design System

### Color Palette

Building on existing Tailwind configuration:

- **Primary**: Green tones representing agriculture and growth
- **Secondary**: Earth tones for warmth and trust
- **Accent**: Bright colors for calls-to-action and highlights
- **Neutral**: Grays for text and backgrounds

### Typography

- **Headings**: Bold, clear hierarchy for easy scanning
- **Body text**: Readable font sizes (minimum 16px on mobile)
- **Labels**: Clear, descriptive form labels and instructions

### Iconography

- **Consistent style**: Use Lucide React icons throughout
- **Meaningful icons**: Agriculture-related icons (leaf, tractor, etc.)
- **Accessibility**: Icons paired with text labels

## Implementation Phases

### Phase 1: Landing Page Foundation

- Create basic landing page structure
- Implement responsive navigation
- Add hero section and basic feature highlights

### Phase 2: Enhanced Components

- Improve existing DemandForecast component
- Enhance Marketplace with better UX
- Add comprehensive mock data

### Phase 3: Polish and Optimization

- Add testimonials and success stories
- Implement performance optimizations
- Conduct thorough testing and bug fixes

This design maintains the existing technical foundation while significantly enhancing the user experience and feature completeness to match the original MyShopKE vision.

import { useState } from "react";

interface LazyImageProps {
    src: string;
    alt: string;
    className?: string;
    placeholder?: string;
}

const LazyImage = ({ src, alt, className, placeholder }: LazyImageProps) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);

    const handleLoad = () => {
        setIsLoaded(true);
    };

    const handleError = () => {
        setHasError(true);
        setIsLoaded(true);
    };

    return (
        <div className={`relative ${className}`}>
            {!isLoaded && (
                <div className="absolute inset-0 bg-muted animate-pulse rounded" />
            )}
            <img
                src={hasError ? placeholder || "/placeholder-image.jpg" : src}
                alt={alt}
                className={`${className} transition-opacity duration-300 ${isLoaded ? "opacity-100" : "opacity-0"
                    }`}
                onLoad={handleLoad}
                onError={handleError}
                loading="lazy"
            />
        </div>
    );
};

export default LazyImage;
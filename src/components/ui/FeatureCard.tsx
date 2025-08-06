import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";

interface FeatureCardProps {
    icon: React.ReactNode;
    title: string;
    description: string;
    features: string[];
    ctaText: string;
    ctaLink: string;
}

const FeatureCard = ({ icon, title, description, features, ctaText, ctaLink }: FeatureCardProps) => {
    return (
        <Card className="shadow-soft hover:shadow-strong transition-shadow">
            <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        {icon}
                    </div>
                    <CardTitle className="text-xl">{title}</CardTitle>
                </div>
                <CardDescription className="text-base">
                    {description}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground mb-4">
                    {features.map((feature, index) => (
                        <li key={index}>• {feature}</li>
                    ))}
                </ul>
                <Button asChild className="w-full">
                    <Link to={ctaLink}>{ctaText}</Link>
                </Button>
            </CardContent>
        </Card>
    );
};

export default FeatureCard;
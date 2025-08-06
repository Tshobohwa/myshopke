import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Quote } from "lucide-react";

interface TestimonialProps {
    name: string;
    role: 'farmer' | 'buyer';
    location: string;
    quote: string;
    avatar?: string;
}

const TestimonialCard = ({ name, role, location, quote, avatar }: TestimonialProps) => {
    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase();
    };

    const getRoleLabel = (role: 'farmer' | 'buyer') => {
        return role === 'farmer' ? 'Farmer' : 'Buyer';
    };

    return (
        <Card className="shadow-soft hover:shadow-strong transition-shadow">
            <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                    <Quote className="h-8 w-8 text-primary/20 flex-shrink-0 mt-1" />
                    <div className="flex-1">
                        <p className="text-muted-foreground mb-4 italic">
                            "{quote}"
                        </p>
                        <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                                <AvatarImage src={avatar} alt={name} />
                                <AvatarFallback className="bg-primary/10 text-primary">
                                    {getInitials(name)}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-semibold text-sm">{name}</p>
                                <p className="text-xs text-muted-foreground">
                                    {getRoleLabel(role)} • {location}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default TestimonialCard;
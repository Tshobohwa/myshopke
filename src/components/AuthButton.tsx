import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LogIn, LogOut, User, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { AuthErrorHandler, DetailedAuthError } from "@/lib/auth-error-handler";

const AuthButton = () => {
    const { user, isAuthenticated, login, register, logout, loading } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState("login");

    // Login form state
    const [loginData, setLoginData] = useState({
        email: "",
        password: "",
    });

    // Register form state
    const [registerData, setRegisterData] = useState({
        email: "",
        password: "",
        confirmPassword: "",
        fullName: "",
        phoneNumber: "",
        role: "BUYER" as "FARMER" | "BUYER",
        location: "",
        farmSize: "",
    });

    const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
    const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string[] }>({});
    const [lastError, setLastError] = useState<DetailedAuthError | null>(null);

    const validateLoginForm = () => {
        const errors: { [key: string]: string } = {};

        if (!loginData.email) errors.email = "Email is required";
        if (!loginData.password) errors.password = "Password is required";

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // Handle API errors and extract field-specific validation
    const handleApiError = (error: any) => {
        const detailedError: DetailedAuthError = error.detailedError || AuthErrorHandler.processError(error);
        setLastError(detailedError);

        // Clear previous field errors
        setFieldErrors({});

        // Extract field-specific errors if available
        if (detailedError.details?.field && detailedError.details?.validation) {
            setFieldErrors({
                [detailedError.details.field]: detailedError.details.validation
            });
        }

        // If validation errors are in a different format, try to parse them
        if (detailedError.code === 'VALIDATION_ERROR' && detailedError.details?.validation) {
            const fieldErrors: { [key: string]: string[] } = {};
            detailedError.details.validation.forEach((error: string) => {
                // Try to extract field name from error message
                const fieldMatch = error.match(/^(\w+):\s*(.+)$/);
                if (fieldMatch) {
                    const [, field, message] = fieldMatch;
                    if (!fieldErrors[field]) fieldErrors[field] = [];
                    fieldErrors[field].push(message);
                } else {
                    // Generic validation error
                    if (!fieldErrors.general) fieldErrors.general = [];
                    fieldErrors.general.push(error);
                }
            });
            setFieldErrors(fieldErrors);
        }
    };

    const validateRegisterForm = () => {
        const errors: { [key: string]: string } = {};

        if (!registerData.email) errors.email = "Email is required";
        if (!registerData.password) errors.password = "Password is required";
        if (registerData.password !== registerData.confirmPassword) {
            errors.confirmPassword = "Passwords do not match";
        }
        if (!registerData.fullName) errors.fullName = "Full name is required";
        if (!registerData.phoneNumber) errors.phoneNumber = "Phone number is required";

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateLoginForm()) return;

        // Clear previous errors
        setFormErrors({});
        setFieldErrors({});
        setLastError(null);

        try {
            const success = await login(loginData.email, loginData.password);
            if (success) {
                setIsOpen(false);
                setLoginData({ email: "", password: "" });
                setFormErrors({});
                setFieldErrors({});
            }
        } catch (error: any) {
            handleApiError(error);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateRegisterForm()) return;

        // Clear previous errors
        setFormErrors({});
        setFieldErrors({});
        setLastError(null);

        const userData = {
            email: registerData.email,
            password: registerData.password,
            fullName: registerData.fullName,
            phoneNumber: registerData.phoneNumber,
            role: registerData.role,
            profile: registerData.role === 'FARMER' ? {
                location: registerData.location,
                farmSize: registerData.farmSize ? parseFloat(registerData.farmSize) : undefined,
            } : undefined,
        };

        try {
            const success = await register(userData);
            if (success) {
                setIsOpen(false);
                setRegisterData({
                    email: "",
                    password: "",
                    confirmPassword: "",
                    fullName: "",
                    phoneNumber: "",
                    role: "BUYER",
                    location: "",
                    farmSize: "",
                });
                setFormErrors({});
                setFieldErrors({});
            }
        } catch (error: any) {
            handleApiError(error);
        }
    };

    const handleLogout = () => {
        logout();
    };

    // Helper component to render field errors
    const FieldError = ({ fieldName }: { fieldName: string }) => {
        const errors = fieldErrors[fieldName] || [];
        const clientError = formErrors[fieldName];

        if (!errors.length && !clientError) return null;

        return (
            <div className="mt-1">
                {clientError && (
                    <Alert variant="destructive" className="py-2">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-xs">{clientError}</AlertDescription>
                    </Alert>
                )}
                {errors.map((error, index) => (
                    <Alert key={index} variant="destructive" className="py-2 mt-1">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-xs">{error}</AlertDescription>
                    </Alert>
                ))}
            </div>
        );
    };

    // Helper to get input className with error styling
    const getInputClassName = (fieldName: string) => {
        const hasError = formErrors[fieldName] || fieldErrors[fieldName]?.length;
        return hasError ? "border-red-500 focus:border-red-500" : "";
    };

    if (isAuthenticated && user) {
        return (
            <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4" />
                    <span>{user.fullName}</span>
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                        {user.role}
                    </span>
                </div>
                <Button variant="outline" size="sm" onClick={handleLogout}>
                    <LogOut className="h-4 w-4 mr-1" />
                    Logout
                </Button>
            </div>
        );
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <LogIn className="h-4 w-4 mr-2" />
                    Login
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Welcome to MyShopKE</DialogTitle>
                    <DialogDescription>
                        Login to your account or create a new one
                    </DialogDescription>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="login">Login</TabsTrigger>
                        <TabsTrigger value="register">Register</TabsTrigger>
                    </TabsList>

                    <TabsContent value="login" className="space-y-4">
                        <form onSubmit={handleLogin} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="login-email">Email</Label>
                                <Input
                                    id="login-email"
                                    type="email"
                                    placeholder="your@email.com"
                                    value={loginData.email}
                                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                                    className={getInputClassName('email')}
                                />
                                <FieldError fieldName="email" />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="login-password">Password</Label>
                                <Input
                                    id="login-password"
                                    type="password"
                                    placeholder="Your password"
                                    value={loginData.password}
                                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                                    className={getInputClassName('password')}
                                />
                                <FieldError fieldName="password" />
                            </div>

                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? "Logging in..." : "Login"}
                            </Button>
                        </form>
                    </TabsContent>

                    <TabsContent value="register" className="space-y-4">
                        <form onSubmit={handleRegister} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="register-role">I am a</Label>
                                <Select value={registerData.role} onValueChange={(value: "FARMER" | "BUYER") => setRegisterData({ ...registerData, role: value })}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="BUYER">Buyer</SelectItem>
                                        <SelectItem value="FARMER">Farmer</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="register-name">Full Name</Label>
                                    <Input
                                        id="register-name"
                                        placeholder="John Doe"
                                        value={registerData.fullName}
                                        onChange={(e) => setRegisterData({ ...registerData, fullName: e.target.value })}
                                        className={formErrors.fullName ? "border-red-500" : ""}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="register-phone">Phone</Label>
                                    <Input
                                        id="register-phone"
                                        placeholder="+254712345678"
                                        value={registerData.phoneNumber}
                                        onChange={(e) => setRegisterData({ ...registerData, phoneNumber: e.target.value })}
                                        className={formErrors.phoneNumber ? "border-red-500" : ""}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="register-email">Email</Label>
                                <Input
                                    id="register-email"
                                    type="email"
                                    placeholder="your@email.com"
                                    value={registerData.email}
                                    onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                                    className={getInputClassName('email')}
                                />
                                <FieldError fieldName="email" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="register-password">Password</Label>
                                    <Input
                                        id="register-password"
                                        type="password"
                                        placeholder="Password"
                                        value={registerData.password}
                                        onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                                        className={getInputClassName('password')}
                                    />
                                    <FieldError fieldName="password" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="register-confirm">Confirm</Label>
                                    <Input
                                        id="register-confirm"
                                        type="password"
                                        placeholder="Confirm password"
                                        value={registerData.confirmPassword}
                                        onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                                        className={getInputClassName('confirmPassword')}
                                    />
                                    <FieldError fieldName="confirmPassword" />
                                </div>
                            </div>

                            {registerData.role === 'FARMER' && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="register-location">Location</Label>
                                        <Input
                                            id="register-location"
                                            placeholder="County"
                                            value={registerData.location}
                                            onChange={(e) => setRegisterData({ ...registerData, location: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="register-farm-size">Farm Size (acres)</Label>
                                        <Input
                                            id="register-farm-size"
                                            type="number"
                                            placeholder="2.5"
                                            value={registerData.farmSize}
                                            onChange={(e) => setRegisterData({ ...registerData, farmSize: e.target.value })}
                                        />
                                    </div>
                                </div>
                            )}

                            {Object.keys(formErrors).length > 0 && (
                                <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>
                                        Please fix the errors above
                                    </AlertDescription>
                                </Alert>
                            )}

                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? "Creating account..." : "Create Account"}
                            </Button>
                        </form>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
};

export default AuthButton;
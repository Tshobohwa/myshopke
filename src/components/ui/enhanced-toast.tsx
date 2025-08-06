import React, { useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { AlertCircle, ChevronDown, ChevronUp, Copy, CheckCircle } from 'lucide-react';
import { DetailedAuthError } from '@/lib/auth-error-handler';

interface EnhancedToastProps {
    error: DetailedAuthError;
    title?: string;
    onClose?: () => void;
}

export const EnhancedErrorToast: React.FC<EnhancedToastProps> = ({
    error,
    title,
    onClose
}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [copied, setCopied] = useState(false);

    const copyErrorDetails = async () => {
        const errorText = `Error Code: ${error.code}\nMessage: ${error.message}\nTimestamp: ${error.timestamp}`;
        try {
            await navigator.clipboard.writeText(errorText);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy error details:', err);
        }
    };

    const hasDetails = error.details?.validation?.length || error.details?.suggestions?.length || error.code !== 'UNKNOWN_ERROR';

    return (
        <Alert variant="destructive" className="max-w-md">
            <AlertCircle className="h-4 w-4" />
            <div className="flex-1">
                <AlertTitle className="flex items-center justify-between">
                    {title || 'Error'}
                    {hasDetails && (
                        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
                            <CollapsibleTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                    {isExpanded ? (
                                        <ChevronUp className="h-3 w-3" />
                                    ) : (
                                        <ChevronDown className="h-3 w-3" />
                                    )}
                                </Button>
                            </CollapsibleTrigger>
                        </Collapsible>
                    )}
                </AlertTitle>

                <AlertDescription className="mt-2">
                    {error.message}

                    {hasDetails && (
                        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
                            <CollapsibleContent className="mt-3 space-y-2">
                                {/* Validation Errors */}
                                {error.details?.validation?.length && (
                                    <div>
                                        <p className="font-medium text-sm mb-1">Validation Issues:</p>
                                        <ul className="text-xs space-y-1 ml-2">
                                            {error.details.validation.map((validation, index) => (
                                                <li key={index} className="flex items-start">
                                                    <span className="text-red-500 mr-1">•</span>
                                                    {validation}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Suggestions */}
                                {error.details?.suggestions?.length && (
                                    <div>
                                        <p className="font-medium text-sm mb-1">Suggestions:</p>
                                        <ul className="text-xs space-y-1 ml-2">
                                            {error.details.suggestions.map((suggestion, index) => (
                                                <li key={index} className="flex items-start">
                                                    <span className="text-blue-500 mr-1">•</span>
                                                    {suggestion}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Error Code and Copy Button */}
                                {error.code !== 'UNKNOWN_ERROR' && (
                                    <div className="flex items-center justify-between pt-2 border-t border-red-200">
                                        <span className="text-xs font-mono text-red-600">
                                            {error.code}
                                        </span>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={copyErrorDetails}
                                            className="h-6 px-2 text-xs"
                                        >
                                            {copied ? (
                                                <>
                                                    <CheckCircle className="h-3 w-3 mr-1" />
                                                    Copied
                                                </>
                                            ) : (
                                                <>
                                                    <Copy className="h-3 w-3 mr-1" />
                                                    Copy
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                )}
                            </CollapsibleContent>
                        </Collapsible>
                    )}
                </AlertDescription>
            </div>
        </Alert>
    );
};

// Hook to use enhanced error toasts
export const useEnhancedToast = () => {
    const showErrorToast = (error: DetailedAuthError, title?: string) => {
        // This would integrate with your existing toast system
        // For now, we'll use the regular toast but with enhanced formatting
        return {
            error,
            title,
            component: EnhancedErrorToast
        };
    };

    return { showErrorToast };
};
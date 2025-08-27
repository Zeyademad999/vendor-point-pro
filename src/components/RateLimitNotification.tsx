import React, { useState, useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Clock, RefreshCw, Info } from "lucide-react";

interface RateLimitInfo {
  timestamp: number;
  waitTime: number;
  message: string;
}

const RateLimitNotification: React.FC = () => {
  const [rateLimitInfo, setRateLimitInfo] = useState<RateLimitInfo | null>(
    null
  );
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  useEffect(() => {
    const checkRateLimit = () => {
      const stored = localStorage.getItem("rateLimitInfo");
      if (stored) {
        const info: RateLimitInfo = JSON.parse(stored);
        const elapsed = Date.now() - info.timestamp;
        const remaining = Math.max(0, info.waitTime - elapsed);

        if (remaining > 0) {
          setRateLimitInfo(info);
          setTimeRemaining(remaining);
        } else {
          // Rate limit expired
          localStorage.removeItem("rateLimitInfo");
          setRateLimitInfo(null);
          setTimeRemaining(0);
        }
      }
    };

    checkRateLimit();
    const interval = setInterval(checkRateLimit, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (ms: number): string => {
    const seconds = Math.ceil(ms / 1000);
    if (seconds < 60) {
      return `${seconds}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const handleRetry = () => {
    localStorage.removeItem("rateLimitInfo");
    setRateLimitInfo(null);
    setTimeRemaining(0);
    window.location.reload();
  };

  if (!rateLimitInfo) {
    return null;
  }

  return (
    <Alert className="mb-4 border-orange-200 bg-orange-50">
      <Clock className="h-4 w-4 text-orange-600" />
      <AlertDescription className="text-orange-800">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="font-medium mb-1">Rate limit exceeded</p>
            <p className="text-sm">
              Please wait{" "}
              <span className="font-mono font-bold">
                {formatTime(timeRemaining)}
              </span>{" "}
              before making new requests.
            </p>
            <p className="text-xs mt-1 text-orange-700">
              This helps protect our servers and ensure fair usage for all
              users.
            </p>
          </div>
          {timeRemaining === 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleRetry}
              className="ml-4 border-orange-300 text-orange-700 hover:bg-orange-100"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Retry
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
};

export default RateLimitNotification;

import { useCallback, useRef } from "react";

interface ThrottleConfig {
  maxRequestsPerMinute: number;
  windowMs: number;
}

const DEFAULT_CONFIG: ThrottleConfig = {
  maxRequestsPerMinute: 30, // Conservative limit
  windowMs: 60000, // 1 minute
};

export const useApiThrottle = (config: Partial<ThrottleConfig> = {}) => {
  const throttleConfig = { ...DEFAULT_CONFIG, ...config };
  const requestTimes = useRef<number[]>([]);
  const isThrottled = useRef(false);

  const canMakeRequest = useCallback(() => {
    const now = Date.now();
    const windowStart = now - throttleConfig.windowMs;

    // Remove old requests outside the window
    requestTimes.current = requestTimes.current.filter(
      (time) => time > windowStart
    );

    // Check if we're under the limit
    const canRequest =
      requestTimes.current.length < throttleConfig.maxRequestsPerMinute;

    if (!canRequest) {
      isThrottled.current = true;
      // Auto-reset after window expires
      setTimeout(() => {
        isThrottled.current = false;
      }, throttleConfig.windowMs);
    }

    return canRequest;
  }, [throttleConfig]);

  const recordRequest = useCallback(() => {
    requestTimes.current.push(Date.now());
  }, []);

  const getThrottleStatus = useCallback(() => {
    const now = Date.now();
    const windowStart = now - throttleConfig.windowMs;
    const recentRequests = requestTimes.current.filter(
      (time) => time > windowStart
    );

    return {
      isThrottled: isThrottled.current,
      requestsInWindow: recentRequests.length,
      maxRequests: throttleConfig.maxRequestsPerMinute,
      timeUntilReset: Math.max(
        0,
        throttleConfig.windowMs - (now - windowStart)
      ),
    };
  }, [throttleConfig]);

  return {
    canMakeRequest,
    recordRequest,
    getThrottleStatus,
    isThrottled: isThrottled.current,
  };
};

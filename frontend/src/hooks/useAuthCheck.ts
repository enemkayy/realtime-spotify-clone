import { useEffect } from "react";
import { useAuthStore } from "@/stores/useAuthStore";

export const useAuthCheck = () => {
    const { checkAdminStatus } = useAuthStore();

    useEffect(() => {
        // Check auth on mount
        checkAdminStatus();

        // Re-check when tab becomes visible
        const handleVisibilityChange = () => {
            if (!document.hidden) {
                console.log("🔄 Tab focused, refreshing auth...");
                checkAdminStatus();
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);

        // Optional: Re-check every 5 minutes (while active)
        const interval = setInterval(() => {
            if (!document.hidden) {
                checkAdminStatus();
            }
        }, 5 * 60 * 1000); // 5 minutes

        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            clearInterval(interval);
        };
    }, [checkAdminStatus]);
};
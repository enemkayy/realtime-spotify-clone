import { axiosInstance, setAxiosAuthToken } from "@/lib/axios";
import { useAuthStore } from "@/stores/useAuthStore";
import { useChatStore } from "@/stores/useChatStore";
import { useAuth, useUser } from "@clerk/clerk-react";
import { Loader } from "lucide-react";
import { useEffect, useState } from "react";

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
	const { getToken, userId } = useAuth();
	const { isLoaded: userLoaded, user } = useUser();
	const [loading, setLoading] = useState(true);
	const { checkAdminStatus } = useAuthStore();
	const { initSocket, disconnectSocket } = useChatStore();

	useEffect(() => {
		// Setup axios to use Clerk token
		setAxiosAuthToken(getToken);

		const initAuth = async () => {
			try {
				const token = await getToken();
				if (token) {
					await checkAdminStatus();
					// init socket
					if (userId) initSocket(userId);
				}
			} catch (error: any) {
				console.log("Error in auth provider", error);
			} finally {
				setLoading(false);
			}
		};

		initAuth();

		// clean up
		return () => disconnectSocket();
	}, [getToken, userId, checkAdminStatus, initSocket, disconnectSocket]);

  // Sync profile khi dữ liệu Clerk thay đổi (tên, avatar, ...)
  useEffect(() => {
    const syncProfile = async () => {
      if (!userLoaded || !user) return;
      try {
        await axiosInstance.post("/auth/callback", {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          imageUrl: user.imageUrl,
        });
      } catch (e) {
        console.log("Profile sync failed", e);
      }
    };
    syncProfile();
  }, [userLoaded, user?.id, user?.firstName, user?.lastName, user?.imageUrl]);

  if (loading)
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <Loader className="size-8 text-emerald-500 animate-spin" />
      </div>
    );

  return <>{children}</>;
};
export default AuthProvider;

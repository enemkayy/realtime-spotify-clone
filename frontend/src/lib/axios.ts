import axios from "axios";

export const axiosInstance = axios.create({
	baseURL: import.meta.env.MODE === "development" ? "http://localhost:5000/api" : "/api",
	withCredentials: true,
});

// Store Clerk getToken function
let getTokenFn: (() => Promise<string | null>) | null = null;

export const setAxiosAuthToken = (getToken: () => Promise<string | null>) => {
	getTokenFn = getToken;
};

// Request interceptor - attach Clerk session token
axiosInstance.interceptors.request.use(
	async (config) => {
		if (getTokenFn) {
			try {
				const token = await getTokenFn();
				if (token) {
					config.headers.Authorization = `Bearer ${token}`;
				}
			} catch (error) {
				console.error("Failed to get Clerk token:", error);
			}
		}
		return config;
	},
	(error) => Promise.reject(error)
);

// Response interceptor
axiosInstance.interceptors.response.use(
	(response) => response,
	(error) => {
		if (error.response?.status === 401) {
			console.warn("⚠️ Unauthorized request:", error.config?.url);
		}
		return Promise.reject(error);
	}
);
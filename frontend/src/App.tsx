import { Route, Routes } from "react-router-dom";
import HomePage from "./pages/home/HomePage";
import AuthCallbackPage from "./pages/auth-callback/AuthCallbackPage";
import { AuthenticateWithRedirectCallback } from "@clerk/clerk-react";
import MainLayout from "./layout/MainLayout";
import ChatPage from "./pages/chat/ChatPage";
import AlbumPage from "./pages/album/AlbumPage";
import AdminPage from "./pages/admin/AdminPage";
import MadeForYouPage from "./pages/made-for-you/MadeForYouPage";
import TrendingPage from "./pages/trending/TrendingPage";

import { Toaster } from "react-hot-toast";
import NotFoundPage from "./pages/404/NotFoundPage";
import { useAuthCheck } from "@/hooks/useAuthCheck";

function App() {
	useAuthCheck();
	
	return (
		<>
			<Routes>
				<Route
					path='/sso-callback'
					element={<AuthenticateWithRedirectCallback signUpForceRedirectUrl={"/auth-callback"} />}
				/>
				<Route path='/auth-callback' element={<AuthCallbackPage />} />
				<Route path='/admin' element={<AdminPage />} />

				<Route element={<MainLayout />}>
					<Route path='/' element={<HomePage />} />
					<Route path='/chat' element={<ChatPage />} />
					<Route path='/albums/:albumId' element={<AlbumPage />} />
					<Route path='/made-for-you' element={<MadeForYouPage />} />
					<Route path='/trending' element={<TrendingPage />} />
					<Route path='*' element={<NotFoundPage />} />
				</Route>
			</Routes>
			<Toaster />
		</>
	);
}

export default App;

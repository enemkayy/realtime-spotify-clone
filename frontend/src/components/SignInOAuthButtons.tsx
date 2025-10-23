import { useClerk } from "@clerk/clerk-react";
import { Button } from "./ui/button";

const SignInOAuthButtons = () => {
  const { openSignIn } = useClerk();

  const openSignInPanel = async () => {
    try {
      await openSignIn?.({});
    } catch {
      window.location.href = "/sign-in"; // fallback route
    }
  };

  return (
    <Button
      onClick={openSignInPanel}
      variant={"secondary"}
      className="w-[135px] h-[60px] bg-white text-black border text-xl border-black rounded-full font-bold hover:bg-gray-100 transition"
    >
      Log in
    </Button>
  );
};
export default SignInOAuthButtons;

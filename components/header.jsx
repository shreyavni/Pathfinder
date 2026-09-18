import { BUTTONS_MENUS } from "@/lib/constants";
import { checkUser } from "@/lib/checkUser";
import HeaderClient from "./header-client";

export default async function Header() {
  const user = await checkUser();
  const isSignedIn = !!user;

  return <HeaderClient isSignedIn={isSignedIn} />;
}
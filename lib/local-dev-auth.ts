import { auth, currentUser } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import {
  LOCAL_DEV_AUTH_COOKIE,
  LOCAL_DEV_USER_EMAIL,
  LOCAL_DEV_USER_ID,
  isLocalDevAuthEnabled,
} from "@/lib/local-dev-auth-shared";

export {
  LOCAL_DEV_AUTH_COOKIE,
  LOCAL_DEV_USER_EMAIL,
  LOCAL_DEV_USER_ID,
  LOCAL_DEV_WORKSPACE_LOGIN_URL,
  isLocalDevAuthEnabled,
} from "@/lib/local-dev-auth-shared";

export async function getAppAuthSession() {
  const cookieStore = cookies();
  const hasLocalDevCookie =
    isLocalDevAuthEnabled() &&
    cookieStore.get(LOCAL_DEV_AUTH_COOKIE)?.value === "1";

  if (hasLocalDevCookie) {
    return {
      userId: LOCAL_DEV_USER_ID,
      email: LOCAL_DEV_USER_EMAIL,
      isLocalDev: true,
    };
  }

  const { userId } = await auth();
  let clerkUser: Awaited<ReturnType<typeof currentUser>> = null;
  try {
    clerkUser = await currentUser();
  } catch (currentUserError) {
    console.warn("[Auth][CurrentUserFetchFailed]", currentUserError);
  }
  const email = clerkUser?.emailAddresses?.[0]?.emailAddress || "";

  if (userId) {
    return { userId, email, isLocalDev: false };
  }

  if (!isLocalDevAuthEnabled()) {
    return { userId: null, email: "", isLocalDev: false };
  }

  return { userId: null, email: "", isLocalDev: false };
}

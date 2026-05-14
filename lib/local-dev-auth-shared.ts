export const LOCAL_DEV_AUTH_COOKIE = "datingphotosai_dev_auth";
export const LOCAL_DEV_USER_ID = "dev-user-datingphotosai";
export const LOCAL_DEV_USER_EMAIL = "dev@datingphotosai.local";
export const LOCAL_DEV_WORKSPACE_LOGIN_URL =
  "/api/dev-login?redirect=/workspace/image-to-image";

export function isLocalDevAuthEnabled() {
  return process.env.NODE_ENV !== "production";
}

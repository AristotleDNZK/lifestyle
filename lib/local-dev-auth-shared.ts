export const LOCAL_DEV_AUTH_COOKIE = "datingphotosai_dev_auth";
export const LOCAL_DEV_USER_ID = "dev-user-datingphotosai";
export const LOCAL_DEV_USER_EMAIL = "nuoweileinaxiawan@gmail.com";
export const LOCAL_DEV_CREDIT_BALANCE = 99999;
export const LOCAL_DEV_WORKSPACE_LOGIN_URL =
  "/api/dev-login?redirect=/workspace/image-to-image";

export function isLocalDevAuthEnabled() {
  return process.env.NODE_ENV !== "production";
}

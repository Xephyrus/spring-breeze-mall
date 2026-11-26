import LibGenerateTestUserSig from "./lib-generate-test-usersig-es.min.js";

/** Signature expiration time (seconds). Default: 7 days. */
export const EXPIRETIME = 604800;

export type GenTestUserSigOptions = {
  SDKAppID: number | string;
  secretKey: string;
  userID: string;
};

export type GenTestUserSigResult = {
  SDKAppID: number;
  userSig: string;
};

/**
 * Generates UserSig for testing only — do not ship SECRETKEY in commercial clients.
 * Prefer server-side UserSig generation in production.
 */
export function genTestUserSig(options: GenTestUserSigOptions): GenTestUserSigResult {
  const { SDKAppID, secretKey, userID } = options;
  const sdkAppId = Number(SDKAppID);
  const generator = new LibGenerateTestUserSig(sdkAppId, secretKey, EXPIRETIME);
  const userSig = generator.genTestUserSig(userID);
  return {
    SDKAppID: sdkAppId,
    userSig,
  };
}

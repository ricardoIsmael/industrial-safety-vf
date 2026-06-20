export {};

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    refreshToken?: string;
    idToken?: string;
    dbId?: string | number;
    keycloakId?: string;
    roles?: string[];
    isNewUser?: boolean;
    newUserEmail?: string;
    mustChangePassword?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    idToken?: string;
    dbId?: string | number;
    keycloakId?: string;
    dbName?: string;
    roles?: string[];
    expiresAt?: number;
    isNewUser?: boolean;
    newUserEmail?: string;
    provider?: string;
    mustChangePassword?: boolean;
  }
}

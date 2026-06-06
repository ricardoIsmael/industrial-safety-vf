import NextAuth from "next-auth"
import Keycloak from "next-auth/providers/keycloak"
import type { JWT } from "next-auth/jwt"
import Credentials from "next-auth/providers/credentials"

export const { handlers, auth, signIn, signOut } = NextAuth({
    trustHost: true,
    providers: [
        Keycloak({
            clientId: process.env.KEYCLOAK_CLIENT_ID!,
            clientSecret: process.env.KEYCLOAK_CLIENT_SECRET!,
            issuer: process.env.KEYCLOAK_ISSUER!,
            authorization: {
                params: {
                    prompt: "select_account"
                }
            }
        }),
        Credentials({
            id: "credentials",
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "text" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) return null;
                try {
                    const response = await fetch(`${process.env.KEYCLOAK_ISSUER}/protocol/openid-connect/token`, {
                        method: "POST",
                        headers: { "Content-Type": "application/x-www-form-urlencoded" },
                        body: new URLSearchParams({
                            client_id: process.env.KEYCLOAK_CLIENT_ID_MANUAL!,
                            client_secret: process.env.KEYCLOAK_CLIENT_SECRET_MANUAL!,
                            grant_type: "password",
                            username: credentials.email as string,
                            password: credentials.password as string,
                            scope: "openid roles",
                        }),
                    });
                    const tokens = await response.json();
                    if (!response.ok) {
                        console.error("DEBUG [Auth]: Keycloak rechazó las credenciales:", tokens);
                        return null;
                    }

                    const payloadBase64 = tokens.access_token.split(".")[1];
                    const payload = JSON.parse(Buffer.from(payloadBase64, "base64").toString());
                    const keycloakUuid = payload.sub;
                    const roles: string[] = payload.realm_access?.roles || [];
                    const name = payload.name || payload.preferred_username || "Usuario";

                    console.log("DEBUG [Auth]: Login manual exitoso. UUID:", keycloakUuid, "Roles:", roles);

                    return {
                        id: keycloakUuid,
                        name,
                        email: credentials.email as string,
                        accessToken: tokens.access_token,
                        refreshToken: tokens.refresh_token,
                        idToken: tokens.id_token,
                        expiresIn: tokens.expires_in,
                        roles,
                    };
                } catch (error) {
                    return null;
                }
            }
        })
    ],
    callbacks: {
        async jwt({ token, account, user }) {
            if (account && user) {
                const accessToken = ((user as any).accessToken || account.access_token || "") as string;
                const refreshToken = ((user as any).refreshToken || account.refresh_token || "") as string;
                const idToken = ((user as any).idToken || account.id_token || "") as string;
                const provider = account.provider ?? "credentials";

                let roles: string[] = (user as any).roles || [];
                if (!roles.length) {
                    try {
                        const payloadBase64 = accessToken.split(".")[1];
                        const payload = JSON.parse(Buffer.from(payloadBase64, "base64").toString());
                        roles = payload.realm_access?.roles || [];
                    } catch (e) {
                        console.error("Error parsing token roles", e);
                    }
                }

                const matchRole = (r: string) => roles.includes(r) || roles.includes(`ROLE_${r}`);
                let primaryRole = "ROLE_ALUMNO";
                if      (matchRole("ADMINISTRADOR"))    primaryRole = "ROLE_ADMINISTRADOR";
                else if (matchRole("GERENCIA_GENERAL")) primaryRole = "ROLE_GERENCIA_GENERAL";
                else if (matchRole("INSTRUCTOR"))       primaryRole = "ROLE_INSTRUCTOR";
                else if (matchRole("MARKETING"))        primaryRole = "ROLE_MARKETING";
                else if (matchRole("JEFE_SEGURIDAD"))   primaryRole = "ROLE_JEFE_SEGURIDAD";
                else if (matchRole("LOGISTICA_ALMACEN")) primaryRole = "ROLE_LOGISTICA_ALMACEN";
                else if (matchRole("TRABAJADOR"))       primaryRole = "ROLE_TRABAJADOR";

                let dbId = token.dbId;
                let isNewUser = false;
                let newUserEmail: string | undefined = undefined;
                let mustChangePassword = false;
                // keycloakId resuelto desde la DB (admin API) para garantizar consistencia
                let resolvedKeycloakId: string = (user as any).id || token.sub || "";

                if (provider !== "credentials") {
                    // Login OAuth: sincronizar con backend (obligatorio)
                    let res: Response;
                    try {
                        res = await fetch(`${process.env.API_URL}/api/v1/users/register`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                name: user.name?.split(" ")[0] || "Usuario",
                                lastName: user.name?.split(" ").slice(1).join(" ") || "",
                                email: user.email,
                                password: "oauth_user_password",
                                role: primaryRole,
                                keycloakId: resolvedKeycloakId,
                                mustChangePassword: true,
                            })
                        });
                    } catch (err) {
                        console.error("DEBUG [Auth]: Backend no disponible en login OAuth", err);
                        return { ...token, error: "BackendUnavailableError" };
                    }
                    if (!res.ok) {
                        console.error("DEBUG [Auth]: Backend rechazó el registro OAuth. Status:", res.status);
                        return { ...token, error: "BackendUnavailableError" };
                    }
                    const dbUser = await res.json();
                    dbId = dbUser.id;
                    if (dbUser.keycloakId) resolvedKeycloakId = dbUser.keycloakId;
                    token.dbName = [dbUser.name, dbUser.lastName].filter(Boolean).join(" ");
                    mustChangePassword = dbUser.mustChangePassword === true;
                    if (res.status === 201) {
                        isNewUser = true;
                        newUserEmail = user.email ?? undefined;
                    }
                    console.log("DEBUG [Auth]: Sincronización OAuth exitosa. ID DB:", dbId, "keycloakId:", resolvedKeycloakId);
                } else {
                    // Login credentials: consultar DB (obligatorio)
                    let res: Response;
                    try {
                        res = await fetch(
                            `${process.env.API_URL}/api/v1/users/by-email?email=${encodeURIComponent(user.email ?? "")}`,
                            { headers: { Authorization: `Bearer ${accessToken}` } }
                        );
                    } catch (err) {
                        console.error("DEBUG [Auth]: Backend no disponible en login credentials", err);
                        return { ...token, error: "BackendUnavailableError" };
                    }
                    // Si el usuario no existe en DB (404), registrarlo automáticamente con sus datos de Keycloak
                    if (res.status === 404) {
                        console.log("DEBUG [Auth]: Usuario no encontrado en DB, registrando desde Keycloak...");
                        const nameParts = (user.name ?? "").split(" ");
                        const firstName = nameParts[0] || "Usuario";
                        const lastName = nameParts.slice(1).join(" ") || "";
                        try {
                            const regBody = {
                                name: firstName,
                                lastName,
                                email: user.email,
                                password: "oauth_user_password",
                                role: primaryRole,
                                keycloakId: resolvedKeycloakId,
                            };
                            console.log("DEBUG [Auth]: Registrando en DB con datos:", JSON.stringify(regBody));
                            const regRes = await fetch(`${process.env.API_URL}/api/v1/users/register`, {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify(regBody),
                            });
                            if (regRes.ok) {
                                const created = await regRes.json();
                                dbId = created.id;
                                token.dbName = `${created.name} ${created.lastName}`;
                                console.log("DEBUG [Auth]: Usuario registrado en DB. ID:", dbId);
                            } else {
                                console.error("DEBUG [Auth]: No se pudo registrar en DB. Status:", regRes.status);
                            }
                        } catch (regErr) {
                            console.error("DEBUG [Auth]: Error registrando en DB:", regErr);
                        }
                    } else if (!res.ok) {
                        console.error("DEBUG [Auth]: Backend rechazó consulta by-email. Status:", res.status);
                        return { ...token, error: "BackendUnavailableError" };
                    } else {
                        const dbUser = await res.json();
                        dbId = dbUser.id;
                        if (dbUser.keycloakId) resolvedKeycloakId = dbUser.keycloakId;
                        mustChangePassword = dbUser.mustChangePassword === true;
                        token.dbName = [dbUser.name, dbUser.lastName].filter(Boolean).join(" ");
                    }
                    console.log("DEBUG [Auth]: Login credentials. ID DB:", dbId, "keycloakId:", resolvedKeycloakId, "mustChangePassword:", mustChangePassword, "roles:", roles);
                }

                return {
                    ...token,
                    accessToken,
                    refreshToken,
                    idToken,
                    dbId,
                    keycloakId: resolvedKeycloakId,
                    roles,
                    isNewUser,
                    newUserEmail,
                    mustChangePassword,
                    provider,
                    expiresAt: account.expires_at
                        ? account.expires_at * 1000
                        : Date.now() + (((user as any).expiresIn ?? 300) * 1000),
                };
            }

            if (Date.now() < (token.expiresAt as number)) return token;

            // Refresh token logic — use the client that issued the original token
            try {
                const isOAuth = token.provider === "keycloak";
                const refreshClientId = isOAuth
                    ? process.env.KEYCLOAK_CLIENT_ID!
                    : process.env.KEYCLOAK_CLIENT_ID_MANUAL!;
                const refreshClientSecret = isOAuth
                    ? process.env.KEYCLOAK_CLIENT_SECRET!
                    : process.env.KEYCLOAK_CLIENT_SECRET_MANUAL!;

                const response = await fetch(`${process.env.KEYCLOAK_ISSUER}/protocol/openid-connect/token`, {
                    method: "POST",
                    headers: { "Content-Type": "application/x-www-form-urlencoded" },
                    body: new URLSearchParams({
                        client_id: refreshClientId,
                        client_secret: refreshClientSecret,
                        grant_type: "refresh_token",
                        refresh_token: token.refreshToken as string,
                    }),
                });
                const tokens = await response.json();
                if (!response.ok) throw tokens;
                return {
                    ...token,
                    accessToken: tokens.access_token,
                    refreshToken: tokens.refresh_token ?? token.refreshToken,
                    expiresAt: Date.now() + (tokens.expires_in * 1000),
                };
            } catch (error) {
                return { ...token, error: "RefreshAccessTokenError" };
            }
        },
        async session({ session, token }) {
            session.accessToken = token.accessToken as string;
            session.idToken = token.idToken as string;
            session.dbId = token.dbId;
            session.keycloakId = token.keycloakId as string;
            session.roles = token.roles;
            session.isNewUser = token.isNewUser;
            session.newUserEmail = token.newUserEmail;
            session.mustChangePassword = token.mustChangePassword;
            if (token.dbName && session.user) {
                session.user.name = token.dbName as string;
            }
            // @ts-ignore
            session.error = token.error;
            return session;
        }
    }
})
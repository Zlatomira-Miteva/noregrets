import NextAuth, { type NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { pgPool } from "@/lib/pg";
import { logAudit } from "@/lib/audit";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/account/login",
  },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Парола", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          return null;
        }
        const res = await pgPool.query(
          `SELECT id, email, name, password, role, to_jsonb(u) as meta
           FROM "User" u
           WHERE email = $1
           LIMIT 1`,
          [credentials.email],
        );
        const user = res.rows[0];
        if (!user?.password) return null;

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) return null;

        const role = (user.role as string) ?? "CUSTOMER";
        // Изискваме операторски метаданни за админ/оператор/аудитор роли.
        const operatorRoles = new Set(["ADMIN", "OPERATOR", "AUDITOR"]);
        const meta = (user.meta as Record<string, unknown>) ?? {};
        const operatorCode: string | undefined = (meta.operatorCode as string | undefined) ?? undefined;
        const firstName: string | null =
          (meta.firstName as string | null) ?? (meta.firstname as string | null) ?? null;
        const lastName: string | null = (meta.lastName as string | null) ?? (meta.lastname as string | null) ?? null;
        const activeFrom: Date | null =
          meta.activefrom ? new Date(meta.activefrom as string) : meta.activeFrom ? new Date(meta.activeFrom as string) : null;
        const activeTo: Date | null =
          meta.activeto ? new Date(meta.activeto as string) : meta.activeTo ? new Date(meta.activeTo as string) : null;
        const active: boolean = meta.active !== false;
        const now = new Date();
        const withinWindow = (!activeFrom || activeFrom <= now) && (!activeTo || activeTo >= now);

        // Enforce operator metadata for operator roles (ADMIN/OPERATOR/AUDITOR).
        if (operatorRoles.has(role)) {
          if (!operatorCode || active === false || !withinWindow) {
            return null;
          }
        }

        return {
          id: user.id as string,
          email: user.email as string,
          name: user.name as string | null,
          role,
          operatorCode,
          firstName,
          lastName,
          activeFrom: activeFrom ? activeFrom.toISOString() : null,
          activeTo: activeTo ? activeTo.toISOString() : null,
          active,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role ?? "CUSTOMER";
        token.operatorCode = (user as { operatorCode?: string }).operatorCode;
        token.firstName = (user as { firstName?: string | null }).firstName ?? null;
        token.lastName = (user as { lastName?: string | null }).lastName ?? null;
        token.activeFrom = (user as { activeFrom?: string | null }).activeFrom ?? null;
        token.activeTo = (user as { activeTo?: string | null }).activeTo ?? null;
        token.active = (user as { active?: boolean }).active ?? true;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.role = (token.role as string) ?? "ADMIN";
        session.user.operatorCode = (token.operatorCode as string | undefined) ?? undefined;
        session.user.firstName = (token.firstName as string | null) ?? null;
        session.user.lastName = (token.lastName as string | null) ?? null;
        session.user.activeFrom = (token.activeFrom as string | null) ?? null;
        session.user.activeTo = (token.activeTo as string | null) ?? null;
        session.user.active = (token.active as boolean | undefined) ?? true;
      }
      return session;
    },
  },
  events: {
    async signIn({ user }) {
      const operatorCode = (user as { operatorCode?: string; email?: string }).operatorCode ?? user.email ?? null;
      await logAudit({
        entity: "auth",
        action: "sign_in",
        newValue: { userId: user.id, role: (user as { role?: string }).role ?? null },
        operatorCode,
      });
    },
    async signOut({ token }) {
      const operatorCode = (token as { operatorCode?: string; email?: string }).operatorCode ?? token?.email ?? null;
      await logAudit({
        entity: "auth",
        action: "sign_out",
        newValue: { userId: token?.sub ?? null, role: (token as { role?: string }).role ?? null },
        operatorCode,
      });
    },
  },
};

const handler = NextAuth(authOptions);
export default handler;

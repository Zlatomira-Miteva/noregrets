import NextAuth, { type NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { pgPool } from "@/lib/pg";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/admin/login",
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
          `SELECT id, email, name, password, role FROM "User" WHERE email = $1 LIMIT 1`,
          [credentials.email],
        );
        const user = res.rows[0];
        if (!user?.password) return null;

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) return null;

        return {
          id: user.id as string,
          email: user.email as string,
          name: user.name as string | null,
          role: (user.role as string) ?? "ADMIN",
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role ?? "ADMIN";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.role = (token.role as string) ?? "ADMIN";
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export default handler;

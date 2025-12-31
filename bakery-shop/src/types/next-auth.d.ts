import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role?: string;
      operatorCode?: string;
      firstName?: string | null;
      lastName?: string | null;
      activeFrom?: string | null;
      activeTo?: string | null;
      active?: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    role: string;
    operatorCode?: string;
    firstName?: string | null;
    lastName?: string | null;
    activeFrom?: string | null;
    activeTo?: string | null;
    active?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
    operatorCode?: string;
    firstName?: string | null;
    lastName?: string | null;
    activeFrom?: string | null;
    activeTo?: string | null;
    active?: boolean;
  }
}

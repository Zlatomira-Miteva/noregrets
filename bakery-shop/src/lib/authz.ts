import type { Session } from "next-auth";

const nowUtc = () => new Date();

export const isOperatorActive = (session: Session | null): boolean => {
  if (!session?.user) return false;
  if (session.user.active === false) return false;
  if (!session.user.operatorCode) return false;

  const now = nowUtc();
  const activeFrom = session.user.activeFrom ? new Date(session.user.activeFrom) : null;
  const activeTo = session.user.activeTo ? new Date(session.user.activeTo) : null;

  if (activeFrom && activeFrom > now) return false;
  if (activeTo && activeTo < now) return false;
  return true;
};

export const isActiveAdmin = (session: Session | null): boolean => {
  // const bypass =
  //   process.env.NODE_ENV !== "production" ||
  //   process.env.ADMIN_DEV_BYPASS === "true" ||
  //   process.env.ALLOW_LOCAL_ADMIN_NO_OPERATOR === "true";
  // if (bypass && session?.user?.role === "ADMIN") return true;
  return session?.user?.role === "ADMIN" && isOperatorActive(session);
};

export const isAuditor = (session: Session | null): boolean => {
  return session?.user?.role === "AUDITOR" && isOperatorActive(session);
};

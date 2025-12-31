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
  return session?.user?.role === "ADMIN" && isOperatorActive(session);
};

export const isAuditor = (session: Session | null): boolean => {
  return session?.user?.role === "AUDITOR" && isOperatorActive(session);
};

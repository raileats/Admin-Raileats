export const SUPPORT_ALLOWED_PREFIXES = [
  "/admin/home",
  "/admin/orders",
  "/admin/restros",
  "/admin/trains",
  "/admin/stations",
] as const;

export const SUPPORT_BLOCKED_PREFIXES = [
  "/admin/restros/new/restro-user-password",
  "/admin/restros/new/credit-debit-note",
  "/admin/restros/new/settlement",
  "/admin/restros/new/statement",
  "/admin/restros/new/accounting",
] as const;

const SUPPORT_BLOCKED_RESTRO_SECTIONS = new Set([
  "restro-user-password",
  "credit-debit-note",
  "settlement",
  "statement",
  "accounting",
]);

export function normalizeUserType(userType?: string | null) {
  return (userType || "").trim().toLowerCase();
}

export function isSupportUser(userType?: string | null) {
  return normalizeUserType(userType) === "support";
}

export function filterNavItems<T extends { href: string }>(
  items: readonly T[],
  userType?: string | null
): T[] {
  if (!isSupportUser(userType)) {
    return [...items];
  }

  return items.filter((item) =>
    SUPPORT_ALLOWED_PREFIXES.some(
      (prefix) =>
        item.href === prefix || item.href.startsWith(`${prefix}/`)
    )
  );
}

export function isAdminPathAllowed(
  pathname: string,
  userType?: string | null
) {
  if (!isSupportUser(userType)) {
    return true;
  }

  const path = pathname.split("?")[0];

  if (
    SUPPORT_BLOCKED_PREFIXES.some(
      (prefix) => path === prefix || path.startsWith(`${prefix}/`)
    )
  ) {
    return false;
  }

  const restroPathMatch = path.match(
    /^\/admin\/restros\/[^/]+\/(?:edit\/)?([^/]+)/
  );
  if (
    restroPathMatch &&
    SUPPORT_BLOCKED_RESTRO_SECTIONS.has(restroPathMatch[1])
  ) {
    return false;
  }

  if (
    path === "/admin/login" ||
    path.startsWith("/admin/login/") ||
    path === "/admin/logout" ||
    path.startsWith("/admin/logout/")
  ) {
    return true;
  }

  if (path === "/admin" || path === "/admin/") {
    return true;
  }

  return SUPPORT_ALLOWED_PREFIXES.some((prefix) => {
    if (prefix === "/admin/home") {
      return (
        path === "/admin/home" || path.startsWith("/admin/home/")
      );
    }

    return path === prefix || path.startsWith(`${prefix}/`);
  });
}

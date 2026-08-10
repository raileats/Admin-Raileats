export const SUPPORT_ALLOWED_PREFIXES = [
  "/admin/home",
  "/admin/orders",
  "/admin/restros",
  "/admin/trains",
  "/admin/stations",
] as const;

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

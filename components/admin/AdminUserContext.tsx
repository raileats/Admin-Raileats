"use client";

import React, { createContext, useContext } from "react";

export type AdminUser = {
  id?: string;
  user_id?: string;
  user_type?: string;
  name?: string | null;
  mobile?: string | null;
  email?: string | null;
};

const AdminUserContext = createContext<AdminUser | null>(null);

export const AdminUserProvider = ({
  user,
  children,
}: {
  user: AdminUser | null;
  children: React.ReactNode;
}) => {
  return (
    <AdminUserContext.Provider value={user}>
      {children}
    </AdminUserContext.Provider>
  );
};

export const useAdminUser = () => useContext(AdminUserContext);

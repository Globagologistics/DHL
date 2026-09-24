import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import { AdminProvider } from "../contexts/AdminContext";
import { CustomerShell } from "../components/customer/CustomerShell";

export default function Root() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin");

  return (
    <AdminProvider>
      {isAdmin ? <Outlet /> : <CustomerShell><Outlet /></CustomerShell>}
    </AdminProvider>
  );
}

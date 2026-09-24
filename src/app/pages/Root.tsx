import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { AdminProvider } from "../contexts/AdminContext";
import { FloatingWhatsAppButton } from "../components/FloatingWhatsAppButton";

export default function Root() {
  const location = useLocation();
  const isOnboarding = location.pathname === "/";
  const isChat =
    location.pathname === "/chat" || location.pathname === "/admin/chat";
  const isAdmin = location.pathname.startsWith("/admin");
  const hideChrome = isOnboarding || isChat || isAdmin;

  return (
    <AdminProvider>
      <div className="min-h-screen flex flex-col overflow-x-hidden">
        {!hideChrome && <Navbar />}
        <main className={hideChrome ? "flex-1" : "flex-1 pt-20"}>
          <Outlet />
        </main>
        {!hideChrome && <Footer />}
        {!hideChrome && <FloatingWhatsAppButton />}
      </div>
    </AdminProvider>
  );
}

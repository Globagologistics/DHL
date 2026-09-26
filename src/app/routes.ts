import { createBrowserRouter } from "react-router-dom";
import Root from "./pages/Root";
import Home from "./pages/Home";
import Onboarding from "./pages/Onboarding";
import TrackShipmentSearch from "./pages/TrackShipmentSearch";
import TrackShipment from "./pages/TrackShipment";
import UserChat from "./pages/UserChat";
import Settings from "./pages/Settings";
import SendShipment from "./pages/SendShipment";
import About from "./pages/About";
import Locations from "./pages/Locations";
import Solutions from "./pages/Solutions";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import { Privacy, Terms } from "./pages/Legal";
import { AdminRouteGuard } from "./pages/AdminRouteGuard";
import AdminForm from "./pages/AdminForm";
import AdminDetail from "./pages/AdminDetail";
import AdminChat from "./pages/AdminChat";
import AdminNotifications from "./pages/AdminNotifications";
import AdminLayout from "./pages/AdminLayout";
import AdminShipments from "./pages/AdminShipments";
import AdminCreateShipment from "./pages/AdminCreateShipment";
import AdminRequests from "./pages/AdminRequests";
import AdminRequestReview from "./pages/AdminRequestReview";
import AdminEditShipment from "./pages/AdminEditShipment";
import PublicShipmentRequest from "./pages/PublicShipmentRequest";
import AdminShipmentDetail from "./pages/AdminShipmentDetail";
import AdminCustomers from "./pages/AdminCustomers";
import AdminSettings from "./pages/AdminSettings";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: Onboarding },
      { path: "home", Component: Home },
      { path: "learn-more", Component: Home },
      { path: "track", Component: TrackShipmentSearch },
      { path: "track-shipment", Component: TrackShipmentSearch },
      { path: "track/:id", Component: TrackShipment },
      { path: "track/:id/timeline", Component: TrackShipment },
      { path: "track-shipment/:id", Component: TrackShipment },
      { path: "chat", Component: UserChat },
      { path: "settings", Component: Settings },
      { path: "send-shipment", Component: SendShipment },
      { path: "shipment-request/new", Component: PublicShipmentRequest },
      { path: "locations", Component: Locations },
      { path: "solutions", Component: Solutions },
      { path: "about", Component: About },
      { path: "terms", Component: Terms },
      { path: "privacy", Component: Privacy },
      { path: "signin", Component: SignIn },
      { path: "signup", Component: SignUp },
      { path: "reset-password", Component: ResetPassword },
      {
        path: "admin",
        Component: AdminRouteGuard,
        children: [
          {
            Component: AdminLayout,
            children: [
              { index: true, lazy: async () => ({ Component: (await import("./pages/Admin")).default }) },
              { path: "shipments", Component: AdminShipments },
              { path: "shipments/new", Component: AdminCreateShipment },
              { path: "shipments/:id", Component: AdminShipmentDetail },
              { path: "shipments/:id/edit", Component: AdminEditShipment },
              { path: "requests", Component: AdminRequests },
              { path: "requests/:id", Component: AdminRequestReview },
              { path: "customers", Component: AdminCustomers },
              { path: "chat", Component: AdminChat },
              { path: "chat/:threadId", Component: AdminChat },
              { path: "notifications", Component: AdminNotifications },
              { path: "reports", lazy: async () => ({ Component: (await import("./pages/AdminReports")).default }) },
              { path: "settings", Component: AdminSettings },
              { path: "new", Component: AdminForm },
              { path: "edit/:id", Component: AdminForm },
              { path: "view/:id", Component: AdminDetail },
            ],
          },
        ],
      },
      { path: "*", Component: Home },
    ],
  },
], {
  // Use Vite-provided base URL so router works on Netlify and locally
  basename: import.meta.env.BASE_URL || '/',
});

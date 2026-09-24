import { createBrowserRouter } from "react-router-dom";
import Root from "./pages/Root";
import Home from "./pages/Home";
import Onboarding from "./pages/Onboarding";
import TrackShipmentSearch from "./pages/TrackShipmentSearch";
import TrackShipment from "./pages/TrackShipment";
import UserChat from "./pages/UserChat";
import About from "./pages/About";
import Locations from "./pages/Locations";
import Solutions from "./pages/Solutions";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import NotFound from "./pages/NotFound";
import { AdminRouteGuard } from "./pages/AdminRouteGuard";
import Admin from "./pages/Admin";
import AdminForm from "./pages/AdminForm";
import AdminDetail from "./pages/AdminDetail";
import AdminChat from "./pages/AdminChat";
import AdminNotifications from "./pages/AdminNotifications";
import AdminLayout from "./pages/AdminLayout";

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
      { path: "track-shipment/:id", Component: TrackShipment },
      { path: "chat", Component: UserChat },
      { path: "locations", Component: Locations },
      { path: "solutions", Component: Solutions },
      { path: "about", Component: About },
      { path: "signin", Component: SignIn },
      { path: "signup", Component: SignUp },
      {
        path: "admin",
        Component: AdminRouteGuard,
        children: [
          {
            Component: AdminLayout,
            children: [
              { index: true, Component: Admin },
              { path: "chat", Component: AdminChat },
              { path: "notifications", Component: AdminNotifications },
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

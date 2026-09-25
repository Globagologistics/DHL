import React from "react";
import { RouterProvider } from "react-router";
import { router } from "./routes";
import { HumanVerificationGate } from './components/HumanVerificationGate';

export default function App() {
  return <HumanVerificationGate><RouterProvider router={router} /></HumanVerificationGate>;
}

import React from "react";
import { Link } from "react-router";
import { motion } from "motion/react";
import { PackageX, Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-white px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-lg"
      >
        <div className="mb-8">
          <div className="w-32 h-32 bg-gradient-to-br from-[#2563EB] to-[#38BDF8] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
            <PackageX className="w-16 h-16 text-white" />
          </div>
          <h1 className="text-6xl font-bold text-[#0F1F3D] mb-4">404</h1>
          <h2 className="text-3xl font-semibold text-gray-800 mb-4">
            Page Not Found
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Looks like this package got lost in transit. Let's get you back on track!
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/"
            className="px-8 py-3 bg-gradient-to-r from-[#2563EB] to-[#38BDF8] text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-blue-500/50 transition-all duration-300 flex items-center justify-center gap-2"
          >
            <Home className="w-5 h-5" />
            Go Home
          </Link>
          <button
            onClick={() => window.history.back()}
            className="px-8 py-3 bg-white text-[#0F1F3D] font-semibold rounded-xl border-2 border-gray-200 hover:border-[#2563EB] hover:bg-gray-50 transition-all duration-300 flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Go Back
          </button>
        </div>
      </motion.div>
    </div>
  );
}

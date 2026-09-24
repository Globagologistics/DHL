import React from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { Package } from "lucide-react";

export default function SignUp() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-white py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3 mb-6">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#2563EB] to-[#38BDF8] flex items-center justify-center shadow-xl">
              <Package className="w-8 h-8 text-white" />
            </div>
          </Link>
          <h1 className="text-3xl font-bold text-[#0F1F3D] mb-2">
            Registration Closed
          </h1>
          <p className="text-gray-600">
            Accounts are created and managed by Buske Logistics.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 text-center">
          <p className="text-gray-600 mb-6">
            Please contact the company if you need access to an account.
          </p>
          <Link
            to="/signin"
            className="block w-full py-3 px-4 bg-[#2563EB] text-white font-semibold rounded-xl hover:bg-[#1D4ED8] transition-all duration-300 text-center"
          >
            Go to Sign In
          </Link>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-6">
          <Link
            to="/"
            className="text-sm text-gray-600 hover:text-[#2563EB] transition-colors"
          >
            ← Back to Home
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

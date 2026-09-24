import React from 'react';
import { motion } from 'motion/react';
import { MessageCircle } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

export function FloatingWhatsAppButton() {
  const location = useLocation();
  const navigate = useNavigate();

  // Hide on admin dashboard pages and chat view
  if (location.pathname.startsWith('/admin') || location.pathname === '/chat') {
    return null;
  }

  return (
    <motion.button
      type="button"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.5, type: 'spring' }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => navigate('/chat')}
      className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-br from-[#2563EB] to-[#1D4ED8] rounded-full flex items-center justify-center shadow-2xl hover:shadow-blue-500/40 transition-all duration-300"
      aria-label="Open live support chat"
    >
      <div className="absolute inset-0 rounded-full bg-blue-500 opacity-0 animate-pulse" />
      <MessageCircle className="w-7 h-7 text-white relative z-10" />
    </motion.button>
  );
}

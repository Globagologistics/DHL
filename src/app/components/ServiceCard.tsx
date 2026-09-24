import { motion } from "motion/react";
import { LucideIcon } from "lucide-react";

interface ServiceCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  index?: number;
}

export function ServiceCard({ icon: Icon, title, description, index = 0 }: ServiceCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      viewport={{ once: true }}
      whileHover={{ y: -8, scale: 1.02 }}
      className="group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 overflow-hidden"
    >
      {/* Gradient Overlay on Hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#2563EB]/5 to-[#38BDF8]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      {/* Content */}
      <div className="relative z-10">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#2563EB] to-[#38BDF8] flex items-center justify-center mb-6 shadow-lg group-hover:shadow-xl group-hover:shadow-blue-500/30 transition-all duration-300">
          <Icon className="w-8 h-8 text-white" />
        </div>
        
        <h3 className="text-xl font-semibold text-[#0F1F3D] mb-3 group-hover:text-[#2563EB] transition-colors duration-300">
          {title}
        </h3>
        
        <p className="text-gray-600 leading-relaxed">
          {description}
        </p>
      </div>

      {/* Hover Border Effect */}
      <div className="absolute inset-0 rounded-2xl ring-2 ring-transparent group-hover:ring-[#38BDF8]/30 transition-all duration-300" />
    </motion.div>
  );
}

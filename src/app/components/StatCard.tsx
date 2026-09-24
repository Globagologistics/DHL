import { motion } from "motion/react";
import { LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";

interface StatCardProps {
  icon: LucideIcon;
  value: string;
  label: string;
  index?: number;
}

export function StatCard({ icon: Icon, value, label, index = 0 }: StatCardProps) {
  const [displayValue, setDisplayValue] = useState("0");
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    if (hasAnimated) return;
    
    const numericValue = parseInt(value.replace(/[^0-9]/g, ""));
    if (isNaN(numericValue)) {
      setDisplayValue(value);
      return;
    }

    const duration = 2000;
    const steps = 60;
    const stepValue = numericValue / steps;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      if (currentStep >= steps) {
        setDisplayValue(value);
        clearInterval(timer);
        setHasAnimated(true);
      } else {
        const currentValue = Math.floor(stepValue * currentStep);
        setDisplayValue(value.replace(/[0-9.]+/, currentValue.toString()));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value, hasAnimated]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      whileInView={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      viewport={{ once: true }}
      onViewportEnter={() => !hasAnimated && setHasAnimated(false)}
      className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 text-center border border-white/20 hover:bg-white/15 transition-all duration-300 group"
    >
      <div className="flex justify-center mb-4">
        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#38BDF8] to-[#2563EB] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
          <Icon className="w-7 h-7 text-white" />
        </div>
      </div>
      <div className="text-4xl font-bold text-white mb-2 tabular-nums">
        {displayValue}
      </div>
      <div className="text-gray-300 font-medium">
        {label}
      </div>
    </motion.div>
  );
}

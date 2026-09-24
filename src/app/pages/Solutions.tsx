import React from "react";
import { motion } from "motion/react";
import {
  Warehouse,
  Package,
  TrendingUp,
  Globe,
  ShoppingCart,
  Zap,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

export default function Solutions() {
  const mainSolutions = [
    {
      icon: Warehouse,
      title: "Contract Warehousing",
      description: "Dedicated and shared warehouse facilities tailored to your business requirements.",
      features: [
        "Temperature controlled storage options",
        "State-of-the-art inventory management systems",
        "Flexible lease terms and scalable space",
        "24/7 security and surveillance",
        "Real-time inventory visibility",
      ],
      benefits: [
        "Reduce capital expenditure on facility infrastructure",
        "Scale storage capacity based on demand",
        "Access to prime locations nationwide",
        "Professional warehouse management expertise",
      ],
      image: "https://cdn.prod.website-files.com/65eb5e8c0ab92f839985c896/66bced8a962a20cd836bc809_E-commerce%20pick%20and%20pack%20(2).jpg",
    },
    {
      icon: Package,
      title: "Value-Added Services",
      description: "Specialized logistics services that transform raw goods into market-ready products.",
      features: [
        "Kitting and assembly operations",
        "Labeling and packaging customization",
        "Retail display builds and preparation",
        "Light assembly and configuration",
        "Quality control and inspection",
      ],
      benefits: [
        "Accelerate time-to-market for your products",
        "Optimize last-mile efficiency",
        "Reduce handling and transportation costs",
        "Enhance product presentation and customer satisfaction",
      ],
      image: "https://cdn.prod.website-files.com/65eb5e8c0ab92f839985c896/66bced8a962a20cd836bc809_E-commerce%20pick%20and%20pack%20(2).jpg",
    },
    {
      icon: TrendingUp,
      title: "Automotive Sequencing",
      description: "Just-in-time (JIT) delivery solutions optimized for automotive manufacturing lines.",
      features: [
        "Synchronized delivery scheduling",
        "Parts sequencing and organization",
        "Dedicated transportation management",
        "Precise timing coordination with production",
        "Line-side delivery capabilities",
      ],
      benefits: [
        "Minimize inventory holding on production lines",
        "Reduce manufacturing cycle times",
        "Optimize space utilization",
        "Maintain production continuity and efficiency",
      ],
      image: "https://cdn.prod.website-files.com/65eb5e8c0ab92f839985c896/695d88b2dd970bb6c858c9d2_Buske%20Logistics%20-%20Interstate.jpg",
    },
    {
      icon: Globe,
      title: "International Logistics",
      description: "Comprehensive cross-border solutions connecting your business to global markets.",
      features: [
        "Customs brokerage and documentation",
        "Ocean and air freight services",
        "Multi-modal transportation options",
        "International compliance expertise",
        "Trade agreement navigation",
      ],
      benefits: [
        "Expand into new international markets with confidence",
        "Navigate complex customs and regulatory requirements",
        "Optimize shipping methods for cost and speed",
        "Access established networks across 105+ countries",
      ],
      image: "https://cdn.prod.website-files.com/65eb5e8c0ab92f839985c896/673bbe8feeaca39b59ef5511_Big%20Buske%20Semi%20Truck-p-800.jpg",
    },
    {
      icon: ShoppingCart,
      title: "E-Commerce Fulfillment",
      description: "End-to-end fulfillment solutions designed for online retailers and direct-to-consumer brands.",
      features: [
        "Order picking and packing optimization",
        "Multi-channel order management",
        "Returns processing and restocking",
        "Fast and accurate order fulfillment",
        "Branded packaging options",
      ],
      benefits: [
        "Improve order accuracy and speed",
        "Enhance customer satisfaction with fast delivery",
        "Scale fulfillment without adding overhead",
        "Reduce fulfillment costs per order",
      ],
      image: "https://cdn.prod.website-files.com/65eb5e8c0ab92f839985c923/67e2ff9fa7e702983a50e2bd_Exterior%20view%20of%20a%20Buske%20Logistics%20warehouse%20facility%20in%20Olive%20Branch%2C%20Mississippi%20-%2011865.jpg",
    },
    {
      icon: Zap,
      title: "3PL Solutions",
      description: "Complete third-party logistics management for businesses of all sizes.",
      features: [
        "End-to-end supply chain management",
        "Inventory optimization and planning",
        "Transportation and logistics coordination",
        "Technology platform integration",
        "Performance analytics and reporting",
      ],
      benefits: [
        "Focus on core business operations while we handle logistics",
        "Reduce overall supply chain costs",
        "Gain visibility into every step of the process",
        "Access industry expertise and best practices",
      ],
      image: "https://secchi.io/wp-content/smush-webp/2024/08/JCi-238.jpg.webp",
    },
  ];

  const industryServed = [
    {
      name: "Food & Beverage",
      description: "Temperature-controlled solutions for perishable goods and specialty handling.",
    },
    {
      name: "Automotive",
      description: "High-precision JIT delivery and sequencing for automotive manufacturers.",
    },
    {
      name: "Aerospace & Defense",
      description: "Secure, compliant handling of sensitive and regulated components.",
    },
    {
      name: "Healthcare & Pharmaceuticals",
      description: "Compliance-focused solutions with rigorous quality control.",
    },
    {
      name: "Retail & E-Commerce",
      description: "High-volume fulfillment with exceptional accuracy and speed.",
    },
    {
      name: "Industrial Manufacturing",
      description: "Complex supply chain solutions for industrial equipment and parts.",
    },
  ];

  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="relative py-24 bg-gradient-to-br from-[#0F1F3D] via-[#1A365D] to-[#2563EB] overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnptLTEyIDEyYzMuMzE0IDAgNiAyLjY4NiA2IDZzLTIuNjg2IDYtNiA2LTYtMi42ODYtNi02IDIuNjg2LTYgNi02eiIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utd2lkdGg9IjIiLz48L2c+PC9zdmc+')] " />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Our Solutions
            </h1>
            <p className="text-xl md:text-2xl text-gray-200 max-w-3xl mx-auto">
              Comprehensive logistics and supply chain solutions designed to optimize your operations and reduce costs across every stage of your business.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Main Solutions Grid */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-[#0F1F3D] mb-4">
              Core Logistics Solutions
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Leverage our expertise across all major logistics and supply chain functions.
            </p>
          </motion.div>

          <div className="space-y-16">
            {mainSolutions.map((solution, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className={`grid grid-cols-1 md:grid-cols-2 gap-12 items-center ${
                  index % 2 === 1 ? "md:grid-flow-dense" : ""
                }`}
              >
                {/* Image */}
                <div
                  className={index % 2 === 1 ? "md:col-start-2" : ""}
                >
                  <div className="aspect-[4/3] rounded-xl overflow-hidden shadow-lg">
                    <img
                      src={solution.image}
                      alt={solution.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                {/* Content */}
                <div className={index % 2 === 1 ? "md:col-start-1" : ""}>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <solution.icon className="w-6 h-6 text-[#2563EB]" />
                    </div>
                    <h3 className="text-3xl font-bold text-[#0F1F3D]">
                      {solution.title}
                    </h3>
                  </div>

                  <p className="text-lg text-gray-600 mb-6">
                    {solution.description}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-[#0F1F3D] mb-3 flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-[#10B981]" />
                        Key Features
                      </h4>
                      <ul className="space-y-2">
                        {solution.features.map((feature, idx) => (
                          <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                            <span className="text-[#2563EB] mt-1">•</span>
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-semibold text-[#0F1F3D] mb-3 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-[#10B981]" />
                        Benefits
                      </h4>
                      <ul className="space-y-2">
                        {solution.benefits.map((benefit, idx) => (
                          <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                            <span className="text-[#10B981] mt-1">✓</span>
                            {benefit}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Industries Served */}
      <section className="py-24 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-[#0F1F3D] mb-4">
              Industries We Serve
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Specialized expertise across diverse industries with tailored solutions for unique challenges.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {industryServed.map((industry, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl p-8 shadow-md hover:shadow-lg transition-all duration-300 border-l-4 border-[#2563EB]"
              >
                <h3 className="text-xl font-bold text-[#0F1F3D] mb-3">
                  {industry.name}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {industry.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Buske for Solutions */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-[#0F1F3D] mb-4">
              Why Partner with Buske Logistics?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Over 100 years of expertise delivering exceptional results.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: "Proven Expertise",
                description: "100+ years of logistics experience across multiple industries and regions.",
              },
              {
                title: "Scalable Solutions",
                description: "Grow with us - our solutions scale from startups to Fortune 500 companies.",
              },
              {
                title: "Technology-Driven",
                description: "Advanced systems for visibility, tracking, and optimization across your supply chain.",
              },
              {
                title: "Global Reach",
                description: "40+ locations with worldwide capability for seamless international operations.",
              },
              {
                title: "Dedicated Support",
                description: "24/7 customer support and dedicated account management for your business.",
              },
              {
                title: "Cost Optimization",
                description: "Strategic approach to reduce costs while maintaining service excellence.",
              },
            ].map((reason, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-8 border border-blue-100"
              >
                <div className="w-12 h-12 bg-[#2563EB] rounded-lg flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-[#0F1F3D] mb-2">
                  {reason.title}
                </h3>
                <p className="text-gray-600">
                  {reason.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-[#0F1F3D] to-[#2563EB] text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ready to Optimize Your Logistics?
            </h2>
            <p className="text-xl text-gray-100 mb-10 max-w-2xl mx-auto">
              Let's discuss how our solutions can transform your supply chain and drive your business forward.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="px-8 py-4 bg-white text-[#2563EB] font-semibold rounded-xl hover:bg-gray-50 transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2">
                Get Started
                <ArrowRight className="w-5 h-5" />
              </button>
              <button className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-xl border border-white/20 hover:bg-white/20 transition-all duration-300">
                Schedule Demo
              </button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

import React from "react";
import { motion } from "motion/react";
import {
  Globe,
  Warehouse,
  Truck,
  Package,
  Users,
  MapPin,
  Phone,
  DollarSign,
  Target,
  Shield,
  Zap,
} from "lucide-react";
import { StatCard } from "../components/StatCard";
import { ServiceCard } from "../components/ServiceCard";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";

export default function About() {
  const stats = [
    { icon: Globe, value: "105+", label: "Countries" },
    { icon: Warehouse, value: "500+", label: "Warehouses" },
    { icon: Truck, value: "6.5k+", label: "Fleet Vehicles" },
    { icon: Package, value: "100M+", label: "Packages" },
    { icon: Users, value: "15k+", label: "Employees" },
  ];

  const services = [
    {
      icon: Target,
      title: "Door-to-Door",
      description: "Complete end-to-end delivery service from pickup to final destination with white-glove handling.",
    },
    {
      icon: Globe,
      title: "Global Cargo",
      description: "Worldwide freight forwarding services with customs clearance and documentation support.",
    },
    {
      icon: Package,
      title: "Any Size Package",
      description: "From small parcels to oversized cargo, we handle shipments of all dimensions and weights.",
    },
    {
      icon: DollarSign,
      title: "Affordable Pricing",
      description: "Competitive rates with transparent pricing and no hidden fees for all your logistics needs.",
    },
  ];

  const offices = [
    {
      name: "USA Headquarters",
      address: "4521 Innovation Drive",
      city: "Charlotte, NC 28202",
      phone: "+1(336)4596552",
      region: "Americas",
    },
    {
      name: "France Regional Office",
      address: "45 Rue de la Logistique",
      city: "Paris, 75008",
      phone: "+33 1 23 45 67 89",
      region: "Europe",
    },
    {
      name: "Australia Hub",
      address: "78 Cargo Street",
      city: "Sydney, NSW 2000",
      phone: "+61 2 9876 5432",
      region: "Asia-Pacific",
    },
  ];

  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="relative py-24 bg-gradient-to-br from-[#0F1F3D] via-[#1A365D] to-[#2563EB] overflow-hidden">
        <img
          src="https://thumbs.dreamstime.com/b/modern-logistics-transportation-concept-technology-integration-generative-ai-modern-logistics-transportation-concept-321114991.jpg"
          alt="logistics background"
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover opacity-16 pointer-events-none"
        />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Redefining Global Logistics Since 1998
            </h1>
            <p className="text-xl md:text-2xl text-gray-200 max-w-3xl mx-auto">
              Connecting the world, one package at a time
            </p>
          </motion.div>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            {/* Story */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl font-bold text-[#0F1F3D] mb-6">
                Our Story
              </h2>
              <div className="space-y-4 text-gray-700 leading-relaxed">
                <p>
                  Founded in 1998, Buske Logistics emerged from a simple vision: to make international logistics accessible, reliable, and transparent for businesses of all sizes. What started as a small freight forwarding operation in New York has grown into a global network spanning over 105 countries.
                  international logistics accessible, reliable, and transparent for
                  businesses of all sizes. What started as a small freight forwarding
                  operation in New York has grown into a global network spanning over
                  105 countries.
                </p>
                <p>
                  Over the past 28 years, we've continuously innovated our services,
                  investing in cutting-edge technology and expanding our infrastructure
                  to meet the evolving needs of global commerce. Today, we operate 500+
                  warehouses, manage a fleet of 6,500+ vehicles, and employ 15,000+
                  logistics professionals worldwide.
                </p>
                <p>
                  Our commitment to excellence has enabled us to successfully deliver
                  over 100 million packages, earning the trust of thousands of
                  businesses globally. We don't just move packages—we build bridges
                  between markets, cultures, and opportunities.
                </p>
                <p>
                  At Buske Logistics, we believe that every shipment tells a story, and we're committed to delivering it with the care and professionalism it deserves.
                  honored to be part of yours. Our mission is to provide seamless,
                  secure, and sustainable logistics solutions that empower businesses
                  to reach new horizons.
                </p>
              </div>
            </motion.div>

            {/* CEO Message */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="bg-gradient-to-br from-[#2563EB]/5 to-[#38BDF8]/5 rounded-2xl p-8 border-l-4 border-[#2563EB] shadow-xl">
                <div className="flex items-center gap-4 mb-6">
                  <ImageWithFallback
                    src="https://static.vecteezy.com/system/resources/thumbnails/027/933/307/small_2x/happy-middle-aged-business-man-ceo-standing-in-office-arms-crossed-ai-generated-photo.jpg"
                    alt="John Davidson"
                    className="w-16 h-16 rounded-full object-cover shadow-lg"
                  />
                  <div>
                    <div className="font-semibold text-lg text-[#0F1F3D]">
                      John Davidson
                    </div>
                    <div className="text-sm text-gray-600">CEO & Founder</div>
                  </div>
                </div>

                <blockquote className="relative">
                  <div className="text-6xl text-[#2563EB]/20 font-serif leading-none mb-2">
                    "
                  </div>
                  <p className="text-gray-700 italic leading-relaxed mb-4">
                    Our success is measured not just in packages delivered, but in
                    relationships built and promises kept. Every day, our team works
                    tirelessly to ensure your shipments arrive safely, on time, and
                    with the care they deserve. Thank you for trusting Buske Logistics with
                    your most important deliveries.
                  </p>
                  <div className="text-right">
                    <div className="inline-block">
                      <div className="font-semibold text-[#0F1F3D]">
                        John Davidson
                      </div>
                      <div className="text-sm text-gray-600">CEO & Founder</div>
                    </div>
                  </div>
                </blockquote>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Statistics Grid */}
      <section className="py-24 bg-gradient-to-br from-[#0F1F3D] via-[#1A365D] to-[#0F1F3D] relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnptLTEyIDEyYzMuMzE0IDAgNiAyLjY4NiA2IDZzLTIuNjg2IDYtNiA2LTYtMi42ODYtNi02IDIuNjg2LTYgNi02eiIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utd2lkdGg9IjIiLz48L2c+PC9zdmc+')] " />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Global Impact in Numbers
            </h2>
            <p className="text-xl text-gray-300">
              Delivering excellence across continents
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {stats.map((stat, index) => (
              <StatCard key={index} {...stat} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-24 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-[#0F1F3D] mb-4">
              Our Services
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Comprehensive logistics solutions tailored to your needs
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((service, index) => (
              <ServiceCard key={index} {...service} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* Global Offices */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-[#0F1F3D] mb-4">
              Global Offices
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Strategically located to serve you better
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {offices.map((office, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="group relative bg-gradient-to-br from-white to-gray-50 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-200 overflow-hidden"
              >
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#2563EB]/5 to-[#38BDF8]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Region Badge */}
                <div className="absolute top-6 right-6">
                  <span className="px-3 py-1 bg-gradient-to-r from-[#2563EB] to-[#38BDF8] text-white text-xs font-semibold rounded-full shadow-lg">
                    {office.region}
                  </span>
                </div>

                <div className="relative z-10">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#2563EB] to-[#38BDF8] flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <MapPin className="w-8 h-8 text-white" />
                  </div>

                  <h3 className="text-xl font-semibold text-[#0F1F3D] mb-4">
                    {office.name}
                  </h3>

                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-[#2563EB] mt-0.5 flex-shrink-0" />
                      <div className="text-gray-600">
                        <div>{office.address}</div>
                        <div>{office.city}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Phone className="w-5 h-5 text-[#2563EB] flex-shrink-0" />
                      <a
                        href={`tel:${office.phone}`}
                        className="text-gray-600 hover:text-[#2563EB] transition-colors"
                      >
                        {office.phone}
                      </a>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission & Values */}
      <section className="py-24 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-[#0F1F3D] mb-4">
              Our Mission & Values
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Shield,
                title: "Trust & Security",
                description:
                  "We treat every shipment with the utmost care and security, building lasting relationships through reliability.",
              },
              {
                icon: Zap,
                title: "Speed & Efficiency",
                description:
                  "Time is valuable. Our optimized logistics network ensures fast, efficient delivery across the globe.",
              },
              {
                icon: Globe,
                title: "Global Reach",
                description:
                  "No destination is too far. Our worldwide network connects businesses to opportunities everywhere.",
              },
            ].map((value, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#2563EB] to-[#38BDF8] flex items-center justify-center mx-auto mb-6 shadow-xl">
                  <value.icon className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-semibold text-[#0F1F3D] mb-3">
                  {value.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {value.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

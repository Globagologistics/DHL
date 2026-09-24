import React, { useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import {
  Plane,
  Ship,
  Truck,
  Globe,
  Package,
  Shield,
  Clock,
  HeadphonesIcon,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { StatCard } from "../components/StatCard";
import { TestimonialCard } from "../components/TestimonialCard";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";

export default function Home() {
  const [trackingId, setTrackingId] = useState("");
  const navigate = useNavigate();

  // modal stages for sending item flow
  const [modalStage, setModalStage] = useState<
    'none' | 'prompt' | 'notfound' | 'signuperror'
  >('none');

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (trackingId.trim()) {
      navigate(`/track/${encodeURIComponent(trackingId)}`);
    }
  };

  const services = [
    {
      icon: Truck,
      title: "Auto Transport",
      description: "Specialized vehicle transport for cars and motorcycles with secure loading and GPS tracking.",
      imageUrl: "https://cdn.tempuslogix.com/wp-content/webp-express/webp-images/uploads/2021/08/car-transport-1024x683.jpeg.webp",
    },
    {
      icon: Ship,
      title: "Container Shipment",
      description: "Robust containerized solutions for heavy-duty and bulk cargo with customs support worldwide.",
      imageUrl: "https://morethanshipping.com/wp-content/uploads/2020/10/shipping-container-types.jpg",
    },
    {
      icon: Plane,
      title: "Air & Express",
      description: "Fast air shipment options for urgent parcels — lightweight or heavy, door-to-door express available.",
      imageUrl: "https://maritimasureste.com/en/wp-content/uploads/sites/3/2021/07/Envio-express-aereo-de-paqueteria-on-board-courier.jpg",
    },
    {
      icon: Globe,
      title: "Door-to-Door Delivery",
      description: "End-to-end delivery with last-mile options, including eco-friendly drone delivery for select routes.",
      imageUrl: "https://www.flyingglass.com.au/wp-content/uploads/2025/09/delivery-drones-future-logistics.jpg",
    },
  ];

  const stats = [
    { icon: Globe, value: "105+", label: "Countries Served" },
    { icon: Package, value: "100M+", label: "Packages Delivered" },
    { icon: Truck, value: "6.5k+", label: "Fleet Vehicles" },
  ];

  const features = [
    {
      icon: Clock,
      title: "24/7 Live Tracking",
      description: "Monitor your shipment in real-time from pickup to delivery with our advanced tracking system.",
    },
    {
      icon: Shield,
      title: "Worldwide Security",
      description: "Industry-leading security protocols and comprehensive insurance for complete peace of mind.",
    },
    {
      icon: HeadphonesIcon,
      title: "Localized Support",
      description: "Expert customer support in your language, available around the clock in every region we serve.",
    },
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      location: "New York, USA",
      rating: 5,
      comment: "Buske Logistics has transformed our international shipping. The tracking system is incredibly accurate and customer service is outstanding.",
    },
    {
      name: "Michael Chen",
      location: "Shanghai, China",
      rating: 5,
      comment: "Reliable, fast, and professional. We've been using Buske Logistics for 3 years and they never disappoint. Highly recommended!",
    },
    {
      name: "Emma Williams",
      location: "London, UK",
      rating: 5,
      comment: "The most trustworthy logistics partner we've ever worked with. Buske's worldwide network is truly impressive.",
    },
  ];

  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#0B1220] via-[#0F1F3D] to-[#1A365D]">
        {/* Hero background image */}
        <img
          src="https://www.dhl.com/discover/adobe/dynamicmedia/deliver/dm-aid--43e883dc-6efc-4f88-9f34-480b59968105/inline-images-800x450-5.jpg?width=900&preferwebp=true&quality=82"
          alt="international trade background"
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover opacity-45"
        />
        <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(0,0,0,0.95)_0%,rgba(0,0,0,0.75)_45%,rgba(0,0,0,0.35)_75%,rgba(0,0,0,0)_95%)]" />

        {/* Gradient Orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#2563EB] rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-[#38BDF8] rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Logo */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, type: "spring" }}
            className="flex justify-center mb-8"
          >
            <img
              src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTwdV07RyApr_mVZOJRk3Rht0P98deLiSYB0Q&s"
              alt="Buske Logistics logo"
              className="w-20 h-20 rounded-full object-cover shadow-2xl shadow-blue-500/30"
            />
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight"
          >
            Buske Logistics
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-xl md:text-2xl text-gray-300 mb-12 font-light"
          >
            Your Trusted Global Logistics Partner
          </motion.p>

          {/* Tracking Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="max-w-2xl mx-auto"
          >
            <form onSubmit={handleTrack} className="relative">
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-2 border border-white/20 shadow-2xl">
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={trackingId}
                    onChange={(e) => setTrackingId(e.target.value)}
                    placeholder="Enter Tracking ID (e.g. GG-2026-001)"
                    className="flex-1 px-6 py-4 bg-white/90 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#38BDF8] text-gray-900 placeholder-gray-500"
                  />
                  <button
                    type="submit"
                    className="px-8 py-4 bg-gradient-to-r from-[#2563EB] to-[#38BDF8] text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-blue-500/50 transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2"
                  >
                    Track Shipment
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </form>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-4 mt-8">
              <button
                onClick={() => navigate("/signin")}
                className="px-6 py-3 bg-white/10 backdrop-blur-sm text-white font-medium rounded-xl border border-white/20 hover:bg-white/20 transition-all duration-300"
              >
                Sign In
              </button>
              <button
                onClick={() => navigate("/signin")}
                className="px-6 py-3 bg-white/10 backdrop-blur-sm text-white font-medium rounded-xl border border-white/20 hover:bg-white/20 transition-all duration-300"
              >
                Sign Up
              </button>
              <button
                onClick={() => setModalStage('prompt')}
                className="px-6 py-3 bg-gradient-to-r from-[#10B981] to-[#059669] text-white font-medium rounded-xl hover:shadow-lg hover:shadow-green-500/30 transition-all duration-300 hover:scale-105"
              >
                Send Item
              </button>
            </div>

            {/* Send item modal / prompts */}
            {modalStage === 'prompt' && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
                  <p className="text-gray-800">
                    You must log in or sign up to send packages.
                  </p>
                  <div className="mt-6 flex justify-end gap-4">
                    <button
                      onClick={() => navigate('/signin')}
                      className="px-4 py-2 bg-green-500 text-white rounded-md"
                    >
                      Sign Up
                    </button>
                    <button
                      onClick={() => navigate('/signin')}
                      className="px-4 py-2 bg-blue-500 text-white rounded-md"
                    >
                      Log In
                    </button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <div className="w-6 h-10 rounded-full border-2 border-white/30 flex items-start justify-center p-2">
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-1.5 h-1.5 bg-white rounded-full"
            />
          </div>
        </motion.div>
      </section>

      {/* Solutions Section */}
      <section id="services" className="py-24 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-[#0F1F3D] mb-4">
              Comprehensive 3PL Warehousing Services
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Customized warehousing and logistics solutions down to the last detail. With over 100 years of experience in business, we possess the expertise to deliver effective logistics solutions.
            </p>
            <button className="mt-6 px-6 py-2 bg-[#2563EB] text-white font-semibold rounded-lg hover:bg-[#1e4a9b] transition-colors">
              Learn More
            </button>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { title: "Contract Warehousing", icon: "📦" },
              { title: "Value-Added Services", icon: "⚙️" },
              { title: "Sequencing", icon: "🔄" },
              { title: "Supply Chain Consulting", icon: "👥" },
              { title: "Retail Logistics", icon: "🛒" },
              { title: "E-Commerce", icon: "📦" },
            ].map((solution, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer border border-gray-100"
              >
                <div className="text-5xl mb-4">{solution.icon}</div>
                <h3 className="text-xl font-bold text-[#0F1F3D] mb-2">{solution.title}</h3>
                <p className="text-gray-600 text-sm">Specialized solutions tailored to your business needs</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Industries We Serve Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-[#0F1F3D] mb-4">
              Who We Serve
            </h2>
            <p className="text-lg text-gray-600 mb-4 max-w-2xl mx-auto">
              Versatile 3PL warehousing solutions across a variety of industries. Whatever the industry is, we have turn-key solutions for your business.
            </p>
            <button className="px-6 py-2 bg-[#2563EB] text-white font-semibold rounded-lg hover:bg-[#1e4a9b] transition-colors">
              Learn More
            </button>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: "Automotive",
                image: "https://cdn.prod.website-files.com/65eb5e8c0ab92f839985c896/66bced8a962a20cd836bc809_E-commerce%20pick%20and%20pack%20(2).jpg",
              },
              {
                title: "Healthcare",
                image: "https://cdn.prod.website-files.com/65eb5e8c0ab92f839985c896/69600440a78e98c7a17e8266_Inside%20Buske%20Logistics%203PL%20warehouse%20and%20fulfillment%20center%20in%20Sugar%20Land%2C%20TX.jpg",
              },
              {
                title: "Aerospace",
                image: "https://cdn.prod.website-files.com/65eb5e8c0ab92f839985c896/696c14a3d9e89c9722c7a40e_Inside%20an%20ecommerce%20fulfillment%20solution%20center%20facility.jpg",
              },
              {
                title: "Industrials",
                type: "video",
                embedUrl: "https://www.youtube.com/embed/vuAEjpZ4IEI",
              },
              {
                title: "Food & Beverage",
                image: "https://cdn.prod.website-files.com/65eb5e8c0ab92f839985c896/66bcd6e30e7382e0b2244e2d_Bottling%20Line.jpg",
              },
              {
                title: "Retail & Distributors",
                image: "https://cdn.prod.website-files.com/65eb5e8c0ab92f839985c896/65f09e6f0ef1ec08e5292b4d_Fairfield%20Overhead-p-800.png",
              },
            ].map((industry, index) => {
              const isVideo = "embedUrl" in industry;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="group relative h-64 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer"
                >
                  {isVideo ? (
                    <div className="absolute inset-0">
                      <iframe
                        src={industry.embedUrl}
                        title="Buske Logistics Automotive Parts Sequencing"
                        className="h-full w-full"
                        frameBorder={0}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        referrerPolicy="strict-origin-when-cross-origin"
                        allowFullScreen
                      />
                    </div>
                  ) : (
                    <img
                      src={industry.image}
                      alt={industry.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  )}
                  <div
                    className={`absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-all duration-300 flex items-end ${
                      isVideo ? 'pointer-events-none' : ''
                    }`}
                  >
                    <div className="w-full p-6">
                      <h3 className="text-xl font-bold text-white">{industry.title}</h3>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-24 bg-gradient-to-br from-[#0F1F3D] via-[#1A365D] to-[#0F1F3D] relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnptLTEyIDEyYzMuMzE0IDAgNiAyLjY4NiA2IDZzLTIuNjg2IDYtNiA2LTYtMi42ODYtNi02IDIuNjg2LTYgNi02eiIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utd2lkdGg9IjIiLz48L2c+PC9zdmc+')] " />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {stats.map((stat, index) => (
              <StatCard key={index} {...stat} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Image */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&h=600&fit=crop"
                  alt="Global logistics operations"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-gradient-to-br from-[#2563EB] to-[#38BDF8] rounded-2xl shadow-xl flex items-center justify-center">
                <div className="text-center">
                  <div className="text-3xl font-bold text-white">100+</div>
                  <div className="text-xs text-white/90">Years</div>
                </div>
              </div>
            </motion.div>

            {/* Features */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl md:text-5xl font-bold text-[#0F1F3D] mb-6">
                Why Choose Buske Logistics?
              </h2>
              <p className="text-xl text-gray-600 mb-10">
                The world's most trusted logistics partner, delivering excellence across every mile.
              </p>

              <div className="space-y-8">
                {features.map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="flex gap-4 group"
                  >
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#2563EB] to-[#38BDF8] flex items-center justify-center shadow-md group-hover:shadow-lg group-hover:shadow-blue-500/30 transition-all duration-300">
                        <feature.icon className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-[#0F1F3D] mb-2">
                        {feature.title}
                      </h3>
                      <p className="text-gray-600 leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-[#0F1F3D] mb-4">
              What Our Global Clients Say
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Trusted by thousands of businesses worldwide
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <TestimonialCard key={index} {...testimonial} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* Partners Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-[#0F1F3D] mb-4">
              Trusted by Global Partners
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Partnering with industry leaders and innovative companies worldwide
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 items-center justify-items-center">
            {[
              "https://cdn.prod.website-files.com/65eb5e8c0ab92f839985c896/6773f84cf8ae43c6a2f66013_PepsiCo_logo.svg%20(1)-p-500.png",
              "https://cdn.prod.website-files.com/65eb5e8c0ab92f839985c896/6773f8b094adbefdf917d9dd_Pernod_Ricard_Logo.svg",
              "https://cdn.prod.website-files.com/65eb5e8c0ab92f839985c896/6773fb50fa8af96d0a9cd54a_Diageo-Logo-p-500.png",
              "https://cdn.prod.website-files.com/65eb5e8c0ab92f839985c896/6773f84c5d333d82886d6aea_Ford_logo_flat.svg-p-500.png",
              "https://cdn.prod.website-files.com/65eb5e8c0ab92f839985c896/6773f84cca973bc67963b2f7_Molson_Coors_Beverage_Company_logo.svg-p-500.png",
              "https://cdn.prod.website-files.com/65eb5e8c0ab92f839985c896/6773fa079cbb296465b3f55e_ZF-Group_Logo_Blue_RGB-p-500.png",
              "https://cdn.prod.website-files.com/65eb5e8c0ab92f839985c896/6773faab5a841e3420e8dde3_Crown_Holdings_logo.svg-p-500.png",
              "https://cdn.prod.website-files.com/65eb5e8c0ab92f839985c896/6773fd860197311e4a9d4ac1_free-vector-lexus-logo_090974_Lexus_logo.png",
              "https://cdn.prod.website-files.com/65eb5e8c0ab92f839985c896/6773fced3a56199feae45834_Anheuser-Busch-Logo%20(1)-p-500.png",
              "https://cdn.prod.website-files.com/65eb5e8c0ab92f839985c896/6773fd23ca973bc67967b1bc_NTN_Corporation_Logo.svg-p-500.png",
              "https://cdn.prod.website-files.com/65eb5e8c0ab92f839985c896/6773fb29dc3bc19922582265_lydall-logo-300x85.webp",
              "https://cdn.prod.website-files.com/65eb5e8c0ab92f839985c896/6773fde0c85471612c9fcaa5_ag-logo-p-500.png",
            ].map((logo, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="w-full max-w-xs"
              >
                <div className="h-24 bg-white border-2 border-gray-100 rounded-xl flex items-center justify-center shadow-md hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer group p-4">
                  <img
                    src={logo}
                    alt={`Partner logo ${index + 1}`}
                    className="max-h-20 max-w-full object-contain opacity-80 group-hover:opacity-100 transition-opacity duration-300"
                  />
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <p className="text-gray-600 max-w-2xl mx-auto">
              Join 500+ enterprise clients and logistics partners who trust Buske Logistics for their critical shipping needs
            </p>
            <button className="mt-6 px-6 py-2 bg-[#2563EB] text-white font-semibold rounded-lg hover:bg-[#1e4a9b] transition-colors">
              Learn About Our 3PL Solutions
            </button>
          </motion.div>
        </div>
      </section>

      {/* About Us Section */}
      <section className="py-24 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Content */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl md:text-5xl font-bold text-[#0F1F3D] mb-6">
                About Us
              </h2>
              <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                Buske Logistics is a privately owned and operated third-party logistics (3PL) warehousing business founded in 1923. Since 2009, the company has undergone a significant transformation, with Fortune 1,000 standards being implemented under the ownership of S.C. Johnson & Son, Inc. from 2009 to 2015.
              </p>
              <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                New and enhanced systems, processes, and people development have been priorities under the current management team, which acquired the company in 2015. Most recently, we have accelerated our capital investments through a partnership with Fourshore Partners in March of 2022.
              </p>
              <p className="text-lg text-gray-700 leading-relaxed">
                We are a global company providing a wide array of best-in-class logistics services to Fortune 500 clients in the U.S., Canada, and Mexico. Since our inception, we have been committed to offering our partners the kind of personal attention that results in quick answers, superior value, cutting-edge technology, and the most reliable performance in our industry.
              </p>
              <div className="mt-10 flex items-center gap-8">
                <div className="bg-[#2563EB] rounded-lg p-6 text-white">
                  <div className="text-4xl font-bold">37</div>
                  <div className="text-sm text-white/90">Locations Worldwide</div>
                </div>
              </div>
            </motion.div>

            {/* Image */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=600&fit=crop"
                  alt="Buske Logistics Warehouse"
                  className="w-full h-full object-cover"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* History Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-[#0F1F3D] mb-4">
              Our History
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Our 100+ year history in the warehousing and logistics industry, combined with our ever-evolving innovation and technological capabilities, keeps us firmly planted as a preeminent 3PL organization.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Image */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative order-2 lg:order-1"
            >
              <div className="aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&h=600&fit=crop"
                  alt="Buske Logistics History"
                  className="w-full h-full object-cover"
                />
              </div>
            </motion.div>

            {/* Content */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="order-1 lg:order-2"
            >
              <h3 className="text-3xl font-bold text-[#0F1F3D] mb-6">
                Founded in 1923, Leading Today
              </h3>
              <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                Since day one, we've fulfilled the most demanding needs of Fortune 1,000 companies across various industries, from food and beverage to automotive manufacturing.
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#2563EB] flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold">📅</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-[#0F1F3D] mb-1">100+ Years of Excellence</h4>
                    <p className="text-gray-600">Continuous innovation and service since 1923</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#38BDF8] flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold">🏢</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-[#0F1F3D] mb-1">Fortune 500 Trust</h4>
                    <p className="text-gray-600">Serving leading companies across multiple industries</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#10B981] flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold">🚀</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-[#0F1F3D] mb-1">Modern Innovation</h4>
                    <p className="text-gray-600">Cutting-edge technology combined with proven expertise</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-[#2563EB] to-[#38BDF8] relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-white rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to Ship Globally?
            </h2>
            <p className="text-xl text-white/90 mb-10 max-w-2xl mx-auto">
              Join thousands of satisfied customers shipping to over 105 countries worldwide
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <button
                onClick={() => navigate("/signin")}
                className="px-8 py-4 bg-white text-[#2563EB] font-semibold rounded-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
              >
                Get Started Now
              </button>
              <button
                onClick={() => navigate("/track")}
                className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-xl border-2 border-white/30 hover:bg-white/20 transition-all duration-300"
              >
                Track a Shipment
              </button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

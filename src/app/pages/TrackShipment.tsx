import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { motion } from "motion/react";
import {
  Package,
  MapPin,
  Truck,
  Clock,
  CheckCircle2,
  Plane,
  Ship,
} from "lucide-react";
import ShipmentProgressBar from "../components/ShipmentProgressBar";
import { Badge } from "../components/ui/badge";
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "../components/ui/carousel";
import { calculateCheckpointTimes, isFlightShipment } from "../utils/trackingUtils";
import { formatJourneyStatus, getShipmentJourneyState } from "../utils/shipmentJourney";
import { StarRating } from "../components/StarRating";
import { useShipmentWithCheckpoints } from "../../hooks/useSupabase";
import type { EmblaCarouselType } from "embla-carousel";

// Format remaining countdown time (duration is provided in hours)
const formatCountdownTime = (startTime: string, durationHours: number): string => {
  const start = new Date(startTime).getTime();
  const now = Date.now();
  const remaining = (durationHours * 3600 * 1000) - (now - start);

  if (remaining <= 0) return 'Completed';

  const totalSeconds = Math.floor(remaining / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m remaining`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s remaining`;
  } else {
    return `${seconds}s remaining`;
  }
};

export default function TrackShipment() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const routeTrackingId = id ?? searchParams.get("id") ?? "";
  const [trackingId, setTrackingId] = useState(routeTrackingId);
  const [shipmentData, setShipmentData] = useState<any>(null);
  const [updateTrigger, setUpdateTrigger] = useState(0);
  const [routeMapLoading, setRouteMapLoading] = useState(true);
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [productCarouselApi, setProductCarouselApi] = useState<EmblaCarouselType | undefined>(undefined);

  // Fetch shipment from Supabase with real-time updates
  const { shipment, loading, error } = useShipmentWithCheckpoints(trackingId || '');

  useEffect(() => {
    if (!shipmentData) return;
    setRouteMapLoading(!shipmentData.routeScreenshot);
  }, [shipmentData?.id, shipmentData?.routeScreenshot]);

  useEffect(() => {
    setTrackingId(routeTrackingId);
  }, [routeTrackingId]);

  // Recalculate timestamp-derived progress occasionally; decorative motion stays in CSS.
  useEffect(() => {
    if (
      !shipmentData?.countdownDuration ||
      !shipmentData?.isJourneyMoving
    )
      return;
    const interval = setInterval(() => {
      setUpdateTrigger((prev) => prev + 1);
    }, 5000);
    return () => clearInterval(interval);
  }, [
    shipmentData?.countdownDuration,
    shipmentData?.isJourneyMoving,
  ]);

  useEffect(() => {
    const imageCount = shipmentData?.images?.length ?? 0;
    if (!productCarouselApi || imageCount <= 1) return;

    const interval = setInterval(() => {
      if (productCarouselApi.canScrollNext()) {
        productCarouselApi.scrollNext();
      } else {
        productCarouselApi.scrollTo(0);
      }
    }, 4500);

    return () => clearInterval(interval);
  }, [productCarouselApi, shipmentData?.images?.length]);

  const deriveData = (found: any) => {
    // Transform database shipment to display format
    const transportValue =
      found.transportation_type || found.transportation || '';
    const isFlightShip = isFlightShipment(transportValue);
    const enhancedCheckpoints = calculateCheckpointTimes(
      found.checkpoints || [],
      '',
      '',
      isFlightShip
    );

    // The shared controller derives durable position from stored timestamps.
    // CSS handles visual movement independently of this value.
    const journey = getShipmentJourneyState(found);
    const progress = journey.progress;
    const hours = found.countdown_duration ? found.countdown_duration / 3600 : 0;
    setShipmentData({
      ...found,
      trackingId: found.id,
      status: formatJourneyStatus(journey.status),
      journeyStatus: journey.status,
      stopReason: found.stop_reason || '',
      progress,
      transportMode: transportValue,
      origin: found.pickup_location,
      destination: found.delivery_address,
      vehicle: found.vehicle_type,
      driver: found.driver_name,
      driverImage: found.driver_image_url,
      driverExperience: found.driver_experience,
      senderName: found.sender_name,
      senderPhone: found.sender_phone,
      receiverName: found.receiver_name,
      receiverPhone: found.receiver_phone,
      pickupLocation: found.pickup_location,
      packageName: found.package_name,
      cost: found.cost,
      images: found.images || [],
      departureTime: found.created_at ? new Date(found.created_at).toLocaleString() : 'N/A',
      currentLocation:
        enhancedCheckpoints.find((c: any) => c.status === 'current')?.location ||
        enhancedCheckpoints[0]?.location ||
        '',
      // Calculate fixed percent positions for each milestone along the progress bar
      checkpoints: (() => {
        const arr = (enhancedCheckpoints || []).map((cp: any, idx: number, all: any[]) => {
          const positionPercent = Math.round(((idx + 1) / (all.length + 1)) * 100);
          let status = cp.status;
          if (hours > 0) {
            if (progress >= positionPercent) status = 'completed';
            else if (progress >= positionPercent - Math.max(5, Math.round(100 / (all.length + 1) / 2))) status = 'current';
            else status = 'pending';
          }
          return { ...cp, positionPercent, status };
        });

        // If shipment stopped, mark the next pending milestone as 'stopped' to highlight it
        if (isStopped) {
          const nextPending = arr.findIndex((c: any) => c.status === 'pending');
          if (nextPending !== -1) {
            arr[nextPending].status = 'stopped';
          }
        }

        return arr;
      })(),
      isFlightShipment: isFlightShip,
      countdownDuration: hours,
      countdownStartTime: found.countdown_start_time,
      paused: found.paused,
      stopped: found.stopped,
      progressBarPaused: Boolean(found.progress_bar_paused || journey.isFrozen),
      isJourneyMoving: journey.isMoving && !found.progress_bar_paused,
      customerStatusReason: found.customer_status_reason || found.stop_reason || '',
    });
    console.log('📦 Shipment data updated, progress:', progress);
  };

  // Transform Supabase shipment data when it arrives
  useEffect(() => {
    if (shipment) {
      deriveData(shipment);
    }
  }, [shipment, updateTrigger]);

  const getTransportIcon = (mode: string) => {
    switch (mode) {
      case "Air Freight":
        return Plane;
      case "Ocean Cargo":
        return Ship;
      default:
        return Truck;
    }
  };

  const getOperatorLabel = (mode: string) => {
    const lower = (mode || "").toLowerCase();
    if (lower.includes("air") || lower.includes("flight")) return "Pilot";
    if (
      lower.includes("sea") ||
      lower.includes("ship") ||
      lower.includes("ocean") ||
      lower.includes("maritime")
    ) {
      return "Captain";
    }
    return "Driver";
  };

  const isStopped = ['On Hold', 'Paused', 'Stopped', 'Terminated', 'Cancelled'].includes(shipmentData?.status || '');
  const statusCardBg =
    "https://www.shutterstock.com/image-illustration/ochre-orange-rich-yellow-brown-600nw-2094111343.jpg";
  const defaultRouteMapImage =
    "https://media.wired.com/photos/59269cd37034dc5f91bec0f1/191:100/w_1280,c_limit/GoogleMapTA.jpg";

  if (!trackingId) {
    return (
      <div className="min-h-screen bg-white py-20">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h1 className="text-3xl font-bold text-[#0F1F3D] mb-4">
            Tracking ID Required
          </h1>
          <p className="text-gray-600 mb-8">
            Please enter a tracking ID to view shipment progress.
          </p>
          <button
            type="button"
            onClick={() => navigate("/track")}
            className="inline-block px-6 py-3 bg-[#2563EB] text-white font-semibold rounded-lg hover:bg-[#1D4ED8] transition-all duration-300"
          >
            Go to Tracking Page
          </button>
        </div>
      </div>
    );
  }

  if (!loading && !shipment) {
    return (
      <div className="min-h-screen bg-white py-20">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h1 className="text-3xl font-bold text-[#0F1F3D] mb-4">
            Shipment Not Found
          </h1>
          <p className="text-gray-600 mb-8">
            {error || "We couldn't find a shipment with that tracking ID. Please check the ID and try again."}
          </p>
          <button
            type="button"
            onClick={() => navigate("/track")}
            className="inline-block px-6 py-3 bg-[#2563EB] text-white font-semibold rounded-lg hover:bg-[#1D4ED8] transition-all duration-300"
          >
            Back to Tracking
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-[#0F1F3D] mb-4">
            Shipment Progress
          </h1>
          <p className="text-lg text-gray-600">
            Tracking ID: <span className="font-semibold text-[#2563EB]">{trackingId}</span>
          </p>
        </motion.div>

        {/* Tracking Results */}
        {shipmentData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
                        {/* Status Card */}
            <div
              className={`relative overflow-hidden rounded-3xl p-8 shadow-2xl border transition-all bg-cover bg-center ${
                isStopped ? 'border-red-400/50 text-red-100' : 'border-white/10 text-white'
              }`}
              style={{ backgroundImage: `url(${statusCardBg})` }}
            >
              <div
                className={`absolute inset-0 ${
                  isStopped
                    ? 'bg-gradient-to-br from-red-950/85 via-red-900/80 to-red-800/70'
                    : 'bg-gradient-to-br from-slate-950/85 via-slate-900/80 to-slate-800/70'
                }`}
              />
              <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_top,rgba(255,255,255,0.25),transparent_55%)]" />

              <div className="relative z-10">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-6">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className={`text-2xl font-bold ${isStopped ? 'text-red-100' : 'text-white'}`}>
                        {shipmentData.trackingId}
                      </h2>
                      <Badge className={`text-white border-0 ${
                        isStopped
                          ? 'bg-red-500'
                          : 'bg-gradient-to-r from-[#38BDF8] to-[#2563EB]'
                      }`}>
                        {shipmentData.status}
                      </Badge>
                    </div>
                    <p className={isStopped ? 'text-red-200' : 'text-white/70'}>
                      {shipmentData.origin} → {shipmentData.destination}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {(() => {
                      const Icon = getTransportIcon(shipmentData.transportMode);
                      return (
                        <div className={`flex items-center gap-3 px-6 py-3 rounded-xl border ${
                          isStopped
                            ? 'bg-red-500/20 border-red-300/40'
                            : 'bg-white/10 border-white/20'
                        }`}>
                          <Icon className={`w-6 h-6 ${
                            isStopped ? 'text-red-200' : 'text-[#38BDF8]'
                          }`} />
                          <span className={`font-medium ${
                            isStopped ? 'text-red-100' : 'text-white'
                          }`}>
                            {shipmentData.transportMode}
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {shipmentData.customerStatusReason && (
                  <div className="mb-6 p-4 bg-red-500/15 border border-red-300/40 rounded-lg flex flex-col items-center">
                    <p className="text-red-200 font-semibold mb-3">{shipmentData.customerStatusReason}</p>
                    <button
                      type="button"
                      onClick={() => navigate("/chat")}
                      className="inline-block px-6 py-3 bg-[#2563EB] text-white font-semibold rounded-lg hover:bg-[#1D4ED8] transition-all duration-300"
                    >
                      Contact Customer Service (Live Chat)
                    </button>
                  </div>
                )}

                {/* Progress Bar */}
                <div className="space-y-4">
                  <ShipmentProgressBar
                    progress={shipmentData.progress}
                    transportMode={shipmentData.transportMode}
                    checkpoints={shipmentData.checkpoints}
                    status={shipmentData.status}
                    isVisuallyPaused={shipmentData.progressBarPaused}
                    origin={shipmentData.origin}
                    destination={shipmentData.destination}
                  />
                  {/* Countdown Timer Display */}
                  {shipmentData.countdownDuration && shipmentData.countdownStartTime && (
                    <div className={`mt-3 p-3 rounded-lg border ${shipmentData.progressBarPaused ? 'bg-white/10 border-white/10' : 'bg-white/10 border-white/15'}`}>
                      <div className="flex items-center justify-between">
                        <span className={`text-sm font-medium ${shipmentData.progressBarPaused ? 'text-white/60' : 'text-white/80'}`}>Countdown Timer</span>
                        <span className={`text-sm font-bold ${shipmentData.progressBarPaused ? 'text-white/50' : 'text-emerald-200'}`}>
                          {formatCountdownTime(shipmentData.countdownStartTime, shipmentData.countdownDuration)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Product Images Carousel Section */}
            {shipmentData.images && shipmentData.images.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200"
              >
                <div className="space-y-4">
                  <h3 className="text-2xl font-bold text-[#0F1F3D] flex items-center gap-3">
                    📦 Product Images
                  </h3>
                  <div className="relative px-2">
                    <Carousel
                      className="w-full"
                      opts={{ align: "start", loop: true }}
                      setApi={(api) => setProductCarouselApi(api)}
                    >
                      <CarouselContent>
                        {shipmentData.images.map((imageUrl: string, index: number) => (
                          <CarouselItem key={index} className="basis-full sm:basis-1/2 lg:basis-1/3">
                            <motion.div
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: index * 0.05 }}
                              className="group relative rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 cursor-zoom-in h-48 sm:h-56"
                              onClick={() => setActiveImage(imageUrl)}
                            >
                              <img
                                src={imageUrl}
                                alt={`Product ${index + 1}`}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
                                <span className="text-white text-sm font-medium bg-black/50 px-3 py-2 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                  View full â€¢ {index + 1} / {shipmentData.images.length}
                                </span>
                              </div>
                            </motion.div>
                          </CarouselItem>
                        ))}
                      </CarouselContent>
                      {shipmentData.images.length > 1 && (
                        <>
                          <CarouselPrevious className="bg-white text-[#2563EB] hover:bg-gray-100" />
                          <CarouselNext className="bg-white text-[#2563EB] hover:bg-gray-100" />
                        </>
                      )}
                    </Carousel>
                  </div>
                </div>
              </motion.div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Map Placeholder */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200 h-full relative overflow-hidden">
                  <img
                    src={shipmentData?.routeScreenshot || defaultRouteMapImage}
                    alt="Live route map background"
                    className={`absolute inset-0 h-full w-full object-cover ${
                      shipmentData?.routeScreenshot ? "" : "blur-[1px]"
                    }`}
                    onLoad={() => {
                      if (shipmentData?.routeScreenshot) {
                        setRouteMapLoading(false);
                      }
                    }}
                  />
                  <div className="absolute inset-0 bg-white/30" />

                  <h3 className="relative z-10 text-xl font-semibold text-[#0F1F3D] mb-6 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-[#2563EB]" />
                    Live Route Map
                  </h3>
                  <div className="relative z-10 aspect-video rounded-xl flex items-center justify-center overflow-hidden bg-white/10 backdrop-blur-[2px] border border-white/30">
                    {/* Current location overlay */}
                    <div className="absolute inset-0 flex items-center justify-center z-10">
                      <div className="text-center">
                        <MapPin className="w-12 h-12 text-[#2563EB] mx-auto mb-2 drop-shadow" />
                        <p className="text-sm font-semibold text-[#0F1F3D] bg-white/85 px-3 py-2 rounded-lg">
                          Current: {shipmentData?.currentLocation || 'Loading...'}
                        </p>
                      </div>
                    </div>
                    {/* Loading spinner */}
                    {routeMapLoading && (
                      <div className="absolute inset-0 flex items-center justify-center z-30 bg-black/20 backdrop-blur-[2px]">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-12 h-12 border-4 border-[#2563EB]/30 border-t-[#2563EB] rounded-full animate-spin" />
                          <p className="text-white font-medium text-sm">Loading live map...</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Shipment Details */}
              <div className="space-y-6">
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200 relative overflow-hidden">
                  <div className="absolute inset-0 opacity-60 [background-image:radial-gradient(circle_at_top,rgba(37,99,235,0.12),transparent_60%)]" />
                  <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(120deg,rgba(15,23,42,0.04),transparent_55%)]" />
                  <div className="relative z-10">
                    <h3 className="text-lg font-semibold text-[#0F1F3D] mb-6 flex items-center gap-2">
                      <Package className="w-5 h-5 text-[#2563EB]" />
                      Shipment Details
                    </h3>
                    <div className="space-y-5">
                    {/* Package Information */}
                    <div className="pb-4 border-b border-gray-200">
                      <h4 className="text-sm font-semibold text-[#0F1F3D] mb-3">📦 Package Information</h4>
                      <div className="grid grid-cols-1 gap-3">
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Package Name</div>
                          <div className="font-medium text-[#0F1F3D]">{shipmentData.packageName || 'N/A'}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Cost</div>
                          <div className="font-medium text-[#10B981]">${shipmentData.cost?.toFixed(2) || '0.00'}</div>
                        </div>
                      </div>
                    </div>

                    {/* Sender Information */}
                    <div className="pb-4 border-b border-gray-200">
                      <h4 className="text-sm font-semibold text-[#0F1F3D] mb-3">👤 Sender</h4>
                      <div className="grid grid-cols-1 gap-3">
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Name</div>
                          <div className="font-medium text-[#0F1F3D]">{shipmentData.senderName || 'N/A'}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Phone</div>
                          <div className="font-medium text-[#0F1F3D]">{shipmentData.senderPhone || 'N/A'}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">📍 Pickup Location</div>
                          <div className="font-medium text-[#0F1F3D]">{shipmentData.pickupLocation || 'N/A'}</div>
                        </div>
                      </div>
                    </div>

                    {/* Receiver Information */}
                    <div className="pb-4 border-b border-gray-200">
                      <h4 className="text-sm font-semibold text-[#0F1F3D] mb-3">📬 Receiver</h4>
                      <div className="grid grid-cols-1 gap-3">
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Name</div>
                          <div className="font-medium text-[#0F1F3D]">{shipmentData.receiverName || 'N/A'}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Phone</div>
                          <div className="font-medium text-[#0F1F3D]">{shipmentData.receiverPhone || 'N/A'}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">ðŸ“ Drop-off Location</div>
                          <div className="font-medium text-[#0F1F3D]">{shipmentData.destination || 'N/A'}</div>
                        </div>
                      </div>
                    </div>

                    {/* Timeline Information */}
                    <div className="pb-4 border-b border-gray-200">
                      <h4 className="text-sm font-semibold text-[#0F1F3D] mb-3">⏱️ Timeline</h4>
                      <div className="grid grid-cols-1 gap-3">
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Departure Time</div>
                          <div className="font-medium text-[#0F1F3D] text-sm">{shipmentData.departureTime}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Estimated Arrival</div>
                          <div className="font-medium text-[#10B981]">{shipmentData.estimatedArrival || 'Based on countdown'}</div>
                        </div>
                      </div>
                    </div>

                    {/* Logistics Information */}
                    <div>
                      <h4 className="text-sm font-semibold text-[#0F1F3D] mb-3">🚚 Logistics</h4>
                      <div className="grid grid-cols-1 gap-3">
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Vehicle Type</div>
                          <div className="font-medium text-[#0F1F3D]">{shipmentData.vehicle || 'N/A'}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">{getOperatorLabel(shipmentData.transportMode)}</div>
                          <div className="font-medium text-[#0F1F3D]">{shipmentData.driver || 'N/A'}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">
                            {getOperatorLabel(shipmentData.transportMode)} Rating
                          </div>
                          {shipmentData.driverExperience ? (
                            <StarRating experience={shipmentData.driverExperience} />
                          ) : (
                            <div className="font-medium text-[#0F1F3D]">N/A</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                </div>

                {/* Notification Note */}
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
                  <div className="flex gap-3">
                    <span className="text-xl flex-shrink-0">📧</span>
                    <div>
                      <h4 className="text-sm font-semibold text-blue-900 mb-1">Email Notifications</h4>
                      <p className="text-xs text-blue-800">As soon as the package gets close to its destination or runs into any issue, an email will be sent to both the sender and receiver for clearance, pickup, and delivery updates.</p>
                    </div>
                  </div>
                </div>

                {shipmentData.driverImage && (
                  <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-200">
                    <h3 className="text-sm sm:text-lg font-semibold text-[#0F1F3D] mb-4">
                      🚗 Your {getOperatorLabel(shipmentData.transportMode)}
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-4">
                        <img
                          src={shipmentData.driverImage}
                          alt={shipmentData.driver}
                          className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover shadow-md flex-shrink-0"
                        />
                        <div className="flex-1">
                          <p className="font-semibold text-sm sm:text-base text-[#0F1F3D]">{shipmentData.driver}</p>
                          {shipmentData.driverExperience && (
                            <div className="mt-2">
                              <StarRating experience={shipmentData.driverExperience} />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Checkpoint Timeline */}
            <div className="bg-white rounded-2xl p-4 sm:p-8 shadow-lg border border-gray-200">
              <h3 className="text-lg sm:text-xl font-semibold text-[#0F1F3D] mb-6 sm:mb-8 flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#2563EB]" />
                Tracking Timeline ({shipmentData.checkpoints.length} Milestones)
              </h3>

              {/* Scrollable location cards container - Vertical scroll */}
              <div className="max-h-96 overflow-y-auto pb-4">
                <div className="flex flex-col gap-4">
                  {shipmentData.checkpoints.map((checkpoint: any, index: number) => {
                    const isCompleted = checkpoint.status === 'completed';
                    const isCurrent = checkpoint.status === 'current';
                    const isPending = checkpoint.status === 'pending';
                    const isStopped = checkpoint.status === 'stopped';

                    return (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.08 }}
                        className={`rounded-xl p-5 transition-all border-2 ${
                          isCompleted
                            ? 'bg-gradient-to-br from-green-50 to-green-100 border-green-400 shadow-md hover:shadow-lg'
                            : isCurrent
                            ? 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-400 shadow-lg hover:shadow-xl scale-105'
                            : isStopped
                            ? 'bg-gradient-to-br from-red-50 to-red-100 border-red-400 shadow-md hover:shadow-lg'
                            : 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-300 shadow-sm hover:shadow-md'
                        }`}
                      >
                        {/* Top Row: Icon + Location + Badge */}
                        <div className="flex items-start justify-between gap-3 mb-3">
                          {/* Status Icon */}
                          <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm ${
                            isCompleted
                              ? 'bg-green-500 text-white'
                              : isCurrent
                              ? 'bg-blue-500 text-white'
                              : isStopped
                              ? 'bg-red-500 text-white'
                              : 'bg-gray-400 text-white'
                          }`}>
                            {isCompleted ? (
                              <CheckCircle2 className="w-7 h-7" />
                            ) : isCurrent ? (
                              <Package className="w-7 h-7 animate-pulse" />
                            ) : (
                              index + 1
                            )}
                          </div>

                          {/* Location Name */}
                          <div className="flex-1">
                            <h4 className={`font-bold text-lg break-words ${
                                isCompleted
                                  ? 'text-green-700'
                                  : isCurrent
                                  ? 'text-blue-700'
                                  : isStopped
                                  ? 'text-red-700'
                                  : 'text-gray-700'
                              }`}>
                              {checkpoint.location}
                            </h4>
                          </div>

                          {/* Status Badge */}
                          <Badge className={`flex-shrink-0 text-xs font-semibold whitespace-nowrap ${
                            isCompleted
                              ? 'bg-green-500 text-white'
                              : isCurrent
                              ? 'bg-blue-600 text-white'
                              : isStopped
                              ? 'bg-red-600 text-white'
                              : 'bg-gray-500 text-white'
                          }`}>
                            {isCompleted
                              ? '✓ Passed'
                              : isCurrent
                              ? '📍 Current'
                              : isStopped
                              ? '⚠ Stopped'
                              : '⏱ Soon'}
                          </Badge>
                        </div>

                        {/* Bottom Row: Time Info */}
                        <div className={`text-sm font-medium ${
                          isCompleted
                            ? 'text-green-600'
                            : isCurrent
                            ? 'text-blue-600'
                            : isStopped
                            ? 'text-red-600'
                            : 'text-gray-600'
                        }`}>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            {isCompleted && checkpoint.passedAgo && (
                              <span>Passed {checkpoint.passedAgo}</span>
                            )}
                            {isCurrent && (
                              <span>Currently at this location</span>
                            )}
                            {isStopped && (
                              <span>Stopped — contact support</span>
                            )}
                            {isPending && checkpoint.timeUntilPass && (
                              <span>Expected {checkpoint.timeUntilPass}</span>
                            )}
                            {isPending && !checkpoint.timeUntilPass && (
                              <span>Awaiting arrival</span>
                            )}
                          </div>
                        </div>

                        {/* Checkpoint Index */}
                        <div className="mt-3 pt-3 border-t border-current border-opacity-20 text-xs opacity-60">
                          Milestone {index + 1} of {shipmentData.checkpoints.length}
                        </div>
                        {isStopped && (
                          <div className="mt-3">
                            <button
                              type="button"
                              onClick={() => navigate("/chat")}
                              className="inline-block px-3 py-2 bg-[#2563EB] text-white rounded-md text-sm"
                            >
                              Contact Support (Live Chat)
                            </button>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Loading State */}
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="w-12 h-12 border-4 border-[#2563EB]/30 border-t-[#2563EB] rounded-full animate-spin mx-auto mb-6" />
            <h3 className="text-2xl font-semibold text-[#0F1F3D] mb-2">
              Loading shipment details...
            </h3>
            <p className="text-gray-600 max-w-md mx-auto">
              We are fetching the latest updates for this tracking ID.
            </p>
          </motion.div>
        )}

        {/* Empty State */}
        {!loading && !shipmentData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <h3 className="text-2xl font-semibold text-[#0F1F3D] mb-3">
              Shipment not found
            </h3>
            <p className="text-gray-600 max-w-md mx-auto mb-6">
              We could not find a shipment with that tracking ID. Please check and try again.
            </p>
            <button
              type="button"
              onClick={() => navigate("/track")}
              className="inline-block px-6 py-3 bg-[#2563EB] text-white font-semibold rounded-lg hover:bg-[#1D4ED8] transition-all duration-300"
            >
              Back to Tracking
            </button>
          </motion.div>
        )}

        {/* Full Image Preview */}
        {activeImage && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 py-6"
            onClick={() => setActiveImage(null)}
          >
            <div
              className="relative w-full max-w-5xl"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setActiveImage(null)}
                className="absolute -top-3 right-0 rounded-full bg-black/70 px-4 py-2 text-sm font-semibold text-white backdrop-blur"
              >
                Close
              </button>
              <img
                src={activeImage}
                alt="Full view"
                className="w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl"
              />
            </div>
          </div>
        )}

        {/* Terminate Message Modal */}
        {shipmentData && shipmentData.terminated && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-2xl p-8 max-w-md mx-4 shadow-2xl text-center"
            >
              <div className="mb-4 text-5xl">🚫</div>
              <h2 className="text-2xl font-bold text-red-600 mb-4">Shipment Terminated</h2>
              <p className="text-gray-700 mb-6">
                This shipment or delivery has been terminated. Please contact the sender or our customer care service for more enquiry.
              </p>
              <button
                onClick={() => navigate('/')}
                className="inline-block px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all duration-300"
              >
                ← Back to Home
              </button>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}



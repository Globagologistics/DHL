import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useShipmentWithCheckpoints } from '../../hooks/useSupabase';
import * as shipmentService from '../../services/shipmentService';
import { StarRating } from '../components/StarRating';
import { MapPin } from 'lucide-react';
import { motion } from 'motion/react';
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from '../components/ui/carousel';
import ShipmentProgressBar from '../components/ShipmentProgressBar';

export default function AdminDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { shipment, loading } = useShipmentWithCheckpoints(id || '');
  const [showStopModal, setShowStopModal] = useState(false);
  const [stopReason, setStopReason] = useState('');
  const [holdCategory, setHoldCategory] = useState('Logistics issue');
  const [showTerminateModal, setShowTerminateModal] = useState(false);
  const [terminationReason, setTerminationReason] = useState('');
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [nextStatus, setNextStatus] = useState('processing');
  const [statusReason, setStatusReason] = useState('');
  const [estimatedDeliveryAt, setEstimatedDeliveryAt] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [routeMapLoading, setRouteMapLoading] = useState(true);
  const [routeMapError, setRouteMapError] = useState(false);
  const [sliderValue, setSliderValue] = useState<number>(0);
  const sliderTimer = React.useRef<number | null>(null);

  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  // 6-second timeout for route map loading
  useEffect(() => {
    if (shipment) {
      setRouteMapLoading(true);
      setRouteMapError(false);
      const timer = setTimeout(() => {
        setRouteMapLoading(false);
        setRouteMapError(true);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [shipment?.id]);

  useEffect(() => {
    if (!shipment) return;
    // Compute current percent from countdown if available, else from checkpoint index
    const computePercent = () => {
      if (shipment.countdown_duration && shipment.countdown_start_time) {
        const start = new Date(shipment.countdown_start_time).getTime();
        const freezeAt =
          shipment.terminated
            ? shipment.terminate_timestamp
            : shipment.stopped
            ? shipment.stop_timestamp
            : shipment.paused
            ? shipment.pause_timestamp
            : null;
        const nowMs = freezeAt ? new Date(freezeAt).getTime() : Date.now();
        const totalMs = (shipment.countdown_duration || 0) * 1000;
        if (totalMs <= 0) return 0;
        const elapsed = nowMs - start;
        if (elapsed <= 0) return 0;
        if (elapsed >= totalMs) return 100;
        return Math.round((elapsed / totalMs) * 100);
      }
      // fallback: derive from current_checkpoint_index
      const total = (shipment.checkpoints || []).length;
      if (total > 0 && typeof shipment.current_checkpoint_index === 'number') {
        return Math.round(((shipment.current_checkpoint_index + 1) / (total + 1)) * 100);
      }
      return 0;
    };
    setSliderValue(computePercent());
  }, [shipment]);

  useEffect(() => {
    return () => {
      if (sliderTimer.current) window.clearTimeout(sliderTimer.current);
    };
  }, []);

  const handleSliderChange = (value: number) => {
    if (!shipment || shipment.paused || shipment.stopped || shipment.terminated) return;
    setSliderValue(value);
    if (!shipment) return;
    if (sliderTimer.current) window.clearTimeout(sliderTimer.current);
    sliderTimer.current = window.setTimeout(async () => {
      setIsSaving(true);
      try {
        if (shipment.countdown_duration) {
          const elapsedMs = (value / 100) * (shipment.countdown_duration * 1000);
          const newStart = new Date(Date.now() - elapsedMs).toISOString();
          // also compute nearest checkpoint index from percent and update it
          const total = (shipment.checkpoints || []).length;
          const positions = (shipment.checkpoints || []).map((_: any, i: number) => Math.round(((i + 1) / (total + 1)) * 100));
          let newIndex = 0;
          for (let i = positions.length - 1; i >= 0; i--) {
            if (value >= positions[i]) {
              newIndex = i;
              break;
            }
          }
          await shipmentService.updateShipment(shipment.id, { countdown_start_time: newStart, current_checkpoint_index: newIndex });
        }
      } catch (err) {
        console.error('Error updating slider:', err);
      } finally {
        setIsSaving(false);
      }
    }, 600) as unknown as number;
  };

  if (loading) {
    return (
      <div className="p-12 text-center">
        <p className="text-gray-600">Loading shipment...</p>
      </div>
    );
  }

  if (!shipment) {
    return (
      <div className="p-12 text-center">
        <p className="text-gray-600">Shipment not found.</p>
        <button
          onClick={() => navigate('/admin')}
          className="mt-4 text-blue-600 hover:underline"
        >
          Back to dashboard
        </button>
      </div>
    );
  }

  const handleProgressClick = async (index: number) => {
    setIsSaving(true);
    try {
      // If countdown duration is set, compute a new countdown_start_time that maps to this checkpoint position
      if (shipment.countdown_duration) {
        const total = (shipment.checkpoints || []).length;
        const pos = Math.round(((index + 1) / (total + 1)) * 100);
        const elapsedMs = (pos / 100) * (shipment.countdown_duration * 1000);
        const newStart = new Date(Date.now() - elapsedMs).toISOString();
        await shipmentService.updateShipment(shipment.id, { current_checkpoint_index: index, countdown_start_time: newStart });
      } else {
        await shipmentService.updateShipment(shipment.id, { current_checkpoint_index: index });
      }
    } catch (error) {
      console.error('Error updating checkpoint:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePauseToggle = async () => {
    setIsSaving(true);
    try {
      if (!shipment.paused) {
        // Pausing
        await shipmentService.updateShipment(shipment.id, {
          paused: true,
          pause_timestamp: new Date().toISOString(),
        });
      } else {
        // Resuming
        if (shipment.pause_timestamp && shipment.countdown_start_time) {
          const pauseTime = new Date(shipment.pause_timestamp).getTime();
          const startTime = new Date(shipment.countdown_start_time).getTime();
          const now = Date.now();
          const pausedDuration = now - pauseTime;
          const newStartTime = new Date(startTime + pausedDuration).toISOString();
          await shipmentService.updateShipment(shipment.id, {
            paused: false,
            countdown_start_time: newStartTime,
            pause_timestamp: undefined,
          } as any);
        } else {
          await shipmentService.updateShipment(shipment.id, {
            paused: false,
            pause_timestamp: undefined,
          } as any);
        }
      }
    } catch (error) {
      console.error('Error toggling pause:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleStop = () => {
    setShowStopModal(true);
  };

  const handleStopConfirm = async () => {
    if (!stopReason.trim()) return;
    setIsSaving(true);
    try {
      await shipmentService.updateShipment(shipment.id, {
        stopped: true,
        stop_reason: stopReason.trim(),
        customer_status_reason: `${holdCategory}: ${stopReason.trim()}`,
        stop_timestamp: new Date().toISOString(),
        status: 'on_hold',
      });
      setShowStopModal(false);
      setStopReason('');
    } catch (error) {
      console.error('Error stopping shipment:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleResume = async () => {
    setIsSaving(true);
    try {
      const updates: Record<string, unknown> = {
        stopped: false,
        stop_reason: undefined,
        stop_timestamp: null,
        paused: false,
        status: 'in_transit',
        customer_status_reason: null,
      };

      // Keep countdown-driven tracking progress frozen for the full hold.
      // This mirrors the existing pause/resume behavior and prevents a visual
      // jump forward when a stopped shipment is released.
      if (shipment.stop_timestamp && shipment.countdown_start_time) {
        const heldFor = Date.now() - new Date(shipment.stop_timestamp).getTime();
        const countdownStart = new Date(shipment.countdown_start_time).getTime();
        if (Number.isFinite(heldFor) && heldFor > 0 && Number.isFinite(countdownStart)) {
          updates.countdown_start_time = new Date(countdownStart + heldFor).toISOString();
        }
      }

      await shipmentService.updateShipment(shipment.id, updates as any);
    } catch (error) {
      console.error('Error resuming shipment:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTerminate = () => {
    setShowTerminateModal(true);
  };

  const handleTerminateConfirm = async () => {
    setIsSaving(true);
    try {
      await shipmentService.updateShipment(shipment.id, {
        terminated: true,
        terminate_timestamp: new Date().toISOString(),
        customer_status_reason: terminationReason.trim() || null,
        stopped: true,
        stop_timestamp: new Date().toISOString(),
        paused: false,
        status: 'stopped',
      });
      setShowTerminateModal(false);
      setTerminationReason('');
    } catch (error) {
      console.error('Error terminating shipment:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReactivate = async () => {
    setIsSaving(true);
    try {
      await shipmentService.updateShipment(shipment.id, {
        terminated: false,
        terminate_timestamp: null,
        stopped: false,
        stop_timestamp: null,
        stop_reason: null,
        status: 'in_transit',
      } as any);
    } catch (error) {
      console.error('Error reactivating shipment:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleProgressBarPauseToggle = async () => {
    if (!shipment) return;
    setIsSaving(true);
    try {
      await shipmentService.updateShipment(shipment.id, {
        progress_bar_paused: !shipment.progress_bar_paused,
      });
    } catch (error: any) {
      console.error('Error toggling progress bar pause:', error);
      if (error?.message) {
        alert(`Error: ${error.message}`);
      } else if (error?.error?.message) {
        alert(`Error: ${error.error.message}`);
      } else {
        alert('Failed to toggle progress bar pause. Please check the console for details.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!shipment) return;
    setIsSaving(true);
    try {
      const updates: Record<string, unknown> = {
        status: nextStatus,
        customer_status_reason: statusReason.trim() || null,
      };
      if (nextStatus === 'delivered') updates.delivered_at = new Date().toISOString();
      if (nextStatus === 'cancelled') updates.cancelled_at = new Date().toISOString();
      if (estimatedDeliveryAt) updates.estimated_delivery_at = new Date(estimatedDeliveryAt).toISOString();
      await shipmentService.updateShipment(shipment.id, updates as any);
      setShowStatusModal(false);
      setStatusReason('');
      setEstimatedDeliveryAt('');
    } catch (error) {
      console.error('Error updating shipment status:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!shipment || shipment.is_published) return;
    setIsSaving(true);
    try {
      const { error } = await shipmentService.updateShipment(shipment.id, {
        is_published: true,
      });
      if (error) throw new Error(error);
    } catch (error) {
      console.error('Error publishing shipment:', error);
      alert('The shipment could not be published. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const getCurrentPercent = (s: any) => {
    if (!s) return 0;
    if (s.countdown_duration && s.countdown_start_time) {
      const start = new Date(s.countdown_start_time).getTime();
      const freezeAt =
        s.terminated
          ? s.terminate_timestamp
          : s.stopped
          ? s.stop_timestamp
          : s.paused
          ? s.pause_timestamp
          : null;
      const nowMs = freezeAt ? new Date(freezeAt).getTime() : Date.now();
      const totalMs = (s.countdown_duration || 0) * 1000;
      if (totalMs <= 0) return 0;
      const elapsed = nowMs - start;
      if (elapsed <= 0) return 0;
      if (elapsed >= totalMs) return 100;
      return Math.round((elapsed / totalMs) * 100);
    }
    const total = (s.checkpoints || []).length;
    if (total > 0 && typeof s.current_checkpoint_index === 'number') {
      return Math.round(((s.current_checkpoint_index + 1) / (total + 1)) * 100);
    }
    return 0;
  };

  const sliderDisabled = isSaving || shipment.paused || shipment.stopped || shipment.terminated;
  const isFrozen = shipment.paused || shipment.stopped || shipment.terminated;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-12 px-4">
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/admin')} className="text-sm text-gray-600 hover:text-gray-800">← Back</button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">{shipment.package_name || 'Shipment Details'}</h1>
            <p className="text-sm text-gray-500">Tracking ID: <span className="font-medium text-gray-800">{shipment.id}</span></p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${shipment.is_published ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
            {shipment.is_published ? 'Published' : 'Draft'}
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${shipment.terminated ? 'bg-red-100 text-red-700' : shipment.stopped ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {shipment.terminated ? 'Terminated' : shipment.stopped ? 'Stopped' : shipment.paused ? 'Paused' : 'In Transit'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <main className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow border border-gray-100">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-600 mb-2">Sender</h3>
                <div className="text-gray-800 font-medium">{shipment.sender_name}</div>
                <div className="text-sm text-gray-500">{shipment.sender_phone}</div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-600 mb-2">Receiver</h3>
                <div className="text-gray-800 font-medium">{shipment.receiver_name}</div>
                <div className="text-sm text-gray-500">{shipment.receiver_phone}</div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-600 mt-4 mb-2">Delivery Address</h3>
                <div className="text-gray-800">{shipment.delivery_address}</div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-600 mt-4 mb-2">Transportation</h3>
                <div className="text-gray-800">{shipment.transportation}</div>
              </div>
            </div>
            <div className="mt-4 border-t pt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <div className="text-xs text-gray-500">Cost</div>
                <div className="font-semibold text-[#10B981]">${shipment.cost?.toFixed(2) || '0.00'}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Vehicles</div>
                <div className="font-semibold">{shipment.vehicles_count || 1} {shipment.vehicle_type}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">ETA</div>
                <div className="font-semibold">{shipment.countdown_duration ? `${Math.floor(shipment.countdown_duration/3600)}h` : '—'}</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow border border-gray-100">
            <h3 className="text-lg font-semibold mb-4">Progress</h3>
            <ShipmentProgressBar
              progress={getCurrentPercent(shipment)}
              transportMode={shipment.transportation}
              checkpoints={shipment.checkpoints}
              status={
                shipment.terminated
                  ? 'Stopped'
                  : shipment.stopped
                  ? 'Stopped'
                  : shipment.paused
                  ? 'Paused'
                  : 'In Transit'
              }
              vehiclesCount={shipment.vehicles_count}
              isVisuallyPaused={shipment.progress_bar_paused || false}
            />
            {shipment.checkpoints && (
              <div className="mt-4">
                <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                  <span>Milestones</span>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {shipment.checkpoints.map((c: any, idx: number) => (
                    <button
                      key={c.id}
                      onClick={() => handleProgressClick(idx)}
                      disabled={isFrozen || isSaving}
                      className={`px-3 py-1 rounded transition ${
                        idx <= (shipment.current_checkpoint_index || 0)
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-700'
                      } ${isFrozen || isSaving ? 'opacity-60 cursor-not-allowed' : 'hover:bg-blue-600 hover:text-white'}`}
                    >
                      {c.location}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>

        <aside className="space-y-6">
          {shipment.images && shipment.images.length > 0 && (
            <div className="bg-white rounded-2xl p-4 shadow border border-gray-100">
              <h4 className="text-sm font-semibold mb-3">Product Images</h4>
              <Carousel>
                <CarouselContent>
                  {shipment.images.map((img: string, i: number) => (
                    <CarouselItem key={i} className="h-36">
                      <img src={img} alt={`img-${i}`} className="w-full h-36 object-cover rounded" />
                    </CarouselItem>
                  ))}
                </CarouselContent>
                {shipment.images.length > 1 && (
                  <>
                    <CarouselPrevious className="bg-white text-[#2563EB] hover:bg-gray-100" />
                    <CarouselNext className="bg-white text-[#2563EB] hover:bg-gray-100" />
                  </>
                )}
              </Carousel>
            </div>
          )}

          <div className="bg-white rounded-2xl p-4 shadow border border-gray-100">
            <h4 className="text-sm font-semibold mb-3">Live Route</h4>
            <div className="aspect-video rounded overflow-hidden bg-gray-50 flex items-center justify-center">Map preview</div>
          </div>

          {shipment.driver_name && (
            <div className="bg-white rounded-2xl p-4 shadow border border-gray-100">
              <h4 className="text-sm font-semibold mb-3">Driver</h4>
              <div className="flex items-center gap-3">
                {shipment.driver_image_url && <img src={shipment.driver_image_url} className="w-12 h-12 rounded-full" />}
                <div>
                  <div className="font-medium">{shipment.driver_name}</div>
                  <StarRating experience={shipment.driver_experience} />
                </div>
              </div>
            </div>
          )}

          {shipment.countdown_duration && (
            <div className="bg-white rounded-2xl p-4 shadow border border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold">Adjust Live Progress</h4>
                {isFrozen && (
                  <span className="inline-flex items-center rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-red-700">
                    Frozen
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 mb-4">
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={sliderValue}
                  onChange={e => handleSliderChange(Number(e.target.value))}
                  disabled={sliderDisabled}
                  className="flex-1 disabled:opacity-60"
                />
                <div className="w-12 text-right font-semibold">{sliderValue}%</div>
              </div>
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={handleProgressBarPauseToggle}
                  disabled={isSaving}
                  className={`flex items-center justify-center gap-2 px-4 py-2 rounded-md font-medium transition-all ${
                    shipment.progress_bar_paused
                      ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {shipment.progress_bar_paused ? '▶ Play' : '⏸ Pause'}
                </button>
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl p-4 shadow border border-gray-100">
            <h4 className="text-sm font-semibold mb-4">Actions</h4>
            <div className="space-y-2 flex flex-col">
              {!shipment.is_published && <button onClick={handlePublish} disabled={isSaving} className="px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-all disabled:opacity-60">Publish &amp; notify</button>}
              {!shipment.terminated && shipment.status !== 'cancelled' && <button onClick={() => { setNextStatus(shipment.status || 'processing'); setShowStatusModal(true); }} disabled={isSaving} className="px-4 py-2 bg-slate-700 text-white rounded-md font-medium hover:bg-slate-800 transition-all">Update Lifecycle Status</button>}
              {!shipment.terminated && shipment.status !== 'delivered' && shipment.status !== 'cancelled' && <button onClick={() => { setNextStatus('delivered'); setShowStatusModal(true); }} disabled={isSaving} className="px-4 py-2 bg-emerald-600 text-white rounded-md font-medium hover:bg-emerald-700 transition-all">Mark Delivered</button>}
              {!shipment.terminated && !shipment.stopped && <button onClick={handlePauseToggle} disabled={isSaving} className="px-4 py-2 bg-yellow-500 text-white rounded-md font-medium hover:bg-yellow-600 transition-all">{shipment.paused ? 'Resume' : 'Pause'}</button>}
              {!shipment.terminated && !shipment.stopped ? <button onClick={handleStop} className="px-4 py-2 bg-red-600 text-white rounded-md font-medium hover:bg-red-700 transition-all">Stop</button> : !shipment.terminated && shipment.stopped ? <button onClick={handleResume} className="px-4 py-2 bg-green-600 text-white rounded-md font-medium hover:bg-green-700 transition-all">Resume</button> : null}
              {!shipment.terminated && <button onClick={handleTerminate} className="px-4 py-2 bg-red-800 text-white rounded-md font-medium hover:bg-red-900 transition-all">Terminate</button>}
              {shipment.terminated && <button onClick={handleReactivate} className="px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-all">Reactivate</button>}
            </div>
          </div>
        </aside>
      </div>

      {/* Stop modal */}
      {showStopModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Stop Shipment</h2>
            <label className="block mb-2 text-sm font-medium">Reason for stopping:</label>
            <select value={holdCategory} onChange={e => setHoldCategory(e.target.value)} className="w-full border border-gray-300 rounded p-2 mb-3">
              <option>Logistics issue</option><option>Customs / Border processing</option><option>Documentation issue</option><option>Payment issue</option><option>Operational delay</option><option>Other</option>
            </select>
            <input
              type="text"
              className="w-full border border-gray-300 rounded p-2 mb-4"
              value={stopReason}
              onChange={e => setStopReason(e.target.value)}
              placeholder="Enter reason..."
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowStopModal(false)} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
              <button onClick={handleStopConfirm} className="px-4 py-2 bg-red-600 text-white rounded" disabled={!stopReason.trim() || isSaving}>Stop</button>
            </div>
          </div>
        </div>
      )}

      {/* Terminate modal */}
      {showTerminateModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4 text-red-600">Terminate Shipment</h2>
            <p className="text-gray-700 mb-6">Are you sure you want to terminate this shipment? This action will mark the shipment as terminated and can only be undone by reactivating it.</p>
            <label className="block mb-2 text-sm font-medium">Customer-visible reason (optional)</label>
            <textarea value={terminationReason} onChange={e => setTerminationReason(e.target.value)} className="w-full border border-gray-300 rounded p-2 mb-4" placeholder="Explain the termination without internal notes" />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowTerminateModal(false)} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
              <button onClick={handleTerminateConfirm} className="px-4 py-2 bg-red-800 text-white rounded" disabled={isSaving}>Terminate</button>
            </div>
          </div>
        </div>
      )}
      {showStatusModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Update Lifecycle Status</h2>
            <label className="block mb-2 text-sm font-medium">Customer-facing status</label>
            <select value={nextStatus} onChange={e => setNextStatus(e.target.value)} className="w-full border border-gray-300 rounded p-2 mb-4">
              <option value="processing">Processing</option><option value="pickup_scheduled">Pickup Scheduled</option><option value="picked_up">Picked Up</option><option value="in_transit">In Transit</option><option value="customs_processing">Customs / Border Processing</option><option value="delayed">Delayed</option><option value="out_for_delivery">Out for Delivery</option><option value="returned">Returned</option><option value="cancelled">Cancelled</option><option value="delivered">Delivered</option>
            </select>
            <label className="block mb-2 text-sm font-medium">Customer-visible update or reason</label>
            <textarea value={statusReason} onChange={e => setStatusReason(e.target.value)} className="w-full border border-gray-300 rounded p-2 mb-4" placeholder="Do not include internal notes" />
            {(nextStatus === 'delayed' || nextStatus === 'out_for_delivery') && <><label className="block mb-2 text-sm font-medium">Updated ETA (only if known)</label><input type="datetime-local" value={estimatedDeliveryAt} onChange={e => setEstimatedDeliveryAt(e.target.value)} className="w-full border border-gray-300 rounded p-2 mb-4" /></>}
            <div className="flex justify-end gap-2"><button onClick={() => setShowStatusModal(false)} className="px-4 py-2 bg-gray-200 rounded">Cancel</button><button onClick={handleStatusUpdate} disabled={isSaving} className="px-4 py-2 bg-blue-600 text-white rounded">Save Status</button></div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

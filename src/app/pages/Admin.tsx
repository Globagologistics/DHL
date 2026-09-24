import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Copy, Check, Plus, Search, Filter, Eye, Edit2, Trash2, Truck, Package, AlertCircle, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';
import { AdminContext, type Shipment, type Checkpoint } from '../contexts/AdminContext';

export default function Admin() {
  const { shipments, deleteShipment, loading } = useContext(AdminContext);
  const navigate = useNavigate();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'paused' | 'stopped'>('all');

  // Live progress updates
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Filter and search shipments
  const filteredShipments = shipments.filter((s) => {
    const matchesSearch = 
      s.packageName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.senderName?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = 
      filterStatus === 'all' ||
      (filterStatus === 'active' && !s.stopped && !s.paused) ||
      (filterStatus === 'paused' && s.paused && !s.stopped) ||
      (filterStatus === 'stopped' && s.stopped);

    return matchesSearch && matchesFilter;
  });

  // Calculate stats
  const stats = {
    total: shipments.length,
    active: shipments.filter(s => !s.stopped && !s.paused).length,
    paused: shipments.filter(s => s.paused && !s.stopped).length,
    stopped: shipments.filter(s => s.stopped).length,
  };

  const handleCopyTrackingId = (trackingId: string) => {
    navigator.clipboard.writeText(trackingId);
    setCopiedId(trackingId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getStatusColor = (shipment: Shipment) => {
    if (shipment.terminated) return { bg: 'bg-red-50', text: 'text-red-700', badge: 'bg-red-100 text-red-800' };
    if (shipment.stopped) return { bg: 'bg-red-50', text: 'text-red-700', badge: 'bg-red-100 text-red-800' };
    if (shipment.paused) return { bg: 'bg-yellow-50', text: 'text-yellow-700', badge: 'bg-yellow-100 text-yellow-800' };
    return { bg: 'bg-green-50', text: 'text-green-700', badge: 'bg-green-100 text-green-800' };
  };

  const getStatusLabel = (shipment: Shipment) => {
    if (shipment.terminated) return 'Terminated';
    if (shipment.stopped) return 'Stopped';
    if (shipment.paused) return 'Paused';
    return 'Active';
  };

  const getShipmentProgress = (shipment: Shipment) => {
    if (!shipment?.countdownStartTime || !shipment?.countdownDuration) return 0;
    const startMs = new Date(shipment.countdownStartTime).getTime();
    const totalMs = (shipment.countdownDuration || 0) * 3600 * 1000;
    if (!Number.isFinite(totalMs) || totalMs <= 0) return 0;

    const freezeAt =
      shipment.terminated
        ? shipment.terminateTimestamp
        : shipment.stopped
        ? shipment.stopTimestamp
        : shipment.paused
        ? shipment.pauseTimestamp
        : null;

    const asOfMs = freezeAt ? new Date(freezeAt).getTime() : now;
    if (!Number.isFinite(asOfMs)) return 0;
    const elapsed = asOfMs - startMs;
    if (elapsed <= 0) return 0;
    if (elapsed >= totalMs) return 100;
    return Math.round((elapsed / totalMs) * 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold text-[#0F1F3D]">Admin Dashboard</h1>
            <p className="text-gray-600 mt-2">Manage and track all shipments</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => navigate('/')}
              className="flex items-center gap-2 px-5 py-3 rounded-lg border border-gray-300 bg-white text-[#0F1F3D] font-semibold hover:shadow-sm transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/admin/new')}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#2563EB] to-[#38BDF8] text-white rounded-lg font-semibold hover:shadow-lg transition-all"
            >
              <Plus className="w-5 h-5" />
              New Shipment
            </motion.button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Shipments', value: stats.total, icon: Package, color: 'from-blue-500 to-blue-600' },
            { label: 'Active', value: stats.active, icon: Truck, color: 'from-green-500 to-green-600' },
            { label: 'Paused', value: stats.paused, icon: AlertCircle, color: 'from-yellow-500 to-yellow-600' },
            { label: 'Stopped', value: stats.stopped, icon: AlertCircle, color: 'from-red-500 to-red-600' },
          ].map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={`bg-gradient-to-br ${stat.color} rounded-xl p-6 text-white shadow-lg`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm font-medium">{stat.label}</p>
                  <p className="text-4xl font-bold mt-2">{stat.value}</p>
                </div>
                <stat.icon className="w-12 h-12 opacity-30" />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Search and Filter */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg shadow-md p-4 mb-6 border border-gray-200"
        >
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by package name, ID, or sender..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              />
            </div>
            <div className="flex gap-2 sm:flex-1 lg:flex-none">
              <Filter className="w-5 h-5 text-gray-500 my-auto" />
              <div className="flex gap-2">
                {(['all', 'active', 'paused', 'stopped'] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      filterStatus === status
                        ? 'bg-[#2563EB] text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Shipments Grid */}
        <div className="space-y-4">
          {loading && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#2563EB]"></div>
              <p className="text-gray-600 mt-4">Loading shipments...</p>
            </div>
          )}

          {!loading && filteredShipments.length === 0 ? (
            <div className="bg-white rounded-xl shadow-md p-12 text-center border border-gray-200">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 text-lg font-medium">No shipments found</p>
              <p className="text-gray-500 mt-2">
                {searchQuery || filterStatus !== 'all' 
                  ? 'Try adjusting your search or filters.' 
                  : 'Create your first shipment to get started.'}
              </p>
            </div>
          ) : (
            filteredShipments.map((s, idx) => {
              const statusColor = getStatusColor(s);
              const progress = getShipmentProgress(s);

              return (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`${statusColor.bg} rounded-xl shadow-md hover:shadow-lg transition-all border border-gray-200 overflow-hidden`}
                >
                  <div className="p-6">
                    <div className="flex flex-col lg:flex-row justify-between gap-4">
                      {/* Shipment Info */}
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="flex-1">
                            <h3 className="text-xl font-bold text-[#0F1F3D]">{s.packageName || 'Unnamed Package'}</h3>
                            <div className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${statusColor.badge} mt-2`}>
                              {getStatusLabel(s)}
                            </div>
                          </div>
                        </div>

                        {/* Shipment Details */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600 font-medium">From</p>
                            <p className="text-[#0F1F3D] font-semibold truncate">{s.senderName || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-gray-600 font-medium">To</p>
                            <p className="text-[#0F1F3D] font-semibold truncate">{s.receiverName || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-gray-600 font-medium">Transport</p>
                            <p className="text-[#0F1F3D] font-semibold">{s.transportation || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-gray-600 font-medium">Cost</p>
                            <p className="text-[#0F1F3D] font-semibold">${s.cost?.toFixed(2) || '0.00'}</p>
                          </div>
                        </div>

                        {/* Tracking ID */}
                        <div className="flex items-center gap-2 pt-2">
                          <span className="text-xs text-gray-600 font-mono bg-white/50 px-3 py-1 rounded">ID: {s.id.slice(0, 12)}...</span>
                          <button
                            onClick={() => handleCopyTrackingId(s.id)}
                            className="p-1 hover:bg-white/50 rounded transition-colors"
                          >
                            {copiedId === s.id ? (
                              <Check className="w-4 h-4 text-green-600" />
                            ) : (
                              <Copy className="w-4 h-4 text-gray-500" />
                            )}
                          </button>
                        </div>

                        {/* Progress Bar */}
                        {s.countdownStartTime && s.countdownDuration && (
                          <div className="pt-2">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-xs font-medium text-gray-700">Progress</span>
                              <span className="text-xs font-semibold text-gray-700">{progress}%</span>
                            </div>
                            <div className="w-full h-2 bg-white/60 rounded-full overflow-hidden">
                              <motion.div
                                className="h-full bg-gradient-to-r from-[#2563EB] to-[#38BDF8]"
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                transition={{ duration: 0.5 }}
                              />
                            </div>
                          </div>
                        )}

                        {/* Checkpoints */}
                        {s.checkpoints && s.checkpoints.length > 0 && (
                          <div className="pt-2">
                            <p className="text-xs font-medium text-gray-700 mb-2">Route ({s.checkpoints.length} stops)</p>
                            <div className="flex h-3 gap-1 rounded-full overflow-hidden bg-white/40">
                              {s.checkpoints.map((c: Checkpoint, idx: number) => (
                                <div
                                  key={c.id}
                                  className={`flex-1 ${
                                    idx <= (s.currentCheckpointIndex || 0)
                                      ? 'bg-gradient-to-r from-[#2563EB] to-[#38BDF8]'
                                      : 'bg-white/50'
                                  }`}
                                  title={c.location}
                                />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 lg:flex-col justify-end">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => navigate(`/admin/view/${s.id}`)}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                          <span className="hidden sm:inline">View</span>
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => navigate(`/admin/edit/${s.id}`)}
                          className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                          <span className="hidden sm:inline">Edit</span>
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            if (window.confirm('Are you sure you want to delete this shipment?')) {
                              deleteShipment(s.id);
                            }
                          }}
                          className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span className="hidden sm:inline">Delete</span>
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

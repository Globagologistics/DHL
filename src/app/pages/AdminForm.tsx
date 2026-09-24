import React, { useContext, useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { AdminContext, Shipment, Checkpoint } from '../contexts/AdminContext';
import { Copy, CheckCircle2, X } from 'lucide-react';

const transportOptions = [
  'Air Freight',
  'Ocean Cargo',
  'Land Transport',
  'Door-to-Door Delivery',
];

export default function AdminForm() {
  const { shipments, addShipment, updateShipment, error: contextError, clearError } = useContext(AdminContext);
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const editing = shipments.find((s) => s.id === id) || null;

  const initialData: any = {
    id: editing ? editing.id : crypto.randomUUID(),
    senderName: editing?.senderName || '',
    senderPhone: editing?.senderPhone || '',
    senderEmail: editing?.senderEmail || '',
    receiverName: editing?.receiverName || '',
    receiverPhone: editing?.receiverPhone || '',
    receiverEmail: editing?.receiverEmail || '',
    pickupLocation: editing?.pickupLocation || '',
    deliveryAddress: editing?.deliveryAddress || '',
    transportation: editing?.transportation || transportOptions[0],
    packageName: editing?.packageName || '',
    images: editing?.images && Array.isArray(editing.images) ? editing.images : ["", "", ""] ,
    imageFiles: [],
    cost: editing?.cost?.toString() || '',
    paid: editing?.paid || false,
    currency: editing?.currency || 'USD',
    paymentStatus: editing?.paymentStatus || (editing?.paid ? 'paid' : 'unpaid'),
    paymentResponsibility: editing?.paymentResponsibility || 'sender',
    vehiclesCount: editing?.vehiclesCount || '',
    vehicleType: editing?.vehicleType || '',
    driverName: editing?.driverName || '',
    driverExperience: editing?.driverExperience || '',
    countdownDuration: editing?.countdownDuration?.toString() || '24', // in hours, default 24
    // 12 checkpoint fields
    checkpoint_1: editing?.checkpoints[0]?.location || '',
    checkpoint_2: editing?.checkpoints[1]?.location || '',
    checkpoint_3: editing?.checkpoints[2]?.location || '',
    checkpoint_4: editing?.checkpoints[3]?.location || '',
    checkpoint_5: editing?.checkpoints[4]?.location || '',
    checkpoint_6: editing?.checkpoints[5]?.location || '',
    checkpoint_7: editing?.checkpoints[6]?.location || '',
    checkpoint_8: editing?.checkpoints[7]?.location || '',
    checkpoint_9: editing?.checkpoints[8]?.location || '',
    checkpoint_10: editing?.checkpoints[9]?.location || '',
    checkpoint_11: editing?.checkpoints[10]?.location || '',
    checkpoint_12: editing?.checkpoints[11]?.location || '',
  };

  const [formData, setFormData] = useState<any>(initialData);
  const [submittedTrackingId, setSubmittedTrackingId] = useState<string | null>(null);
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const selectedImageFiles: File[] = Array.isArray(formData.imageFiles) ? formData.imageFiles : [];

  useEffect(() => {
    clearError();
  }, [clearError]);

  useEffect(() => {
    if (editing) setFormData(initialData);
  }, [editing]);

  const transportIsLand = formData.transportation === 'Land Transport';
  const transportMeta = (() => {
    const value = String(formData.transportation || '').toLowerCase();
    if (value.includes('air')) {
      return { label: 'Pilot', emoji: '✈️', title: 'Aircraft & Pilot Details', vehicleLabel: 'Aircraft Type' };
    }
    if (value.includes('ocean') || value.includes('sea')) {
      return { label: 'Captain', emoji: '🚢', title: 'Vessel & Captain Details', vehicleLabel: 'Vessel Type' };
    }
    if (value.includes('door')) {
      return { label: 'Dispatch Rider', emoji: '🛵', title: 'Dispatch Rider Details', vehicleLabel: 'Rider Vehicle Type' };
    }
    return { label: 'Driver', emoji: '🚚', title: 'Vehicle & Driver Information', vehicleLabel: 'Truck Type' };
  })();

  const vehiclePlaceholder = (() => {
    const value = String(formData.transportation || '').toLowerCase();
    if (value.includes('air')) return 'e.g., Cargo Plane, Jet, Boeing 747';
    if (value.includes('ocean') || value.includes('sea')) return 'e.g., Container Ship, Cargo Vessel';
    if (value.includes('door')) return 'e.g., Dispatch Bike, Delivery Van';
    return 'e.g., Truck, Trailer, Courier Van';
  })();

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type, checked, files } = e.target as any;
    if (type === 'checkbox') {
      setFormData((d: any) => ({ ...d, [name]: checked, ...(name === 'paid' ? { paymentStatus: checked ? 'paid' : 'unpaid' } : {}) }));
    } else if (type === 'file') {
      setFormData((d: any) => ({ ...d, [name]: files }));
    } else {
      setFormData((d: any) => ({ ...d, [name]: value }));
    }
  };

  const handleProductImageFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setFormData((fd: any) => {
      const currentFiles: File[] = Array.isArray(fd.imageFiles) ? fd.imageFiles : [];
      const currentUrls = (fd.images || []).filter((url: string) => url && url.trim() !== "");
      const availableSlots = Math.max(0, 6 - currentUrls.length - currentFiles.length);
      return { ...fd, imageFiles: [...currentFiles, ...files.slice(0, availableSlots)] };
    });
    e.currentTarget.value = '';
  };

  const removeSelectedImageFile = (idx: number) => {
    setFormData((fd: any) => ({
      ...fd,
      imageFiles: (Array.isArray(fd.imageFiles) ? fd.imageFiles : []).filter((_: File, i: number) => i !== idx),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return; // Prevent double submission
    setIsSubmitting(true);
    setValidationError(null);
    console.log('=== FORM SUBMISSION STARTED ===');

    // Validate required fields
    const requiredFields = [
      { key: 'senderName', label: 'Sender Name' },
      { key: 'senderPhone', label: 'Sender Phone' },
      { key: 'senderEmail', label: 'Sender Email' },
      { key: 'receiverName', label: 'Receiver Name' },
      { key: 'receiverPhone', label: 'Receiver Phone' },
      { key: 'receiverEmail', label: 'Receiver Email' },
      { key: 'pickupLocation', label: 'Pickup Location' },
      { key: 'deliveryAddress', label: 'Delivery Address' },
      { key: 'packageName', label: 'Package Name' },
    ];

    for (const field of requiredFields) {
      const value = formData[field.key]?.toString().trim();
      console.log(`Checking ${field.key}:`, value);
      if (!value) {
        const errorMsg = `${field.label} is required`;
        console.error('Validation failed:', errorMsg);
        setValidationError(errorMsg);
        setIsSubmitting(false);
        return;
      }
    }
    
    console.log('✓ All required fields valid');

    const vehicleTypeValue = formData.vehicleType?.toString().trim();
    if (!vehicleTypeValue) {
      const errorMsg = `${transportMeta.vehicleLabel} is required`;
      setValidationError(errorMsg);
      setIsSubmitting(false);
      return;
    }
    
    // Collect non-empty checkpoints from the 12 fields
    const checkpointLocations = [];
    for (let i = 1; i <= 12; i++) {
      const location = formData[`checkpoint_${i}`]?.trim();
      if (location) {
        checkpointLocations.push(location);
      }
    }

    console.log('Checkpoints count:', checkpointLocations.length);

    // Validate checkpoint count (minimum 5, maximum 12)
    if (checkpointLocations.length < 5) {
      const errorMsg = 'Please provide at least 5 checkpoint locations';
      console.error('Validation failed:', errorMsg);
      setValidationError(errorMsg);
      setIsSubmitting(false);
      return;
    }
    if (checkpointLocations.length > 12) {
      const errorMsg = 'Maximum 12 checkpoint locations allowed';
      console.error('Validation failed:', errorMsg);
      setValidationError(errorMsg);
      setIsSubmitting(false);
      return;
    }

    console.log('✓ Checkpoint validation passed');


    // Validate product images across URL and device-upload options.
    const imageUrls = (formData.images || []).filter((url: string) => url && url.trim() !== "");
    const imageFiles: File[] = Array.isArray(formData.imageFiles) ? formData.imageFiles : [];
    const totalImages = imageUrls.length + imageFiles.length;
    if (totalImages < 3) {
      const errorMsg = 'Please add at least 3 product images using URLs, device uploads, or both (maximum 6 total)';
      console.error('Validation failed:', errorMsg);
      setValidationError(errorMsg);
      setIsSubmitting(false);
      return;
    }
    if (totalImages > 6) {
      const errorMsg = 'Maximum 6 product images allowed across URLs and uploads';
      console.error('Validation failed:', errorMsg);
      setValidationError(errorMsg);
      setIsSubmitting(false);
      return;
    }
    const urlPattern = /^https?:\/\//i;
    if (imageUrls.some((url: string) => !urlPattern.test(url))) {
      const errorMsg = 'All product image URLs must be valid (start with http or https)';
      setValidationError(errorMsg);
      setIsSubmitting(false);
      return;
    }
    if (imageFiles.some((file) => !file.type.startsWith('image/'))) {
      const errorMsg = 'Uploaded product files must be images';
      setValidationError(errorMsg);
      setIsSubmitting(false);
      return;
    }
    console.log('Product image validation passed:', totalImages, 'images');

    const checkpointArr: any[] = checkpointLocations.map((loc: string) => ({
      id: crypto.randomUUID(),
      location: loc,
    }));

    const data: any = {
      id: formData.id,
      senderName: formData.senderName,
      senderPhone: formData.senderPhone,
      senderEmail: formData.senderEmail,
      receiverName: formData.receiverName,
      receiverPhone: formData.receiverPhone,
      receiverEmail: formData.receiverEmail,
      pickupLocation: formData.pickupLocation,
      deliveryAddress: formData.deliveryAddress,
      transportation: formData.transportation,
      packageName: formData.packageName,
      images: imageUrls,
      imageFiles,
      cost: parseFloat(formData.cost) || 0,
      paid: formData.paid,
      currency: formData.currency,
      paymentStatus: formData.paymentStatus,
      paymentResponsibility: formData.paymentResponsibility,
      checkpoints: checkpointArr,
      vehiclesCount: formData.vehiclesCount ? parseInt(formData.vehiclesCount, 10) : undefined,
      vehicleType: formData.vehicleType,
      driverName: formData.driverName,
      driverExperience: formData.driverExperience,
      countdownDuration: formData.countdownDuration ? parseInt(formData.countdownDuration, 10) : 24, // in hours
      countdownStartTime: editing?.countdownStartTime || new Date().toISOString(), // use existing start time if editing, else current time
    };

    console.log('Data prepared:', { ...data, id: data.id, checkpointCount: data.checkpoints.length });

    try {
      if (editing) {
        console.log('Updating existing shipment:', editing.id);
        await updateShipment(editing.id, data);
        clearError();
        navigate('/admin');
      } else {
        console.log('Creating new shipment...');
        await addShipment(data);
        console.log('✓ Shipment created, setting tracking ID:', data.id);
        clearError();
        setSubmittedTrackingId(data.id);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to submit form. Please try again.';
      setValidationError(errorMsg);
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyTrackingId = () => {
    if (submittedTrackingId) {
      navigator.clipboard.writeText(submittedTrackingId);
      setCopiedToClipboard(true);
      setTimeout(() => setCopiedToClipboard(false), 2000);
    }
  };

  if (submittedTrackingId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center py-12 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center"
        >
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center mx-auto mb-6 shadow-lg">
            <CheckCircle2 className="w-12 h-12 text-white" />
          </div>

          <h2 className="text-3xl font-bold text-[#0F1F3D] mb-2">Shipment Created!</h2>
          <p className="text-gray-600 mb-6">Your tracking ID has been generated and is ready to share.</p>

          <div className="bg-gray-50 border-2 border-[#2563EB] rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600 mb-2">Tracking ID:</p>
            <p className="text-2xl font-bold text-[#0F1F3D] break-all">{submittedTrackingId}</p>
          </div>

          <button
            onClick={handleCopyTrackingId}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#2563EB] text-white font-semibold rounded-lg hover:bg-[#1e4a9b] transition-all duration-300 mb-4"
          >
            <Copy className="w-5 h-5" />
            {copiedToClipboard ? 'Copied to Clipboard!' : 'Copy Tracking ID'}
          </button>

          <button
            onClick={() => navigate('/admin')}
            className="w-full px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-all duration-300"
          >
            Back to Dashboard
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 pt-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-[#0F1F3D] mb-2">
            {editing ? '✏️ Edit Shipment' : '📦 Create New Shipment'}
          </h1>
          <p className="text-gray-600">Fill in the shipment details below to get started</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl overflow-hidden"
        >
          <div className="bg-gradient-to-r from-[#2563EB] to-[#38BDF8] px-8 py-6">
            <h2 className="text-2xl font-bold text-white">Shipment Information</h2>
          </div>
          
          <form onSubmit={handleSubmit} className="p-8">
            {(validationError || contextError) && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg text-red-700 font-medium"
              >
                ⚠️ {validationError || contextError}
              </motion.div>
            )}

            <div className="space-y-8">
              {/* Sender Information Section */}
              <div>
                <h3 className="text-lg font-semibold text-[#0F1F3D] mb-4 flex items-center gap-2">
                  <span className="text-2xl">👤</span> Sender Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="senderName" className="block text-sm font-semibold text-gray-700 mb-2">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="senderName"
                      name="senderName"
                      placeholder="John Doe"
                      value={formData.senderName}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition-all"
                    />
                  </div>
                  <div>
                    <label htmlFor="senderPhone" className="block text-sm font-semibold text-gray-700 mb-2">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="senderPhone"
                      name="senderPhone"
                      placeholder="+1 (555) 000-0000"
                      value={formData.senderPhone}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition-all"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label htmlFor="senderEmail" className="block text-sm font-semibold text-gray-700 mb-2">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="senderEmail"
                      type="email"
                      name="senderEmail"
                      placeholder="john@example.com"
                      value={formData.senderEmail}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Receiver Information Section */}
              <div>
                <h3 className="text-lg font-semibold text-[#0F1F3D] mb-4 flex items-center gap-2">
                  <span className="text-2xl">📬</span> Receiver Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="receiverName" className="block text-sm font-semibold text-gray-700 mb-2">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="receiverName"
                      name="receiverName"
                      placeholder="Jane Smith"
                      value={formData.receiverName}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition-all"
                    />
                  </div>
                  <div>
                    <label htmlFor="receiverPhone" className="block text-sm font-semibold text-gray-700 mb-2">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="receiverPhone"
                      name="receiverPhone"
                      placeholder="+1 (555) 000-0000"
                      value={formData.receiverPhone}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition-all"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label htmlFor="receiverEmail" className="block text-sm font-semibold text-gray-700 mb-2">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="receiverEmail"
                      type="email"
                      name="receiverEmail"
                      placeholder="jane@example.com"
                      value={formData.receiverEmail}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Location Information Section */}
              <div>
                <h3 className="text-lg font-semibold text-[#0F1F3D] mb-4 flex items-center gap-2">
                  <span className="text-2xl">📍</span> Location Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="pickupLocation" className="block text-sm font-semibold text-gray-700 mb-2">
                      Pickup/Takeoff Location <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="pickupLocation"
                      name="pickupLocation"
                      placeholder="e.g., Warehouse A, Port of Charlotte, Airport Terminal"
                      value={formData.pickupLocation}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition-all"
                    />
                    <p className="text-xs text-gray-500 mt-1">Where the package originates from</p>
                  </div>
                  <div>
                    <label htmlFor="deliveryAddress" className="block text-sm font-semibold text-gray-700 mb-2">
                      Delivery Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="deliveryAddress"
                      name="deliveryAddress"
                      placeholder="Final destination"
                      value={formData.deliveryAddress}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition-all"
                    />
                    <p className="text-xs text-gray-500 mt-1">Final delivery destination</p>
                  </div>
                </div>
              </div>

              {/* Shipment Details Section */}
              <div>
                <h3 className="text-lg font-semibold text-[#0F1F3D] mb-4 flex items-center gap-2">
                  <span className="text-2xl">📦</span> Shipment Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="packageName" className="block text-sm font-semibold text-gray-700 mb-2">
                      Package Name(s) <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="packageName"
                      name="packageName"
                      placeholder="e.g., Electronics, Documents, Fragile Items"
                      value={formData.packageName}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition-all"
                    />
                  </div>
                  <div>
                    <label htmlFor="transportation" className="block text-sm font-semibold text-gray-700 mb-2">
                      Transportation Method <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="transportation"
                      name="transportation"
                      value={formData.transportation}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition-all"
                      aria-label="Select transportation method"
                    >
                      {transportOptions.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="cost" className="block text-sm font-semibold text-gray-700 mb-2">
                      Shipping Cost <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="cost"
                      type="number"
                      name="cost"
                      placeholder="0.00"
                      step="0.01"
                      value={formData.cost}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition-all"
                      aria-label="Enter shipment cost"
                    />
                  </div>
                  <div>
                    <label htmlFor="currency" className="block text-sm font-semibold text-gray-700 mb-2">Currency</label>
                    <select id="currency" name="currency" value={formData.currency} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg">
                      <option value="USD">USD</option><option value="EUR">EUR</option><option value="GBP">GBP</option><option value="NGN">NGN</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="paymentResponsibility" className="block text-sm font-semibold text-gray-700 mb-2">Payment responsibility</label>
                    <select id="paymentResponsibility" name="paymentResponsibility" value={formData.paymentResponsibility} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg">
                      <option value="sender">Sender</option><option value="receiver">Receiver</option><option value="company">Company</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="paymentStatus" className="block text-sm font-semibold text-gray-700 mb-2">Payment status</label>
                    <select id="paymentStatus" name="paymentStatus" value={formData.paymentStatus} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg">
                      <option value="unpaid">Unpaid</option><option value="pending">Awaiting payment</option><option value="paid">Paid</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="countdownDuration" className="block text-sm font-semibold text-gray-700 mb-2">
                      ⏱️ Est. Time to Arrival (Hours) <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="countdownDuration"
                      type="number"
                      name="countdownDuration"
                      min="1"
                      max="720"
                      placeholder="24"
                      value={formData.countdownDuration}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition-all"
                      aria-label="Enter estimated time to arrival in hours"
                    />
                    <p className="text-xs text-gray-500 mt-1">Countdown starts when shipment is created</p>
                  </div>
                  <div className="flex items-center gap-3 pt-2">
                    <input
                      id="paid"
                      type="checkbox"
                      name="paid"
                      checked={formData.paid}
                      onChange={handleChange}
                      className="w-4 h-4 rounded border-gray-300 text-[#2563EB] focus:ring-2 focus:ring-[#2563EB]"
                      aria-label="Mark shipment as paid"
                    />
                    <label htmlFor="paid" className="text-sm font-semibold text-gray-700">
                      ✅ Payment Received
                    </label>
                  </div>
                </div>
              </div>

              {/* Route Milestones Section */}
              <div>
                <h3 className="text-lg font-semibold text-[#0F1F3D] mb-4 flex items-center gap-2">
                  <span className="text-2xl">🗺️</span> Shipment Route
                </h3>
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-5 mb-4">
                  <p className="text-sm font-semibold text-blue-900 mb-1">📍 Route Milestones</p>
                  <p className="text-xs text-blue-700">Define <strong>5 to 12</strong> waypoints/locations along the shipment route</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((num) => (
                    <div key={`checkpoint_${num}`}>
                      <label htmlFor={`checkpoint_${num}`} className="block text-xs font-semibold text-gray-700 mb-2">
                        Milestone {num} <span className={num <= 5 ? 'text-red-500' : 'text-gray-400'}>*</span>
                      </label>
                      <input
                        type="text"
                        id={`checkpoint_${num}`}
                        name={`checkpoint_${num}`}
                        placeholder={`e.g., ${['Maitama', 'Lekki', 'Ikeja', 'Victoria Island', 'Surulere', 'Ajah', 'Ikoyi', 'Yaba', 'Bariga', 'Mushin', 'Ejigbo', 'Shomolu'][num - 1]}`}
                        value={formData[`checkpoint_${num}`] || ''}
                        onChange={handleChange}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition-all"
                      />
                    </div>
                  ))}
                </div>
              </div>
              {/* Vehicle & Driver Information (for Land Transport) */}
              {transportIsLand && (
                <div>
                  <h3 className="text-lg font-semibold text-[#0F1F3D] mb-4 flex items-center gap-2">
                    <span className="text-2xl">{transportMeta.emoji}</span> {transportMeta.title}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="vehiclesCount" className="block text-sm font-semibold text-gray-700 mb-2">
                        Number of Vehicles
                      </label>
                      <input
                        id="vehiclesCount"
                        type="number"
                        name="vehiclesCount"
                        placeholder="1"
                        value={formData.vehiclesCount}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition-all"
                      />
                    </div>
                    <div>
                      <label htmlFor="vehicleType" className="block text-sm font-semibold text-gray-700 mb-2">
                        {transportMeta.vehicleLabel} <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="vehicleType"
                        name="vehicleType"
                        placeholder={vehiclePlaceholder}
                        value={formData.vehicleType}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition-all"
                      />
                    </div>
                    <div>
                      <label htmlFor="driverName" className="block text-sm font-semibold text-gray-700 mb-2">
                        Driver Name
                      </label>
                      <input
                        id="driverName"
                        name="driverName"
                        placeholder="Full name"
                        value={formData.driverName}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition-all"
                      />
                    </div>
                    <div>
                      <label htmlFor="driverExperience" className="block text-sm font-semibold text-gray-700 mb-2">
                        Years of Experience
                      </label>
                      <input
                        id="driverExperience"
                        name="driverExperience"
                        placeholder="e.g., 5"
                        value={formData.driverExperience}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition-all"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Pilot / Captain / Dispatch Rider Information (non-land transport) */}
              {!transportIsLand && (
                <div>
                  <h3 className="text-lg font-semibold text-[#0F1F3D] mb-4 flex items-center gap-2">
                    <span className="text-2xl">{transportMeta.emoji}</span> {transportMeta.title}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="vehicleType" className="block text-sm font-semibold text-gray-700 mb-2">
                        {transportMeta.vehicleLabel} <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="vehicleType"
                        name="vehicleType"
                        placeholder={vehiclePlaceholder}
                        value={formData.vehicleType}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition-all"
                      />
                    </div>
                    <div>
                      <label htmlFor="driverName" className="block text-sm font-semibold text-gray-700 mb-2">
                        {transportMeta.label} Name
                      </label>
                      <input
                        id="driverName"
                        name="driverName"
                        placeholder={`Full ${transportMeta.label.toLowerCase()} name`}
                        value={formData.driverName}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition-all"
                      />
                    </div>
                    <div>
                      <label htmlFor="driverExperience" className="block text-sm font-semibold text-gray-700 mb-2">
                        Years of Experience
                      </label>
                      <input
                        id="driverExperience"
                        name="driverExperience"
                        placeholder="e.g., 8"
                        value={formData.driverExperience}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition-all"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Product Images Section */}
              <div className="border-t-2 border-gray-200 pt-8">
                <h3 className="text-lg font-semibold text-[#0F1F3D] mb-4 flex items-center gap-2">
                  <span className="text-2xl">🖼️</span> Product Images
                </h3>
                <p className="text-sm text-gray-600 mb-4">Add 3-6 product images using image URLs, device uploads, or both.</p>
                <div className="space-y-3">
                  <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4">
                    <label htmlFor="productImageFiles" className="mb-2 block text-sm font-semibold text-gray-700">
                      Option 2: Upload product images from device
                    </label>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                      <input
                        id="productImageFiles"
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleProductImageFilesChange}
                        className="block w-full cursor-pointer rounded-lg border border-gray-300 bg-white text-sm text-gray-700 file:mr-4 file:border-0 file:bg-[#2563EB] file:px-4 file:py-3 file:text-sm file:font-semibold file:text-white hover:file:bg-[#1e4a9b]"
                      />
                    </div>
                    <p className="mt-2 text-xs text-gray-500">Selected uploads count toward the same 6-image limit.</p>
                    {selectedImageFiles.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {selectedImageFiles.map((file, idx) => (
                          <div key={`${file.name}-${idx}`} className="flex items-center justify-between gap-3 rounded-md bg-white px-3 py-2 text-sm text-gray-700 ring-1 ring-gray-200">
                            <span className="min-w-0 flex-1 truncate">{file.name}</span>
                            <button
                              type="button"
                              onClick={() => removeSelectedImageFile(idx)}
                              className="rounded-md p-1 text-red-500 transition-colors hover:bg-red-50 hover:text-red-700"
                              aria-label={`Remove ${file.name}`}
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Option 1: Add image URLs</p>
                  {formData.images && formData.images.map((url: string, idx: number) => (
                    <div key={idx} className="flex gap-3 items-center">
                      <div className="flex-1">
                        <input
                          type="url"
                          placeholder={`Image URL #${idx + 1}`}
                          value={url}
                          onChange={e => {
                            const newArr = [...formData.images];
                            newArr[idx] = e.target.value;
                            setFormData((fd: any) => ({ ...fd, images: newArr }));
                          }}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition-all"
                        />
                      </div>
                      {formData.images.length > 3 && (
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          type="button"
                          className="px-3 py-3 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg font-bold transition-all"
                          onClick={() => {
                            setFormData((fd: any) => ({ ...fd, images: fd.images.filter((_: any, i: number) => i !== idx) }));
                          }}
                          aria-label="Remove image URL"
                        >
                          ✕
                        </motion.button>
                      )}
                    </div>
                  ))}
                  {formData.images && formData.images.length + selectedImageFiles.length < 6 && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      className="w-full mt-3 px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 text-[#2563EB] font-semibold rounded-lg hover:from-blue-100 hover:to-indigo-100 border-2 border-dashed border-[#2563EB]/50 transition-all"
                      onClick={() => setFormData((fd: any) => ({ ...fd, images: [...fd.images, ""] }))}
                    >
                      + Add another image URL (max 6 total)
                    </motion.button>
                  )}
                  {validationError && validationError.toLowerCase().includes('image') && (
                    <p className="mt-2 text-sm text-red-600 font-semibold">{validationError}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-4 px-8 pb-8">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={() => navigate('/admin')}
                className="px-8 py-4 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-lg transition-all duration-200"
              >
                Cancel
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isSubmitting}
                className={`px-8 py-4 font-semibold rounded-lg transition-all duration-200 ${
                  isSubmitting
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-[#2563EB] to-[#38BDF8] text-white hover:shadow-lg hover:shadow-blue-500/50'
                }`}
              >
                {isSubmitting ? '⏳ Processing...' : editing ? '💾 Save Changes' : '✅ Create Shipment'}
              </motion.button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}

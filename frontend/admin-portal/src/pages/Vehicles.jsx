import React, { useState, useEffect, useMemo } from 'react'
import { Search, Plus, Car, Fuel, Wrench, FileText, Eye, Edit, Trash2, RefreshCw, Users, Calendar, MapPin, Settings } from 'lucide-react'
import { Button, Modal, Input, Card, showToast, Loader } from '@shared'
import { VEHICLE_STATUS, VEHICLE_TYPES, FUEL_TYPES } from '@shared'
import { adminApi } from '../services/adminApi'

// Inline Badge component
const Badge = ({ children, variant = 'default', className = '' }) => {
  const variantClasses = {
    default: 'bg-gray-100 text-gray-800',
    success: 'bg-green-100 text-green-800',
    error: 'bg-red-100 text-red-800',
    warning: 'bg-yellow-100 text-yellow-800',
    info: 'bg-blue-100 text-blue-800'
  };

  const baseClasses = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
  
  return (
    <span className={`${baseClasses} ${variantClasses[variant] || variantClasses.default} ${className}`}>
      {children}
    </span>
  );
};

const Vehicles = () => {
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [error, setError] = useState('')
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [viewModalOpen, setViewModalOpen] = useState(false)
  
  // Vehicle states
  const [editingVehicle, setEditingVehicle] = useState(null)
  const [selectedVehicle, setSelectedVehicle] = useState(null)
  
  const [formData, setFormData] = useState({
    plateNumber: '',
    make: '',
    model: '',
    year: new Date().getFullYear(),
    vehicleType: 'bus',
    fuelType: 'diesel',
    capacity: 15,
    color: '',
    currentOdometer: 0,
    lastServiceDate: '',
    nextServiceDate: '',
    insuranceProvider: '',
    insuranceExpiry: '',
    purchaseDate: '',
    purchasePrice: '',
    registrationNumber: '',
    chassisNumber: '',
    engineNumber: '',
    status: 'active'
  })

  useEffect(() => {
    fetchVehicles()
  }, [])

  // Filter vehicles based on search term and status
  const filteredVehicles = useMemo(() => {
    if (!Array.isArray(vehicles)) return []
    if (!searchTerm && statusFilter === 'all' && typeFilter === 'all') return vehicles
    
    const searchLower = searchTerm.toLowerCase()
    
    return vehicles.filter(vehicle => {
      if (!vehicle) return false
      
      // Search filter
      const matchesSearch = searchTerm ? (
        (vehicle.plateNumber?.toLowerCase().includes(searchLower)) ||
        (vehicle.make?.toLowerCase().includes(searchLower)) ||
        (vehicle.model?.toLowerCase().includes(searchLower)) ||
        (vehicle.registrationNumber?.toLowerCase().includes(searchLower))
      ) : true
      
      // Status filter
      const matchesStatus = statusFilter === 'all' || vehicle.status === statusFilter
      // Type filter
      const matchesType = typeFilter === 'all' || vehicle.vehicleType === typeFilter
      
      return matchesSearch && matchesStatus && matchesType
    })
  }, [vehicles, searchTerm, statusFilter, typeFilter])

  const fetchVehicles = async () => {
    setLoading(true)
    try {
      const response = await adminApi.getVehicles()
      console.log('Vehicles API Response:', response)
      
      // Handle different response formats
      if (response.success && response.data) {
        if (Array.isArray(response.data)) {
          setVehicles(response.data)
        } else if (response.data.vehicles && Array.isArray(response.data.vehicles)) {
          setVehicles(response.data.vehicles)
        } else if (response.data.data && Array.isArray(response.data.data)) {
          setVehicles(response.data.data)
        } else {
          setVehicles(Object.values(response.data))
        }
      } else {
        if (Array.isArray(response)) {
          setVehicles(response)
        } else {
          setVehicles([])
        }
      }
      
      setError('')
    } catch (error) {
      console.error('Error fetching vehicles:', error)
      setError('Failed to load vehicles. Please check your connection and try again.')
      showToast.error('Failed to load vehicles', error.data?.message || error.message)
      setVehicles([])
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    
    try {
      const vehicleData = {
        plateNumber: formData.plateNumber.trim().toUpperCase(),
        make: formData.make.trim(),
        model: formData.model.trim(),
        year: parseInt(formData.year),
        vehicleType: formData.vehicleType,
        fuelType: formData.fuelType,
        capacity: parseInt(formData.capacity),
        color: formData.color,
        currentOdometer: parseInt(formData.currentOdometer) || 0,
        lastServiceDate: formData.lastServiceDate,
        nextServiceDate: formData.nextServiceDate,
        insuranceProvider: formData.insuranceProvider,
        insuranceExpiry: formData.insuranceExpiry,
        purchaseDate: formData.purchaseDate,
        purchasePrice: formData.purchasePrice ? parseFloat(formData.purchasePrice) : 0,
        registrationNumber: formData.registrationNumber,
        chassisNumber: formData.chassisNumber,
        engineNumber: formData.engineNumber,
        status: formData.status
      }

      console.log('Saving vehicle:', editingVehicle ? 'update' : 'create')

      if (editingVehicle) {
        await adminApi.updateVehicle(editingVehicle._id, vehicleData)
        showToast.success('Vehicle updated successfully')
      } else {
        await adminApi.createVehicle(vehicleData)
        showToast.success('Vehicle created successfully')
      }
      
      await fetchVehicles()
      resetForm()
      setIsModalOpen(false)
    } catch (error) {
      console.error('Error saving vehicle:', error)
      setError('Failed to save vehicle. Please try again.')
      showToast.error('Operation failed', error.data?.message || error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (vehicle) => {
    console.log('Editing vehicle:', vehicle._id)
    setEditingVehicle(vehicle)
    setFormData({
      plateNumber: vehicle.plateNumber || '',
      make: vehicle.make || '',
      model: vehicle.model || '',
      year: vehicle.year || new Date().getFullYear(),
      vehicleType: vehicle.vehicleType || 'bus',
      fuelType: vehicle.fuelType || 'diesel',
      capacity: vehicle.capacity || 15,
      color: vehicle.color || '',
      currentOdometer: vehicle.currentOdometer || 0,
      lastServiceDate: vehicle.lastServiceDate ? new Date(vehicle.lastServiceDate).toISOString().split('T')[0] : '',
      nextServiceDate: vehicle.nextServiceDate ? new Date(vehicle.nextServiceDate).toISOString().split('T')[0] : '',
      insuranceProvider: vehicle.insuranceProvider || '',
      insuranceExpiry: vehicle.insuranceExpiry ? new Date(vehicle.insuranceExpiry).toISOString().split('T')[0] : '',
      purchaseDate: vehicle.purchaseDate ? new Date(vehicle.purchaseDate).toISOString().split('T')[0] : '',
      purchasePrice: vehicle.purchasePrice || '',
      registrationNumber: vehicle.registrationNumber || '',
      chassisNumber: vehicle.chassisNumber || '',
      engineNumber: vehicle.engineNumber || '',
      status: vehicle.status || 'active'
    })
    setIsModalOpen(true)
  }

  const handleView = (vehicle) => {
    setSelectedVehicle(vehicle)
    setViewModalOpen(true)
  }

  const handleDelete = async (vehicleId) => {
    if (window.confirm('Are you sure you want to delete this vehicle?')) {
      try {
        await adminApi.deleteVehicle(vehicleId)
        showToast.success('Vehicle deleted successfully')
        fetchVehicles()
      } catch (error) {
        console.error('Error deleting vehicle:', error)
        setError('Failed to delete vehicle. Please try again.')
        showToast.error('Failed to delete vehicle', error.data?.message || error.message)
      }
    }
  }

  const resetForm = () => {
    setFormData({
      plateNumber: '',
      make: '',
      model: '',
      year: new Date().getFullYear(),
      vehicleType: 'bus',
      fuelType: 'diesel',
      capacity: 15,
      color: '',
      currentOdometer: 0,
      lastServiceDate: '',
      nextServiceDate: '',
      insuranceProvider: '',
      insuranceExpiry: '',
      purchaseDate: '',
      purchasePrice: '',
      registrationNumber: '',
      chassisNumber: '',
      engineNumber: '',
      status: 'active'
    })
    setEditingVehicle(null)
  }

  const openCreateModal = () => {
    console.log('Opening create modal')
    resetForm()
    setIsModalOpen(true)
  }

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'maintenance': return 'bg-yellow-100 text-yellow-800'
      case 'accident': return 'bg-red-100 text-red-800'
      case 'retired': return 'bg-gray-100 text-gray-800'
      case 'sold': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status) => {
    if (!status) return 'Unknown'
    return status.charAt(0).toUpperCase() + status.slice(1)
  }

  const getVehicleTypeText = (type) => {
    if (!type) return 'Unknown'
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatCurrency = (amount) => {
    if (!amount) return 'N/A'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'KES'
    }).format(amount)
  }

  const getVehicleIconColor = (type) => {
    switch (type) {
      case 'bus': return 'bg-blue-100 text-blue-600'
      case 'van': return 'bg-green-100 text-green-600'
      case 'sedan': return 'bg-purple-100 text-purple-600'
      case 'truck': return 'bg-orange-100 text-orange-600'
      case 'minibus': return 'bg-indigo-100 text-indigo-600'
      default: return 'bg-gray-100 text-gray-600'
    }
  }

  // Calculate stats
  const totalVehicles = vehicles.length
  const activeVehicles = vehicles.filter(v => v.status === 'active').length
  const maintenanceVehicles = vehicles.filter(v => v.status === 'maintenance').length
  const busCount = vehicles.filter(v => v.vehicleType === 'bus').length
  const totalCapacity = vehicles.reduce((sum, v) => sum + (v.capacity || 0), 0)

  // Display vehicles - filtered if search is active
  const displayVehicles = filteredVehicles

  return (
    <div className="p-6">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center space-y-4 lg:space-y-0 mb-6">
        <div className="text-center lg:text-left">
          <h1 className="text-2xl font-bold text-gray-900">Vehicle Management</h1>
          <p className="text-gray-600">
            {searchTerm ? (
              <span>
                Showing {filteredVehicles.length} of {vehicles.length} vehicles
                {searchTerm && ` for "${searchTerm}"`}
              </span>
            ) : (
              'Manage school vehicles, fuel, and maintenance'
            )}
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={fetchVehicles}
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
          <Button
            onClick={openCreateModal}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Vehicle
          </Button>
        </div>
      </div>

      {/* Search Status */}
      {searchTerm && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Search className="w-5 h-5 text-blue-600" />
              <span className="text-blue-700">
                Searching for: <strong>"{searchTerm}"</strong> - Found {filteredVehicles.length} results
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
          <button 
            onClick={() => setError('')}
            className="float-right text-red-800 font-bold px-2"
          >
            ×
          </button>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-3">
              <Car className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Vehicles</p>
              <p className="text-2xl font-bold">{totalVehicles}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-3">
              <Car className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Active</p>
              <p className="text-2xl font-bold">{activeVehicles}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg p-3">
              <Wrench className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">In Maintenance</p>
              <p className="text-2xl font-bold">{maintenanceVehicles}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-3">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Capacity</p>
              <p className="text-2xl font-bold">{totalCapacity}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Search and Filter Card */}
      <Card className="mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search vehicles by plate, make, model, or registration..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          {/* Status Filter */}
          <div className="w-full md:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="maintenance">Maintenance</option>
              <option value="accident">Accident</option>
              <option value="retired">Retired</option>
              <option value="sold">Sold</option>
            </select>
          </div>
          {/* Type Filter */}
          <div className="w-full md:w-48">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="bus">Bus</option>
              <option value="van">Van</option>
              <option value="sedan">Sedan</option>
              <option value="truck">Truck</option>
              <option value="minibus">Minibus</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Vehicles Grid */}
      <Card>
        {loading ? (
          <div className="py-12 text-center">
            <Loader size="lg" />
            <p className="mt-4 text-gray-600">Loading vehicles...</p>
          </div>
        ) : !Array.isArray(displayVehicles) || displayVehicles.length === 0 ? (
          <div className="py-12 text-center">
            <div className="mx-auto w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <Car className="w-12 h-12 text-gray-400" />
            </div>
            <p className="text-gray-500 text-lg mb-2">
              {searchTerm ? 'No vehicles found' : 'No vehicles yet'}
            </p>
            <p className="text-gray-400 mb-6">
              {searchTerm 
                ? `No vehicles found for "${searchTerm}". Try a different search term.`
                : 'Get started by adding your first vehicle'
              }
            </p>
            {!searchTerm && (
              <Button
                onClick={openCreateModal}
                className="flex items-center gap-2 mx-auto"
              >
                <Plus className="w-4 h-4" />
                Add Your First Vehicle
              </Button>
            )}
            {(searchTerm || statusFilter !== 'all' || typeFilter !== 'all') && (
              <Button
                variant="link"
                onClick={() => {
                  setSearchTerm('')
                  setStatusFilter('all')
                  setTypeFilter('all')
                }}
                className="mt-4"
              >
                Clear filters
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayVehicles.map((vehicle) => (
              <div key={vehicle._id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full ${getVehicleIconColor(vehicle.vehicleType)} flex items-center justify-center`}>
                        <Car className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 truncate">
                          {vehicle.make} {vehicle.model} ({vehicle.year})
                        </h3>
                        <p className="text-sm text-gray-600 truncate">
                          {vehicle.plateNumber} • {getVehicleTypeText(vehicle.vehicleType)}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-1 flex-shrink-0 ml-2">
                    <button 
                      onClick={() => handleView(vehicle)} 
                      className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                      title="View"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleEdit(vehicle)} 
                      className="p-1 text-green-600 hover:text-green-800 hover:bg-green-50 rounded"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(vehicle._id)} 
                      className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span><strong>Capacity:</strong> {vehicle.capacity || 0} seats</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Fuel className="w-4 h-4 text-gray-400" />
                    <span><strong>Fuel:</strong> {vehicle.fuelType ? vehicle.fuelType.charAt(0).toUpperCase() + vehicle.fuelType.slice(1) : 'Unknown'}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span><strong>Odometer:</strong> {vehicle.currentOdometer ? vehicle.currentOdometer.toLocaleString() + ' km' : '0 km'}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span><strong>Status:</strong></span>
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(vehicle.status)}`}>
                      {getStatusText(vehicle.status)}
                    </span>
                  </div>
                  
                  {vehicle.color && (
                    <div className="flex items-center gap-2">
                      <span><strong>Color:</strong> {vehicle.color}</span>
                    </div>
                  )}
                </div>
                
                {vehicle.createdAt && (
                  <div className="mt-4 pt-3 border-t text-xs text-gray-500">
                    Added: {formatDate(vehicle.createdAt)}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Create/Edit Vehicle Modal - FIXED with closeOnBackdropClick={false} */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingVehicle(null)
          resetForm()
        }}
        closeOnBackdropClick={false}
        title={editingVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Plate Number *"
              name="plateNumber"
              required
              value={formData.plateNumber}
              onChange={handleInputChange}
              placeholder="e.g., KAA123A"
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Type *</label>
              <select
                name="vehicleType"
                required
                value={formData.vehicleType}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="bus">Bus</option>
                <option value="van">Van</option>
                <option value="sedan">Sedan</option>
                <option value="truck">Truck</option>
                <option value="minibus">Minibus</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Make *"
              name="make"
              required
              value={formData.make}
              onChange={handleInputChange}
              placeholder="e.g., Toyota"
            />
            <Input
              label="Model *"
              name="model"
              required
              value={formData.model}
              onChange={handleInputChange}
              placeholder="e.g., Hiace"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Year *"
              name="year"
              type="number"
              required
              min="1990"
              max={new Date().getFullYear() + 1}
              value={formData.year}
              onChange={handleInputChange}
              placeholder="e.g., 2023"
            />
            <Input
              label="Passenger Capacity *"
              name="capacity"
              type="number"
              required
              min="1"
              value={formData.capacity}
              onChange={handleInputChange}
              placeholder="Number of seats"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fuel Type *</label>
              <select
                name="fuelType"
                required
                value={formData.fuelType}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="diesel">Diesel</option>
                <option value="petrol">Petrol</option>
                <option value="electric">Electric</option>
                <option value="hybrid">Hybrid</option>
                <option value="cng">CNG</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="active">Active</option>
                <option value="maintenance">Maintenance</option>
                <option value="accident">Accident</option>
                <option value="retired">Retired</option>
                <option value="sold">Sold</option>
              </select>
            </div>
          </div>

          {/* Additional Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Color"
              name="color"
              value={formData.color}
              onChange={handleInputChange}
              placeholder="e.g., White"
            />
            <Input
              label="Current Odometer (km)"
              name="currentOdometer"
              type="number"
              min="0"
              value={formData.currentOdometer}
              onChange={handleInputChange}
              placeholder="e.g., 15000"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Last Service Date"
              name="lastServiceDate"
              type="date"
              value={formData.lastServiceDate}
              onChange={handleInputChange}
            />
            <Input
              label="Next Service Date"
              name="nextServiceDate"
              type="date"
              value={formData.nextServiceDate}
              onChange={handleInputChange}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Insurance Provider"
              name="insuranceProvider"
              value={formData.insuranceProvider}
              onChange={handleInputChange}
              placeholder="e.g., APA Insurance"
            />
            <Input
              label="Insurance Expiry"
              name="insuranceExpiry"
              type="date"
              value={formData.insuranceExpiry}
              onChange={handleInputChange}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Registration Number"
              name="registrationNumber"
              value={formData.registrationNumber}
              onChange={handleInputChange}
              placeholder="Registration number"
            />
            <Input
              label="Chassis Number"
              name="chassisNumber"
              value={formData.chassisNumber}
              onChange={handleInputChange}
              placeholder="Chassis/VIN number"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Engine Number"
              name="engineNumber"
              value={formData.engineNumber}
              onChange={handleInputChange}
              placeholder="Engine number"
            />
            <Input
              label="Purchase Date"
              name="purchaseDate"
              type="date"
              value={formData.purchaseDate}
              onChange={handleInputChange}
            />
          </div>

          <Input
            label="Purchase Price"
            name="purchasePrice"
            type="number"
            min="0"
            step="0.01"
            value={formData.purchasePrice}
            onChange={handleInputChange}
            placeholder="e.g., 2500000"
          />

          <div className="pt-4 flex justify-end gap-3">
            <Button
              variant="secondary"
              type="button"
              onClick={() => {
                setIsModalOpen(false)
                setEditingVehicle(null)
                resetForm()
              }}
            >
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              {editingVehicle ? 'Update Vehicle' : 'Add Vehicle'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* View Vehicle Details Modal */}
      <Modal
        isOpen={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        title="Vehicle Details"
        size="lg"
      >
        {selectedVehicle && (
          <div className="space-y-6">
            {/* Vehicle Header */}
            <div className="flex items-center gap-4 pb-4 border-b">
              <div className={`w-16 h-16 rounded-full ${getVehicleIconColor(selectedVehicle.vehicleType)} flex items-center justify-center`}>
                <Car className="w-8 h-8" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900">
                  {selectedVehicle.make} {selectedVehicle.model} ({selectedVehicle.year})
                </h3>
                <p className="text-gray-600">{selectedVehicle.plateNumber} • {getVehicleTypeText(selectedVehicle.vehicleType)}</p>
                <Badge 
                  className="mt-2"
                  variant={
                    selectedVehicle.status === 'active' ? 'success' :
                    selectedVehicle.status === 'maintenance' ? 'warning' :
                    selectedVehicle.status === 'accident' ? 'error' : 'default'
                  }
                >
                  {getStatusText(selectedVehicle.status)}
                </Badge>
              </div>
            </div>

            {/* Vehicle Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Basic Information</h4>
                  <div className="space-y-2">
                    <div>
                      <strong>Make:</strong> {selectedVehicle.make || 'N/A'}
                    </div>
                    <div>
                      <strong>Model:</strong> {selectedVehicle.model || 'N/A'}
                    </div>
                    <div>
                      <strong>Year:</strong> {selectedVehicle.year || 'N/A'}
                    </div>
                    <div>
                      <strong>Vehicle Type:</strong> {getVehicleTypeText(selectedVehicle.vehicleType)}
                    </div>
                    <div>
                      <strong>Fuel Type:</strong> {selectedVehicle.fuelType ? selectedVehicle.fuelType.charAt(0).toUpperCase() + selectedVehicle.fuelType.slice(1) : 'N/A'}
                    </div>
                    <div>
                      <strong>Color:</strong> {selectedVehicle.color || 'N/A'}
                    </div>
                    <div>
                      <strong>Passenger Capacity:</strong> {selectedVehicle.capacity || 0} seats
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Technical Details</h4>
                  <div className="space-y-2">
                    <div>
                      <strong>Registration Number:</strong> {selectedVehicle.registrationNumber || 'N/A'}
                    </div>
                    <div>
                      <strong>Chassis Number:</strong> {selectedVehicle.chassisNumber || 'N/A'}
                    </div>
                    <div>
                      <strong>Engine Number:</strong> {selectedVehicle.engineNumber || 'N/A'}
                    </div>
                    <div>
                      <strong>Current Odometer:</strong> {selectedVehicle.currentOdometer ? selectedVehicle.currentOdometer.toLocaleString() + ' km' : 'N/A'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Service & Maintenance</h4>
                  <div className="space-y-2">
                    <div>
                      <strong>Last Service:</strong> {formatDate(selectedVehicle.lastServiceDate)}
                    </div>
                    <div>
                      <strong>Next Service:</strong> {formatDate(selectedVehicle.nextServiceDate)}
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Insurance Details</h4>
                  <div className="space-y-2">
                    <div>
                      <strong>Provider:</strong> {selectedVehicle.insuranceProvider || 'N/A'}
                    </div>
                    <div>
                      <strong>Expiry Date:</strong> {formatDate(selectedVehicle.insuranceExpiry)}
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Purchase Information</h4>
                  <div className="space-y-2">
                    <div>
                      <strong>Purchase Date:</strong> {formatDate(selectedVehicle.purchaseDate)}
                    </div>
                    <div>
                      <strong>Purchase Price:</strong> {formatCurrency(selectedVehicle.purchasePrice)}
                    </div>
                  </div>
                </div>

                {selectedVehicle.createdAt && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Record Details</h4>
                    <div className="space-y-2">
                      <div>
                        <strong>Added Date:</strong> {formatDate(selectedVehicle.createdAt)}
                      </div>
                      {selectedVehicle.updatedAt && selectedVehicle.updatedAt !== selectedVehicle.createdAt && (
                        <div>
                          <strong>Last Updated:</strong> {formatDate(selectedVehicle.updatedAt)}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-4 border-t flex justify-end gap-3">
              <Button
                variant="secondary"
                onClick={() => setViewModalOpen(false)}
              >
                Close
              </Button>
              <Button
                onClick={() => {
                  setViewModalOpen(false)
                  handleEdit(selectedVehicle)
                }}
              >
                Edit Vehicle
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default Vehicles
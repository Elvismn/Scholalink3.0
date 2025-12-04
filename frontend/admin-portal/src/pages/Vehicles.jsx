import { useState, useEffect } from 'react'
import { Search, Plus, Car, Fuel, Wrench, FileText, Eye, Edit, Trash2 } from 'lucide-react'
import { Button, Modal, Input, Select, Table, Card, showToast } from '@shared'
import { VEHICLE_STATUS, VEHICLE_TYPES, FUEL_TYPES } from '@shared'
import { adminApi } from '../services/adminApi'

const Vehicles = () => {
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState(null)
  const [formData, setFormData] = useState({
    plateNumber: '',
    make: '',
    model: '',
    type: 'Bus',
    capacity: '',
    fuelType: 'Diesel',
    status: 'Active'
  })

  useEffect(() => {
    fetchVehicles()
  }, [])

  const fetchVehicles = async () => {
    setLoading(true)
    try {
      const response = await adminApi.getVehicles()
      setVehicles(response.data || response)
    } catch (error) {
      showToast.error('Failed to load vehicles', error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingVehicle) {
        await adminApi.updateVehicle(editingVehicle.id, formData)
      } else {
        await adminApi.createVehicle(formData)
      }
      setIsModalOpen(false)
      setEditingVehicle(null)
      setFormData({
        plateNumber: '',
        make: '',
        model: '',
        type: 'Bus',
        capacity: '',
        fuelType: 'Diesel',
        status: 'Active'
      })
      fetchVehicles()
    } catch (error) {
      showToast.error('Operation failed', error.message)
    }
  }

  const handleEdit = (vehicle) => {
    setEditingVehicle(vehicle)
    setFormData({
      plateNumber: vehicle.plateNumber || '',
      make: vehicle.make || '',
      model: vehicle.model || '',
      type: vehicle.type || 'Bus',
      capacity: vehicle.capacity?.toString() || '',
      fuelType: vehicle.fuelType || 'Diesel',
      status: vehicle.status || 'Active'
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (vehicleId) => {
    if (window.confirm('Are you sure you want to delete this vehicle?')) {
      try {
        await adminApi.deleteVehicle(vehicleId)
        fetchVehicles()
      } catch (error) {
        showToast.error('Failed to delete vehicle', error.message)
      }
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800'
      case 'Maintenance': return 'bg-yellow-100 text-yellow-800'
      case 'Accident': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const columns = [
    {
      key: 'details',
      title: 'Vehicle Details',
      render: (_, vehicle) => (
        <div className="flex items-center">
          <div className="bg-blue-100 rounded-lg p-2 mr-3">
            <Car className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <div className="font-medium text-gray-900">
              {vehicle.make} {vehicle.model}
            </div>
            <div className="text-sm text-gray-500">
              {vehicle.plateNumber} • {vehicle.fuelType}
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'type',
      title: 'Type & Capacity',
      render: (_, vehicle) => (
        <div>
          <div className="text-gray-900">{vehicle.type}</div>
          <div className="text-sm text-gray-500">
            {vehicle.capacity} seats
          </div>
        </div>
      )
    },
    {
      key: 'status',
      title: 'Status',
      render: (status) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(status)}`}>
          {status}
        </span>
      )
    },
    {
      key: 'currentOdometer',
      title: 'Odometer',
      render: (odometer) => (
        <div className="text-gray-900">{odometer?.toLocaleString() || '0'} km</div>
      )
    },
    {
      key: 'lastService',
      title: 'Last Service',
      render: (date) => <div className="text-gray-900">{date || 'No service recorded'}</div>
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (_, vehicle) => (
        <div className="flex gap-2">
          <button
            onClick={() => handleEdit(vehicle)}
            className="p-1 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded"
            title="Edit"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(vehicle.id)}
            className="p-1 text-red-600 hover:text-red-900 hover:bg-red-50 rounded"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button 
            className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vehicle Management</h1>
          <p className="text-gray-600">Manage school vehicles, fuel, and maintenance</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            className="flex items-center gap-2"
            onClick={() => showToast.info('Fuel record feature coming soon')}
          >
            <Fuel className="w-4 h-4" />
            Add Fuel Record
          </Button>
          <Button
            variant="secondary"
            className="flex items-center gap-2"
            onClick={() => showToast.info('Maintenance feature coming soon')}
          >
            <Wrench className="w-4 h-4" />
            Add Maintenance
          </Button>
          <Button
            onClick={() => {
              setEditingVehicle(null)
              setFormData({
                plateNumber: '',
                make: '',
                model: '',
                type: 'Bus',
                capacity: '',
                fuelType: 'Diesel',
                status: 'Active'
              })
              setIsModalOpen(true)
            }}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Vehicle
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center">
            <div className="bg-blue-100 rounded-lg p-3">
              <Car className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Vehicles</p>
              <p className="text-2xl font-bold">{vehicles.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center">
            <div className="bg-green-100 rounded-lg p-3">
              <Car className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Active</p>
              <p className="text-2xl font-bold">
                {vehicles.filter(v => v.status === 'Active').length}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center">
            <div className="bg-yellow-100 rounded-lg p-3">
              <Wrench className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">In Maintenance</p>
              <p className="text-2xl font-bold">
                {vehicles.filter(v => v.status === 'Maintenance').length}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center">
            <div className="bg-purple-100 rounded-lg p-3">
              <FileText className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Documents Expiring</p>
              <p className="text-2xl font-bold">
                {/* We'll update this with real data later */}
                {vehicles.filter(v => v.documentsExpiring).length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Search Bar */}
      <Card>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search vehicles by plate number, make, or model..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </Card>

      {/* Vehicles Table */}
      <Card>
        <Table
          columns={columns}
          data={vehicles}
          keyField="id"
          loading={loading}
          emptyMessage="No vehicles found"
        />
      </Card>

      {/* Add/Edit Vehicle Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingVehicle(null)
        }}
        title={editingVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Plate Number"
              required
              placeholder="e.g., KAA123A"
              value={formData.plateNumber}
              onChange={(e) => setFormData({...formData, plateNumber: e.target.value})}
            />
            <Select
              label="Vehicle Type"
              required
              options={Object.entries(VEHICLE_TYPES).map(([key, value]) => ({
                value: key,
                label: value
              }))}
              value={formData.type}
              onChange={(e) => setFormData({...formData, type: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Make"
              required
              placeholder="e.g., Toyota"
              value={formData.make}
              onChange={(e) => setFormData({...formData, make: e.target.value})}
            />
            <Input
              label="Model"
              required
              placeholder="e.g., Hiace"
              value={formData.model}
              onChange={(e) => setFormData({...formData, model: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Capacity"
              type="number"
              required
              placeholder="Number of seats"
              value={formData.capacity}
              onChange={(e) => setFormData({...formData, capacity: e.target.value})}
            />
            <Select
              label="Fuel Type"
              required
              options={Object.entries(FUEL_TYPES).map(([key, value]) => ({
                value: key,
                label: value
              }))}
              value={formData.fuelType}
              onChange={(e) => setFormData({...formData, fuelType: e.target.value})}
            />
          </div>

          <Select
            label="Status"
            options={Object.entries(VEHICLE_STATUS).map(([key, value]) => ({
              value: key,
              label: value
            }))}
            value={formData.status}
            onChange={(e) => setFormData({...formData, status: e.target.value})}
          />

          <div className="pt-4 flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setIsModalOpen(false)
                setEditingVehicle(null)
              }}
            >
              Cancel
            </Button>
            <Button type="submit">
              {editingVehicle ? 'Update Vehicle' : 'Add Vehicle'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default Vehicles

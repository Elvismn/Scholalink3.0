import { useState, useEffect, useMemo } from 'react'
import { Search, Plus, Package, CheckCircle, AlertCircle, Edit, Trash2, RefreshCw, Download } from 'lucide-react'
import { Button, Modal, Input, Card, showToast, Loader } from '@shared'
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

const Inventory = () => {
  const [inventory, setInventory] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [conditionFilter, setConditionFilter] = useState('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [staff, setStaff] = useState([])
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    itemName: '',
    category: 'General',
    quantity: '',
    minQuantity: '5',
    condition: 'Good',
    location: '',
    checkedBy: '',
    notes: ''
  })

  const categories = ['Library', 'Lab', 'General', 'Sports', 'IT']
  const conditions = ['Excellent', 'Good', 'Fair', 'Poor', 'Needs Replacement']

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      console.log('🔍 Inventory - Fetching data...')
      const [inventoryRes, staffRes] = await Promise.all([
        adminApi.getInventory(),
        adminApi.getStaff()
      ])
      
      console.log('✅ Inventory - Data received:', inventoryRes)
      
      // Handle inventory response
      let inventoryData = []
      if (inventoryRes) {
        if (Array.isArray(inventoryRes)) {
          inventoryData = inventoryRes
        } else if (inventoryRes.data && Array.isArray(inventoryRes.data)) {
          inventoryData = inventoryRes.data
        } else if (inventoryRes.inventory && Array.isArray(inventoryRes.inventory)) {
          inventoryData = inventoryRes.inventory
        } else if (typeof inventoryRes === 'object') {
          const arrayProps = Object.values(inventoryRes).filter(Array.isArray)
          if (arrayProps.length > 0) {
            inventoryData = arrayProps[0]
          }
        }
      }
      setInventory(inventoryData || [])
      
      // Handle staff response
      let staffData = []
      if (staffRes) {
        if (Array.isArray(staffRes)) {
          staffData = staffRes
        } else if (staffRes.data && Array.isArray(staffRes.data)) {
          staffData = staffRes.data
        } else if (staffRes.staff && Array.isArray(staffRes.staff)) {
          staffData = staffRes.staff
        }
      }
      setStaff(staffData || [])
      
      setError('')
    } catch (error) {
      console.error('❌ Inventory - Error fetching data:', error)
      setError('Failed to load data. Please check your connection and try again.')
      showToast.error('Failed to load data', error.data?.message || error.message)
      setInventory([])
      setStaff([])
    } finally {
      setLoading(false)
    }
  }

  // Filter inventory based on search term and filters
  const filteredInventory = useMemo(() => {
    if (!Array.isArray(inventory)) return []
    
    return inventory.filter(item => {
      if (!item) return false
      
      // Search filter
      const matchesSearch = searchTerm ? (
        item.itemName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.notes?.toLowerCase().includes(searchTerm.toLowerCase())
      ) : true
      
      // Category filter
      const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter
      // Condition filter
      const matchesCondition = conditionFilter === 'all' || item.condition === conditionFilter
      
      return matchesSearch && matchesCategory && matchesCondition
    })
  }, [inventory, searchTerm, categoryFilter, conditionFilter])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    
    try {
      const inventoryData = {
        itemName: formData.itemName.trim(),
        category: formData.category,
        quantity: parseInt(formData.quantity) || 1,
        minQuantity: parseInt(formData.minQuantity) || 5,
        condition: formData.condition,
        location: formData.location.trim(),
        checkedBy: formData.checkedBy,
        notes: formData.notes.trim()
      }

      console.log('💾 Inventory - Saving item:', editingItem ? 'update' : 'create')

      if (editingItem) {
        await adminApi.updateInventory(editingItem._id, inventoryData)
        showToast.success('Inventory item updated successfully')
      } else {
        await adminApi.createInventory(inventoryData)
        showToast.success('Inventory item created successfully')
      }
      
      await fetchData()
      resetForm()
      setIsModalOpen(false)
    } catch (error) {
      console.error('❌ Inventory - Error saving item:', error)
      setError('Failed to save inventory item. Please try again.')
      showToast.error('Operation failed', error.data?.message || error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (itemId) => {
    if (window.confirm('Are you sure you want to delete this inventory item?')) {
      try {
        console.log('🗑️ Inventory - Deleting item:', itemId)
        await adminApi.deleteInventory(itemId)
        showToast.success('Inventory item deleted successfully')
        fetchData()
      } catch (error) {
        console.error('❌ Inventory - Error deleting item:', error)
        setError('Failed to delete inventory item. Please try again.')
        showToast.error('Failed to delete inventory item', error.data?.message || error.message)
      }
    }
  }

  const getConditionColor = (condition) => {
    switch (condition) {
      case 'Excellent': return 'bg-green-100 text-green-800'
      case 'Good': return 'bg-blue-100 text-blue-800'
      case 'Fair': return 'bg-yellow-100 text-yellow-800'
      case 'Poor': return 'bg-orange-100 text-orange-800'
      case 'Needs Replacement': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getQuantityStatus = (quantity, minQuantity) => {
    if (quantity <= 0) return { color: 'text-red-600', text: 'Out of Stock', icon: '❌', variant: 'error' }
    if (quantity < minQuantity) return { color: 'text-yellow-600', text: 'Low Stock', icon: '⚠️', variant: 'warning' }
    return { color: 'text-green-600', text: 'In Stock', icon: '✅', variant: 'success' }
  }

  const resetForm = () => {
    setFormData({
      itemName: '',
      category: 'General',
      quantity: '',
      minQuantity: '5',
      condition: 'Good',
      location: '',
      checkedBy: '',
      notes: ''
    })
    setEditingItem(null)
  }

  const openCreateModal = () => {
    console.log('➕ Inventory - Opening create modal')
    resetForm()
    setIsModalOpen(true)
  }

  // Calculate stats safely
  const totalItems = inventory.length || 0
  const lowStockItems = Array.isArray(inventory)
    ? inventory.filter(item => item.quantity < item.minQuantity)
    : []
  const outOfStockItems = Array.isArray(inventory)
    ? inventory.filter(item => item.quantity <= 0)
    : []
  const excellentCondition = Array.isArray(inventory)
    ? inventory.filter(item => item.condition === 'Excellent').length
    : 0

  // Display inventory - filtered if search/filters are active
  const displayInventory = filteredInventory

  return (
    <div className="p-6">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center space-y-4 lg:space-y-0 mb-6">
        <div className="text-center lg:text-left">
          <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
          <p className="text-gray-600">
            {searchTerm ? (
              <span>
                Showing {filteredInventory.length} of {inventory.length} items
                {searchTerm && ` for "${searchTerm}"`}
              </span>
            ) : (
              'Track and manage school assets and supplies'
            )}
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={fetchData}
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
          <Button
            variant="secondary"
            className="flex items-center gap-2"
            onClick={() => showToast.info('Export feature coming soon')}
          >
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Button
            onClick={openCreateModal}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Item
          </Button>
        </div>
      </div>

      {/* Search Status */}
      {(searchTerm || categoryFilter !== 'all' || conditionFilter !== 'all') && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Search className="w-5 h-5 text-blue-600" />
              <span className="text-blue-700">
                {searchTerm && `Searching for: "${searchTerm}" • `}
                Showing {filteredInventory.length} of {inventory.length} items
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

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-3">
              <Package className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Items</p>
              <p className="text-2xl font-bold">{totalItems}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg p-3">
              <AlertCircle className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Low Stock</p>
              <p className="text-2xl font-bold">{lowStockItems.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg p-3">
              <AlertCircle className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Out of Stock</p>
              <p className="text-2xl font-bold">{outOfStockItems.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-3">
              <CheckCircle className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Excellent Condition</p>
              <p className="text-2xl font-bold">{excellentCondition}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search items by name, location, or notes..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Condition
            </label>
            <select
              value={conditionFilter}
              onChange={(e) => setConditionFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Conditions</option>
              {conditions.map(cond => (
                <option key={cond} value={cond}>{cond}</option>
              ))}
            </select>
          </div>
          <Button
            variant="secondary"
            onClick={() => {
              setSearchTerm('')
              setCategoryFilter('all')
              setConditionFilter('all')
            }}
            className="w-full mt-6"
          >
            Clear Filters
          </Button>
        </div>
      </Card>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-yellow-400" />
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>Alert:</strong> {lowStockItems.length} item{lowStockItems.length !== 1 ? 's' : ''} are below minimum stock levels.
                {outOfStockItems.length > 0 && ` ${outOfStockItems.length} item${outOfStockItems.length !== 1 ? 's are' : ' is'} out of stock.`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Inventory Grid */}
      <Card>
        {loading ? (
          <div className="py-12 text-center">
            <Loader size="lg" />
            <p className="mt-4 text-gray-600">Loading inventory...</p>
          </div>
        ) : !Array.isArray(displayInventory) || displayInventory.length === 0 ? (
          <div className="py-12 text-center">
            <div className="mx-auto w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <Package className="w-12 h-12 text-gray-400" />
            </div>
            <p className="text-gray-500 text-lg mb-2">
              {searchTerm || categoryFilter !== 'all' || conditionFilter !== 'all' ? 'No items found' : 'No inventory items yet'}
            </p>
            <p className="text-gray-400 mb-6">
              {searchTerm || categoryFilter !== 'all' || conditionFilter !== 'all'
                ? 'No items match your filters. Try adjusting your search criteria.'
                : 'Get started by adding your first inventory item'
              }
            </p>
            {!(searchTerm || categoryFilter !== 'all' || conditionFilter !== 'all') && (
              <Button
                onClick={openCreateModal}
                className="flex items-center gap-2 mx-auto"
              >
                <Plus className="w-4 h-4" />
                Add First Item
              </Button>
            )}
            {(searchTerm || categoryFilter !== 'all' || conditionFilter !== 'all') && (
              <Button
                variant="link"
                onClick={() => {
                  setSearchTerm('')
                  setCategoryFilter('all')
                  setConditionFilter('all')
                }}
                className="mt-4"
              >
                Clear filters
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayInventory.map((item) => {
              const quantityStatus = getQuantityStatus(item.quantity, item.minQuantity)
              const lastChecked = item.lastChecked 
                ? new Date(item.lastChecked).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })
                : 'Never'
              const checkedBy = item.checkedBy 
                ? `${item.checkedBy.firstName || ''} ${item.checkedBy.lastName || ''}`.trim()
                : 'Not checked'
              
              return (
                <div key={item._id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <Package className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 truncate">{item.itemName}</h3>
                          <Badge 
                            variant={quantityStatus.variant}
                            className="text-xs"
                          >
                            {quantityStatus.icon} {quantityStatus.text}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-1 flex-shrink-0 ml-2">
                      <button 
                        onClick={() => {
                          setEditingItem(item)
                          setFormData({
                            itemName: item.itemName || '',
                            category: item.category || 'General',
                            quantity: item.quantity?.toString() || '',
                            minQuantity: item.minQuantity?.toString() || '5',
                            condition: item.condition || 'Good',
                            location: item.location || '',
                            checkedBy: item.checkedBy?._id || '',
                            notes: item.notes || ''
                          })
                          setIsModalOpen(true)
                        }} 
                        className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(item._id)} 
                        className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Quantity:</span>
                      <span className={quantityStatus.color}>
                        {item.quantity} / {item.minQuantity}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Category:</span>
                      <Badge variant="info">
                        {item.category}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Condition:</span>
                      <Badge 
                        className={getConditionColor(item.condition)}
                      >
                        {item.condition}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span><strong>Location:</strong> {item.location || 'Not specified'}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span><strong>Last Checked:</strong> {lastChecked} by {checkedBy}</span>
                    </div>
                    
                    {item.notes && (
                      <div className="pt-2 border-t">
                        <span className="font-medium text-gray-700">Notes:</span>
                        <div className="mt-1 text-xs text-gray-500 line-clamp-2">
                          {item.notes}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {item.createdAt && (
                    <div className="mt-4 pt-3 border-t text-xs text-gray-500">
                      Added: {new Date(item.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </Card>

      {/* Add/Edit Modal - FIXED with closeOnBackdropClick={false} */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingItem(null)
          resetForm()
        }}
        closeOnBackdropClick={false}
        title={editingItem ? 'Edit Inventory Item' : 'Add New Inventory Item'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Item Name *"
              required
              placeholder="e.g., Projector, Football, Microscope"
              value={formData.itemName}
              onChange={(e) => setFormData({...formData, itemName: e.target.value})}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category *
              </label>
              <select
                required
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Quantity *"
              type="number"
              required
              min="0"
              value={formData.quantity}
              onChange={(e) => setFormData({...formData, quantity: e.target.value})}
            />
            <Input
              label="Minimum Quantity *"
              type="number"
              required
              min="1"
              value={formData.minQuantity}
              onChange={(e) => setFormData({...formData, minQuantity: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Condition *
              </label>
              <select
                required
                value={formData.condition}
                onChange={(e) => setFormData({...formData, condition: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {conditions.map(cond => (
                  <option key={cond} value={cond}>{cond}</option>
                ))}
              </select>
            </div>
            <Input
              label="Location *"
              required
              placeholder="e.g., Room 101, Storage A, Lab 3"
              value={formData.location}
              onChange={(e) => setFormData({...formData, location: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Checked By
            </label>
            <select
              value={formData.checkedBy}
              onChange={(e) => setFormData({...formData, checkedBy: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select staff member</option>
              {staff.map(staffMember => (
                <option key={staffMember._id} value={staffMember._id}>
                  {staffMember.user?.firstName || 'Unknown'} {staffMember.user?.lastName || ''}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Notes
            </label>
            <textarea
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Additional notes, serial numbers, or specifications..."
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
            />
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <Button
              variant="secondary"
              type="button"
              onClick={() => {
                setIsModalOpen(false)
                setEditingItem(null)
                resetForm()
              }}
            >
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              {editingItem ? 'Update Item' : 'Add Item'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default Inventory
import { useState, useEffect } from 'react'
import { Search, Plus, Package, CheckCircle, AlertCircle, Edit, Trash2, RefreshCw, Download } from 'lucide-react'
import { Button, Modal, Input, Select, Table, Card, showToast, Loader } from '@shared'
import { adminApi } from '../services/adminApi'

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
      const [inventoryRes, staffRes] = await Promise.all([
        adminApi.getInventory(),
        adminApi.getStaff()
      ])
      setInventory(inventoryRes.data || inventoryRes || [])
      setStaff(staffRes.data || staffRes || [])
    } catch (error) {
      showToast.error('Failed to load data', error.data?.message || error.message)
    } finally {
      setLoading(false)
    }
  }

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

      if (editingItem) {
        await adminApi.updateInventory(editingItem._id, inventoryData)
        showToast.success('Inventory item updated successfully')
      } else {
        await adminApi.createInventory(inventoryData)
        showToast.success('Inventory item created successfully')
      }
      
      setIsModalOpen(false)
      setEditingItem(null)
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
      fetchData()
    } catch (error) {
      showToast.error('Operation failed', error.data?.message || error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (itemId) => {
    if (window.confirm('Are you sure you want to delete this inventory item?')) {
      try {
        await adminApi.deleteInventory(itemId)
        showToast.success('Inventory item deleted successfully')
        fetchData()
      } catch (error) {
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
    if (quantity <= 0) return { color: 'text-red-600', text: 'Out of Stock', icon: '❌' }
    if (quantity < minQuantity) return { color: 'text-yellow-600', text: 'Low Stock', icon: '⚠️' }
    return { color: 'text-green-600', text: 'In Stock', icon: '✅' }
  }

  const columns = [
    {
      key: 'itemName',
      title: 'Item',
      render: (name, item) => {
        const status = getQuantityStatus(item.quantity, item.minQuantity)
        return (
          <div className="flex items-center">
            <div className={`rounded-lg p-2 mr-3 ${status.color.replace('text-', 'bg-').replace('-600', '-100')}`}>
              <Package className="h-5 w-5" />
            </div>
            <div>
              <div className="font-medium text-gray-900">{name}</div>
              <div className={`text-sm ${status.color} flex items-center`}>
                <span className="mr-1">{status.icon}</span>
                {status.text}
              </div>
            </div>
          </div>
        )
      }
    },
    {
      key: 'category',
      title: 'Category',
      render: (category) => (
        <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
          {category}
        </span>
      )
    },
    {
      key: 'quantity',
      title: 'Quantity',
      render: (quantity, item) => {
        const isLow = quantity < item.minQuantity
        return (
          <div className={isLow ? 'text-yellow-600' : 'text-gray-900'}>
            <div className="font-bold">{quantity}</div>
            <div className="text-xs">Min: {item.minQuantity}</div>
          </div>
        )
      }
    },
    {
      key: 'condition',
      title: 'Condition',
      render: (condition) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getConditionColor(condition)}`}>
          {condition}
        </span>
      )
    },
    {
      key: 'location',
      title: 'Location',
      render: (location) => (
        <div className="text-gray-900">{location}</div>
      )
    },
    {
      key: 'lastChecked',
      title: 'Last Checked',
      render: (date) => (
        <div className="text-sm text-gray-500">
          {date ? new Date(date).toLocaleDateString() : 'Never'}
        </div>
      )
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (_, item) => (
        <div className="flex gap-2">
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
            className="p-1 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded"
            title="Edit"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(item._id)}
            className="p-1 text-red-600 hover:text-red-900 hover:bg-red-50 rounded"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ]

  const filteredItems = inventory.filter(item => {
    if (!searchTerm && categoryFilter === 'all' && conditionFilter === 'all') return true
    
    const searchLower = searchTerm.toLowerCase()
    const matchesSearch = searchTerm ? (
      item.itemName?.toLowerCase().includes(searchLower) ||
      item.location?.toLowerCase().includes(searchLower)
    ) : true
    
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter
    const matchesCondition = conditionFilter === 'all' || item.condition === conditionFilter
    
    return matchesSearch && matchesCategory && matchesCondition
  })

  const lowStockItems = inventory.filter(item => item.quantity < item.minQuantity)
  const outOfStockItems = inventory.filter(item => item.quantity <= 0)
  const excellentCondition = inventory.filter(item => item.condition === 'Excellent').length
  const needsReplacement = inventory.filter(item => item.condition === 'Needs Replacement').length

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
          <p className="text-gray-600">Track and manage school assets and supplies</p>
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
            onClick={() => {
              setEditingItem(null)
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
              setIsModalOpen(true)
            }}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Item
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-3">
              <Package className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Items</p>
              <p className="text-2xl font-bold">{inventory.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
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
        <Card className="p-4">
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
        <Card className="p-4">
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
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search items..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <Select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All Categories' },
              ...categories.map(cat => ({ value: cat, label: cat }))
            ]}
          />
          <Select
            value={conditionFilter}
            onChange={(e) => setConditionFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All Conditions' },
              ...conditions.map(cond => ({ value: cond, label: cond }))
            ]}
          />
          <Button
            variant="secondary"
            onClick={() => {
              setSearchTerm('')
              setCategoryFilter('all')
              setConditionFilter('all')
            }}
            className="w-full"
          >
            Clear Filters
          </Button>
        </div>
      </Card>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
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

      {/* Inventory Table */}
      <Card>
        {loading ? (
          <div className="py-12 text-center">
            <Loader size="lg" />
            <p className="mt-4 text-gray-600">Loading inventory...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-12 text-center">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No inventory items found</p>
            {(searchTerm || categoryFilter !== 'all' || conditionFilter !== 'all') ? (
              <Button
                variant="link"
                onClick={() => {
                  setSearchTerm('')
                  setCategoryFilter('all')
                  setConditionFilter('all')
                }}
                className="mt-2"
              >
                Clear filters
              </Button>
            ) : (
              <Button
                onClick={() => {
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
                  setIsModalOpen(true)
                }}
                className="mt-4"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add First Item
              </Button>
            )}
          </div>
        ) : (
          <Table
            columns={columns}
            data={filteredItems}
            keyField="_id"
            emptyMessage="No items match your search"
          />
        )}
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingItem(null)
        }}
        title={editingItem ? 'Edit Inventory Item' : 'Add New Inventory Item'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Item Name"
              required
              placeholder="e.g., Projector, Football, Microscope"
              value={formData.itemName}
              onChange={(e) => setFormData({...formData, itemName: e.target.value})}
            />
            <Select
              label="Category"
              required
              options={categories.map(cat => ({ value: cat, label: cat }))}
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Quantity"
              type="number"
              required
              min="0"
              value={formData.quantity}
              onChange={(e) => setFormData({...formData, quantity: e.target.value})}
            />
            <Input
              label="Minimum Quantity"
              type="number"
              required
              min="1"
              value={formData.minQuantity}
              onChange={(e) => setFormData({...formData, minQuantity: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Condition"
              required
              options={conditions.map(cond => ({ value: cond, label: cond }))}
              value={formData.condition}
              onChange={(e) => setFormData({...formData, condition: e.target.value})}
            />
            <Input
              label="Location"
              required
              placeholder="e.g., Room 101, Storage A, Lab 3"
              value={formData.location}
              onChange={(e) => setFormData({...formData, location: e.target.value})}
            />
          </div>

          <Select
            label="Checked By"
            options={[
              { value: '', label: 'Select staff member' },
              ...staff.map(staffMember => ({
                value: staffMember._id,
                label: `${staffMember.user?.firstName} ${staffMember.user?.lastName}`
              }))
            ]}
            value={formData.checkedBy}
            onChange={(e) => setFormData({...formData, checkedBy: e.target.value})}
          />

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
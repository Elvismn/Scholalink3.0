import React, { useState, useEffect, useMemo } from 'react'
import { Search, Plus, FileText, Car, Calendar, AlertTriangle, CheckCircle, Edit, Trash2, RefreshCw, Download, Clock, XCircle, Eye, File } from 'lucide-react'
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

const VehicleDocuments = () => {
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [error, setError] = useState('')
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [viewModalOpen, setViewModalOpen] = useState(false)
  
  // Document states
  const [editingDocument, setEditingDocument] = useState(null)
  const [selectedDocument, setSelectedDocument] = useState(null)
  
  const [vehicles, setVehicles] = useState([])
  const [formData, setFormData] = useState({
    vehicle: '',
    documentType: 'insurance',
    title: '',
    documentNumber: '',
    issueDate: new Date().toISOString().split('T')[0],
    expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    provider: '',
    premium: '',
    status: 'active',
    renewalReminder: true,
    reminderDays: '30'
  })

  const documentTypes = [
    { value: 'insurance', label: 'Insurance' },
    { value: 'inspection_certificate', label: 'Inspection Certificate' },
    { value: 'registration', label: 'Registration' },
    { value: 'fitness_certificate', label: 'Fitness Certificate' },
    { value: 'road_license', label: 'Road License' },
    { value: 'emission_test', label: 'Emission Test' },
    { value: 'purchase_documents', label: 'Purchase Documents' },
    { value: 'warranty', label: 'Warranty' },
    { value: 'service_manual', label: 'Service Manual' },
    { value: 'other', label: 'Other' }
  ]

  const statuses = [
    { value: 'active', label: 'Active' },
    { value: 'expired', label: 'Expired' },
    { value: 'renewed', label: 'Renewed' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'pending', label: 'Pending' }
  ]

  useEffect(() => {
    fetchData()
  }, [])

  // Filter documents based on search term, type, and status
  const filteredDocuments = useMemo(() => {
    if (!Array.isArray(documents)) return []
    if (!searchTerm && typeFilter === 'all' && statusFilter === 'all') return documents
    
    const searchLower = searchTerm.toLowerCase()
    
    return documents.filter(doc => {
      if (!doc) return false
      
      // Search filter
      const matchesSearch = searchTerm ? (
        doc.title?.toLowerCase().includes(searchLower) ||
        doc.documentNumber?.toLowerCase().includes(searchLower) ||
        doc.provider?.toLowerCase().includes(searchLower) ||
        (doc.vehicle?.plateNumber?.toLowerCase().includes(searchLower)) ||
        (doc.vehicle?.make?.toLowerCase().includes(searchLower)) ||
        (doc.vehicle?.model?.toLowerCase().includes(searchLower))
      ) : true
      
      // Type filter
      const matchesType = typeFilter === 'all' || doc.documentType === typeFilter
      // Status filter
      const matchesStatus = statusFilter === 'all' || doc.status === statusFilter
      
      return matchesSearch && matchesType && matchesStatus
    })
  }, [documents, searchTerm, typeFilter, statusFilter])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [docsRes, vehiclesRes] = await Promise.all([
        adminApi.getVehicleDocuments(),
        adminApi.getVehicles()
      ])
      
      console.log('Documents API Response:', docsRes)
      console.log('Vehicles API Response:', vehiclesRes)
      
      // Handle documents response - check if it's an object with data property
      let docsData = []
      if (docsRes) {
        if (Array.isArray(docsRes)) {
          docsData = docsRes
        } else if (docsRes.data && Array.isArray(docsRes.data)) {
          docsData = docsRes.data
        } else if (docsRes.documents && Array.isArray(docsRes.documents)) {
          docsData = docsRes.documents
        } else if (typeof docsRes === 'object') {
          // If it's an object, check for any array properties
          const arrayProps = Object.values(docsRes).filter(Array.isArray)
          if (arrayProps.length > 0) {
            docsData = arrayProps[0] // Use the first array found
          }
        }
      }
      setDocuments(docsData)
      
      // Handle vehicles response
      let vehiclesData = []
      if (vehiclesRes) {
        if (Array.isArray(vehiclesRes)) {
          vehiclesData = vehiclesRes
        } else if (vehiclesRes.data && Array.isArray(vehiclesRes.data)) {
          vehiclesData = vehiclesRes.data
        } else if (vehiclesRes.vehicles && Array.isArray(vehiclesRes.vehicles)) {
          vehiclesData = vehiclesRes.vehicles
        }
      }
      setVehicles(vehiclesData)
      
      setError('')
    } catch (error) {
      console.error('Error fetching data:', error)
      setError('Failed to load data. Please check your connection and try again.')
      showToast.error('Failed to load data', error.data?.message || error.message)
      setDocuments([])
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
      const documentData = {
        vehicle: formData.vehicle,
        documentType: formData.documentType,
        title: formData.title.trim(),
        documentNumber: formData.documentNumber.trim(),
        issueDate: formData.issueDate,
        expiryDate: formData.expiryDate,
        provider: formData.provider.trim(),
        premium: formData.premium ? parseFloat(formData.premium) : undefined,
        status: formData.status,
        renewalReminder: formData.renewalReminder,
        reminderDays: parseInt(formData.reminderDays) || 30
      }

      console.log('Saving document:', editingDocument ? 'update' : 'create')

      if (editingDocument) {
        await adminApi.updateVehicleDocument(editingDocument._id, documentData)
        showToast.success('Document updated successfully')
      } else {
        await adminApi.createVehicleDocument(documentData)
        showToast.success('Document created successfully')
      }
      
      await fetchData()
      resetFormData()
      setIsModalOpen(false)
    } catch (error) {
      console.error('Error saving document:', error)
      setError('Failed to save document. Please try again.')
      showToast.error('Operation failed', error.data?.message || error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const resetFormData = () => {
    setFormData({
      vehicle: '',
      documentType: 'insurance',
      title: '',
      documentNumber: '',
      issueDate: new Date().toISOString().split('T')[0],
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      provider: '',
      premium: '',
      status: 'active',
      renewalReminder: true,
      reminderDays: '30'
    })
    setEditingDocument(null)
  }

  const handleEdit = (document) => {
    console.log('Editing document:', document._id)
    setEditingDocument(document)
    setFormData({
      vehicle: document.vehicle?._id || document.vehicle || '',
      documentType: document.documentType || 'insurance',
      title: document.title || '',
      documentNumber: document.documentNumber || '',
      issueDate: document.issueDate ? new Date(document.issueDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      expiryDate: document.expiryDate ? new Date(document.expiryDate).toISOString().split('T')[0] : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      provider: document.provider || '',
      premium: document.premium?.toString() || '',
      status: document.status || 'active',
      renewalReminder: document.renewalReminder || true,
      reminderDays: document.reminderDays?.toString() || '30'
    })
    setIsModalOpen(true)
  }

  const handleView = (document) => {
    setSelectedDocument(document)
    setViewModalOpen(true)
  }

  const handleDelete = async (docId) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      try {
        await adminApi.deleteVehicleDocument(docId)
        showToast.success('Document deleted successfully')
        fetchData()
      } catch (error) {
        console.error('Error deleting document:', error)
        setError('Failed to delete document. Please try again.')
        showToast.error('Failed to delete document', error.data?.message || error.message)
      }
    }
  }

  const renewDocument = async (docId) => {
    try {
      const newExpiryDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      await adminApi.renewVehicleDocument(docId, { expiryDate: newExpiryDate })
      showToast.success('Document renewed successfully')
      fetchData()
    } catch (error) {
      console.error('Error renewing document:', error)
      setError('Failed to renew document. Please try again.')
      showToast.error('Failed to renew document', error.data?.message || error.message)
    }
  }

  const verifyDocument = async (docId) => {
    try {
      await adminApi.verifyVehicleDocument(docId)
      showToast.success('Document verified successfully')
      fetchData()
    } catch (error) {
      console.error('Error verifying document:', error)
      setError('Failed to verify document. Please try again.')
      showToast.error('Failed to verify document', error.data?.message || error.message)
    }
  }

  const calculateDaysUntilExpiry = (expiryDate) => {
    if (!expiryDate) return null
    const today = new Date()
    const expiry = new Date(expiryDate)
    const diffTime = expiry - today
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getExpiryStatus = (expiryDate) => {
    const days = calculateDaysUntilExpiry(expiryDate)
    if (days === null) return { status: 'No expiry', color: 'text-gray-600 bg-gray-50', variant: 'default' }
    if (days < 0) return { status: 'Expired', color: 'text-red-600 bg-red-50', variant: 'error' }
    if (days <= 7) return { status: 'Critical', color: 'text-red-600 bg-red-50', variant: 'error' }
    if (days <= 30) return { status: 'Warning', color: 'text-yellow-600 bg-yellow-50', variant: 'warning' }
    return { status: 'Valid', color: 'text-green-600 bg-green-50', variant: 'success' }
  }

  const getDocumentIcon = (type) => {
    switch (type) {
      case 'insurance': return '🛡️'
      case 'registration': return '📋'
      case 'fitness_certificate': return '✅'
      case 'inspection_certificate': return '🔍'
      case 'road_license': return '🚗'
      case 'emission_test': return '🌿'
      case 'warranty': return '📜'
      case 'service_manual': return '🔧'
      default: return '📄'
    }
  }

  const formatDocumentType = (type) => {
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

  // Calculate stats
  const totalDocuments = documents.length
  const activeDocuments = documents.filter(d => d.status === 'active').length
  const expiringSoon = documents.filter(doc => {
    const days = calculateDaysUntilExpiry(doc.expiryDate)
    return days > 0 && days <= 30
  }).length
  const expired = documents.filter(doc => {
    const days = calculateDaysUntilExpiry(doc.expiryDate)
    return days < 0
  }).length

  // Display documents - filtered if search is active
  const displayDocuments = filteredDocuments

  return (
    <div className="p-6">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center space-y-4 lg:space-y-0 mb-6">
        <div className="text-center lg:text-left">
          <h1 className="text-2xl font-bold text-gray-900">Vehicle Documents</h1>
          <p className="text-gray-600">
            {searchTerm ? (
              <span>
                Showing {filteredDocuments.length} of {documents.length} documents
                {searchTerm && ` for "${searchTerm}"`}
              </span>
            ) : (
              'Manage vehicle documents, renewals, and compliance'
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
            onClick={() => {
              setEditingDocument(null)
              resetFormData()
              setIsModalOpen(true)
            }}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Document
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
                Searching for: <strong>"{searchTerm}"</strong> - Found {filteredDocuments.length} results
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
              <FileText className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Documents</p>
              <p className="text-2xl font-bold">{totalDocuments}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-3">
              <CheckCircle className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Active</p>
              <p className="text-2xl font-bold">{activeDocuments}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg p-3">
              <Clock className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Expiring Soon</p>
              <p className="text-2xl font-bold">{expiringSoon}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg p-3">
              <AlertTriangle className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Expired</p>
              <p className="text-2xl font-bold">{expired}</p>
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
                placeholder="Search documents by title, number, provider, or vehicle..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          {/* Type Filter */}
          <div className="w-full md:w-48">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              {documentTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>
          {/* Status Filter */}
          <div className="w-full md:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              {statuses.map(status => (
                <option key={status.value} value={status.value}>{status.label}</option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Documents Grid */}
      <Card>
        {loading ? (
          <div className="py-12 text-center">
            <Loader size="lg" />
            <p className="mt-4 text-gray-600">Loading documents...</p>
          </div>
        ) : !Array.isArray(displayDocuments) || displayDocuments.length === 0 ? (
          <div className="py-12 text-center">
            <div className="mx-auto w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <FileText className="w-12 h-12 text-gray-400" />
            </div>
            <p className="text-gray-500 text-lg mb-2">
              {searchTerm ? 'No documents found' : 'No documents yet'}
            </p>
            <p className="text-gray-400 mb-6">
              {searchTerm 
                ? `No documents found for "${searchTerm}". Try a different search term.`
                : 'Get started by adding your first document'
              }
            </p>
            {!searchTerm && (
              <Button
                onClick={() => {
                  setEditingDocument(null)
                  resetFormData()
                  setIsModalOpen(true)
                }}
                className="flex items-center gap-2 mx-auto"
              >
                <Plus className="w-4 h-4" />
                Add Your First Document
              </Button>
            )}
            {(searchTerm || typeFilter !== 'all' || statusFilter !== 'all') && (
              <Button
                variant="link"
                onClick={() => {
                  setSearchTerm('')
                  setTypeFilter('all')
                  setStatusFilter('all')
                }}
                className="mt-4"
              >
                Clear filters
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayDocuments.map((doc) => {
              const expiryStatus = getExpiryStatus(doc.expiryDate)
              const vehicleInfo = doc.vehicle || {}
              
              return (
                <div key={doc._id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-xl">{getDocumentIcon(doc.documentType)}</span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 truncate">
                            {doc.title}
                          </h3>
                          <p className="text-sm text-gray-600 truncate">
                            {doc.documentNumber} • {formatDocumentType(doc.documentType)}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-1 flex-shrink-0 ml-2">
                      <button 
                        onClick={() => handleView(doc)} 
                        className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                        title="View"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleEdit(doc)} 
                        className="p-1 text-green-600 hover:text-green-800 hover:bg-green-50 rounded"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(doc._id)} 
                        className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm text-gray-600">
                    {/* Vehicle Info */}
                    {vehicleInfo.plateNumber && (
                      <div className="flex items-center gap-2">
                        <Car className="w-4 h-4 text-gray-400" />
                        <span>
                          <strong>Vehicle:</strong> {vehicleInfo.plateNumber} • {vehicleInfo.make} {vehicleInfo.model}
                        </span>
                      </div>
                    )}
                    
                    {/* Provider */}
                    {doc.provider && (
                      <div className="flex items-center gap-2">
                        <span><strong>Provider:</strong> {doc.provider}</span>
                      </div>
                    )}
                    
                    {/* Dates */}
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span><strong>Issue:</strong> {formatDate(doc.issueDate)}</span>
                    </div>
                    
                    {/* Expiry Status */}
                    <div className="flex items-center gap-2">
                      <span><strong>Expiry:</strong> {formatDate(doc.expiryDate)}</span>
                      <Badge 
                        variant={expiryStatus.variant}
                        className="text-xs"
                      >
                        {expiryStatus.status}
                      </Badge>
                    </div>
                    
                    {/* Premium */}
                    {doc.premium && (
                      <div className="flex items-center gap-2">
                        <span><strong>Premium:</strong> {formatCurrency(doc.premium)}</span>
                      </div>
                    )}
                    
                    {/* Status */}
                    <div className="flex items-center gap-2">
                      <span><strong>Status:</strong></span>
                      <Badge 
                        variant={doc.status === 'active' ? 'success' : 
                                doc.status === 'expired' ? 'error' : 
                                doc.status === 'pending' ? 'warning' : 'default'}
                        className="text-xs"
                      >
                        {doc.status ? doc.status.charAt(0).toUpperCase() + doc.status.slice(1) : 'Unknown'}
                      </Badge>
                    </div>
                  </div>
                  
                  {/* Document Actions */}
                  <div className="mt-4 pt-3 border-t">
                    <div className="flex justify-between items-center">
                      <div className="text-xs text-gray-500">
                        {doc.createdAt && `Added: ${formatDate(doc.createdAt)}`}
                      </div>
                      <div className="flex space-x-1">
                        {doc.status !== 'expired' && (
                          <button
                            onClick={() => renewDocument(doc._id)}
                            className="text-xs text-green-600 hover:text-green-800 hover:bg-green-50 px-2 py-1 rounded"
                            title="Renew"
                          >
                            Renew
                          </button>
                        )}
                        {!doc.verified && (
                          <button
                            onClick={() => verifyDocument(doc._id)}
                            className="text-xs text-purple-600 hover:text-purple-800 hover:bg-purple-50 px-2 py-1 rounded"
                            title="Verify"
                          >
                            Verify
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      {/* Alerts Section */}
      {expiringSoon > 0 && (
        <Card className="bg-yellow-50 border-yellow-200">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mr-3" />
            <div>
              <p className="font-medium text-yellow-800">
                {expiringSoon} document{expiringSoon !== 1 ? 's' : ''} expiring within 30 days
              </p>
              <p className="text-sm text-yellow-700">
                Please review and renew these documents before they expire.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Create/Edit Document Modal - FIXED with closeOnBackdropClick={false} */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingDocument(null)
          resetFormData()
        }}
        closeOnBackdropClick={false}
        title={editingDocument ? 'Edit Document' : 'Add New Document'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Vehicle Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Vehicle *
            </label>
            <select
              name="vehicle"
              required
              value={formData.vehicle}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select vehicle</option>
              {vehicles.map(vehicle => (
                <option key={vehicle._id} value={vehicle._id}>
                  {vehicle.plateNumber} - {vehicle.make} {vehicle.model}
                </option>
              ))}
            </select>
          </div>

          {/* Document Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Document Type *
            </label>
            <select
              name="documentType"
              required
              value={formData.documentType}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {documentTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Document Title *"
              name="title"
              required
              value={formData.title}
              onChange={handleInputChange}
              placeholder="e.g., Annual Insurance Policy"
            />
            <Input
              label="Document Number *"
              name="documentNumber"
              required
              value={formData.documentNumber}
              onChange={handleInputChange}
              placeholder="e.g., INS-2024-001"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Issue Date *"
              name="issueDate"
              type="date"
              required
              value={formData.issueDate}
              onChange={handleInputChange}
            />
            <Input
              label="Expiry Date *"
              name="expiryDate"
              type="date"
              required
              value={formData.expiryDate}
              onChange={handleInputChange}
            />
          </div>

          <Input
            label="Provider"
            name="provider"
            value={formData.provider}
            onChange={handleInputChange}
            placeholder="e.g., ABC Insurance Company"
          />

          <Input
            label="Premium (if applicable)"
            name="premium"
            type="number"
            min="0"
            step="0.01"
            value={formData.premium}
            onChange={handleInputChange}
            placeholder="e.g., 1500.00"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {statuses.map(status => (
                  <option key={status.value} value={status.value}>{status.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Renewal Reminder
              </label>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="renewalReminder"
                  checked={formData.renewalReminder}
                  onChange={(e) => setFormData(prev => ({ ...prev, renewalReminder: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Send renewal reminders
                </span>
              </div>
            </div>
          </div>

          <Input
            label="Reminder Days Before Expiry"
            name="reminderDays"
            type="number"
            min="1"
            max="365"
            value={formData.reminderDays}
            onChange={handleInputChange}
            placeholder="e.g., 30"
          />

          <div className="pt-4 flex justify-end gap-3">
            <Button
              variant="secondary"
              type="button"
              onClick={() => {
                setIsModalOpen(false)
                setEditingDocument(null)
                resetFormData()
              }}
            >
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              {editingDocument ? 'Update Document' : 'Add Document'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* View Document Details Modal */}
      <Modal
        isOpen={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        title="Document Details"
        size="lg"
      >
        {selectedDocument && (
          (() => {
            const vehicleInfo = selectedDocument.vehicle || {}
            const expiryStatus = getExpiryStatus(selectedDocument.expiryDate)
            
            return (
              <div className="space-y-6">
                {/* Document Header */}
                <div className="flex items-center gap-4 pb-4 border-b">
                  <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-2xl">{getDocumentIcon(selectedDocument.documentType)}</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900">
                      {selectedDocument.title}
                    </h3>
                    <p className="text-gray-600">
                      {selectedDocument.documentNumber} • {formatDocumentType(selectedDocument.documentType)}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge 
                        variant={expiryStatus.variant}
                      >
                        {expiryStatus.status}
                      </Badge>
                      <Badge 
                        variant={selectedDocument.status === 'active' ? 'success' : 
                                selectedDocument.status === 'expired' ? 'error' : 
                                selectedDocument.status === 'pending' ? 'warning' : 'default'}
                      >
                        {selectedDocument.status ? selectedDocument.status.charAt(0).toUpperCase() + selectedDocument.status.slice(1) : 'Unknown'}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Document Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-2">Document Information</h4>
                      <div className="space-y-2">
                        <div>
                          <strong>Type:</strong> {formatDocumentType(selectedDocument.documentType)}
                        </div>
                        <div>
                          <strong>Number:</strong> {selectedDocument.documentNumber}
                        </div>
                        <div>
                          <strong>Title:</strong> {selectedDocument.title}
                        </div>
                        <div>
                          <strong>Provider:</strong> {selectedDocument.provider || 'N/A'}
                        </div>
                        <div>
                          <strong>Premium:</strong> {formatCurrency(selectedDocument.premium)}
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-2">Validity Period</h4>
                      <div className="space-y-2">
                        <div>
                          <strong>Issue Date:</strong> {formatDate(selectedDocument.issueDate)}
                        </div>
                        <div>
                          <strong>Expiry Date:</strong> {formatDate(selectedDocument.expiryDate)}
                        </div>
                        <div>
                          <strong>Days Until Expiry:</strong> {calculateDaysUntilExpiry(selectedDocument.expiryDate) || 'N/A'}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-2">Vehicle Information</h4>
                      <div className="space-y-2">
                        {vehicleInfo.plateNumber && (
                          <>
                            <div>
                              <strong>Plate Number:</strong> {vehicleInfo.plateNumber}
                            </div>
                            <div>
                              <strong>Make & Model:</strong> {vehicleInfo.make} {vehicleInfo.model}
                            </div>
                            {vehicleInfo.year && (
                              <div>
                                <strong>Year:</strong> {vehicleInfo.year}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-2">Additional Information</h4>
                      <div className="space-y-2">
                        <div>
                          <strong>Renewal Reminder:</strong> {selectedDocument.renewalReminder ? 'Enabled' : 'Disabled'}
                        </div>
                        {selectedDocument.renewalReminder && (
                          <div>
                            <strong>Reminder Days:</strong> {selectedDocument.reminderDays || 30} days before expiry
                          </div>
                        )}
                        <div>
                          <strong>Verified:</strong> {selectedDocument.verified ? 'Yes' : 'No'}
                        </div>
                      </div>
                    </div>

                    {selectedDocument.createdAt && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-2">Record Details</h4>
                        <div className="space-y-2">
                          <div>
                            <strong>Created:</strong> {formatDate(selectedDocument.createdAt)}
                          </div>
                          {selectedDocument.updatedAt && selectedDocument.updatedAt !== selectedDocument.createdAt && (
                            <div>
                              <strong>Last Updated:</strong> {formatDate(selectedDocument.updatedAt)}
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
                      handleEdit(selectedDocument)
                    }}
                  >
                    Edit Document
                  </Button>
                </div>
              </div>
            )
          })()
        )}
      </Modal>
    </div>
  )
}

export default VehicleDocuments
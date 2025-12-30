import { useState, useEffect } from 'react'
import { Search, Plus, Users, Calendar, Trophy, Edit, Trash2, RefreshCw } from 'lucide-react'
import { Button, Modal, Input, Select, Table, Card, showToast, Loader } from '@shared'
import { adminApi } from '../services/adminApi'

const Clubs = () => {
  const [clubs, setClubs] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingClub, setEditingClub] = useState(null)
  const [staff, setStaff] = useState([])
  const [formData, setFormData] = useState({
    name: '',
    patron: '',
    description: '',
    meetingSchedule: {
      day: '',
      time: '',
      location: ''
    }
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      console.log('🔍 Clubs - Fetching data...')
      const [clubsRes, staffRes] = await Promise.all([
        adminApi.getClubs(),
        adminApi.getStaff()
      ])
      
      // Handle clubs response - FIXED: Backend returns data.clubs
      let clubsData = []
      if (clubsRes && clubsRes.data) {
        if (Array.isArray(clubsRes.data.clubs)) {
          clubsData = clubsRes.data.clubs
        } else if (Array.isArray(clubsRes.data)) {
          clubsData = clubsRes.data
        }
      }
      setClubs(clubsData || [])
      
      // Handle staff response
      let staffData = []
      if (staffRes && staffRes.data) {
        if (Array.isArray(staffRes.data)) {
          staffData = staffRes.data
        } else if (Array.isArray(staffRes)) {
          staffData = staffRes
        }
      }
      setStaff(staffData || [])
      
      console.log('✅ Clubs - Data received:', clubsData.length, 'clubs')
    } catch (error) {
      console.error('❌ Clubs - Error fetching data:', error)
      showToast.error('Failed to load data', error.data?.message || error.message)
      setClubs([])
      setStaff([])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    
    try {
      const clubData = {
        name: formData.name.trim(),
        patron: formData.patron,
        description: formData.description.trim(),
        meetingSchedule: {
          day: formData.meetingSchedule.day.trim(),
          time: formData.meetingSchedule.time.trim(),
          location: formData.meetingSchedule.location.trim()
        }
      }

      console.log('💾 Clubs - Saving club:', editingClub ? 'update' : 'create')
      console.log('📋 Club data:', clubData)

      if (editingClub) {
        await adminApi.updateClub(editingClub._id, clubData)
        showToast.success('Club updated successfully')
      } else {
        await adminApi.createClub(clubData)
        showToast.success('Club created successfully')
      }
      
      setIsModalOpen(false)
      resetForm()
      fetchData()
    } catch (error) {
      console.error('❌ Clubs - Error saving club:', error)
      showToast.error('Operation failed', error.data?.message || error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (clubId) => {
    if (window.confirm('Are you sure you want to delete this club?')) {
      try {
        console.log('🗑️ Clubs - Deleting club:', clubId)
        await adminApi.deleteClub(clubId)
        showToast.success('Club deleted successfully')
        fetchData()
      } catch (error) {
        console.error('❌ Clubs - Error deleting club:', error)
        showToast.error('Failed to delete club', error.data?.message || error.message)
      }
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      patron: '',
      description: '',
      meetingSchedule: {
        day: '',
        time: '',
        location: ''
      }
    })
    setEditingClub(null)
  }

  const columns = [
    {
      key: 'name',
      title: 'Club',
      render: (name, club) => (
        <div className="flex items-center">
          <div className="bg-blue-100 rounded-lg p-2 mr-3">
            <Trophy className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <div className="font-medium text-gray-900">{name}</div>
            <div className="text-sm text-gray-500 truncate max-w-xs">
              {club.description || 'No description'}
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'patron',
      title: 'Patron',
      render: (patron) => (
        <div>
          <div className="font-medium text-gray-900">
            {patron?.firstName || ''} {patron?.lastName || ''}
          </div>
          <div className="text-sm text-gray-500">{patron?.position || 'No position'}</div>
        </div>
      )
    },
    {
      key: 'members',
      title: 'Members',
      render: (members) => (
        <div className="flex items-center">
          <Users className="w-4 h-4 text-gray-400 mr-1" />
          <span className="font-medium">{members?.length || 0}</span>
        </div>
      )
    },
    {
      key: 'meetingSchedule',
      title: 'Meeting Schedule',
      render: (schedule) => (
        <div className="text-sm">
          <div className="flex items-center">
            <Calendar className="w-3 h-3 text-gray-400 mr-1" />
            <span className="text-gray-900">{schedule?.day || 'Not set'}</span>
          </div>
          <div className="text-gray-600 mt-1">
            {schedule?.time} {schedule?.location && `at ${schedule.location}`}
          </div>
        </div>
      )
    },
    {
      key: 'activities',
      title: 'Activities',
      render: (activities) => (
        <div className="text-gray-900">{activities?.length || 0}</div>
      )
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (_, club) => (
        <div className="flex gap-2">
          <button
            onClick={() => {
              setEditingClub(club)
              setFormData({
                name: club.name || '',
                patron: club.patron?._id || '',
                description: club.description || '',
                meetingSchedule: {
                  day: club.meetingSchedule?.day || '',
                  time: club.meetingSchedule?.time || '',
                  location: club.meetingSchedule?.location || ''
                }
              })
              setIsModalOpen(true)
            }}
            className="p-1 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded"
            title="Edit"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(club._id)}
            className="p-1 text-red-600 hover:text-red-900 hover:bg-red-50 rounded"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clubs & Societies</h1>
          <p className="text-gray-600">Manage student clubs and extracurricular activities</p>
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
              resetForm()
              setIsModalOpen(true)
            }}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Club
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-3">
              <Trophy className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Clubs</p>
              <p className="text-2xl font-bold">{clubs.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center">
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-3">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Members</p>
              <p className="text-2xl font-bold">
                {clubs.reduce((total, club) => total + (club.members?.length || 0), 0)}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center">
            <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg p-3">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Patrons</p>
              <p className="text-2xl font-bold">
                {[...new Set(clubs.map(c => c.patron?._id).filter(Boolean))].length}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center">
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-3">
              <Calendar className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Activities</p>
              <p className="text-2xl font-bold">
                {clubs.reduce((total, club) => total + (club.activities?.length || 0), 0)}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search clubs by name or patron..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </Card>

      {/* Clubs Table */}
      <Card>
        {loading ? (
          <div className="py-12 text-center">
            <Loader size="lg" />
            <p className="mt-4 text-gray-600">Loading clubs...</p>
          </div>
        ) : clubs.length === 0 ? (
          <div className="py-12 text-center">
            <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No clubs found</p>
            <Button
              onClick={() => {
                resetForm()
                setIsModalOpen(true)
              }}
              className="mt-4"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create First Club
            </Button>
          </div>
        ) : (
          <Table
            columns={columns}
            data={clubs.filter(club => {
              if (!searchTerm) return true
              const searchLower = searchTerm.toLowerCase()
              const patronName = `${club.patron?.firstName || ''} ${club.patron?.lastName || ''}`.toLowerCase()
              
              return (
                club.name?.toLowerCase().includes(searchLower) ||
                patronName.includes(searchLower) ||
                club.description?.toLowerCase().includes(searchLower) ||
                club.meetingSchedule?.day?.toLowerCase().includes(searchLower) ||
                club.meetingSchedule?.location?.toLowerCase().includes(searchLower)
              )
            })}
            keyField="_id"
            emptyMessage="No clubs match your search"
          />
        )}
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          resetForm()
        }}
        title={editingClub ? 'Edit Club' : 'Add New Club'}
        size="lg"
        closeOnBackdropClick={false}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Club Name *"
            required
            placeholder="e.g., Science Club, Chess Club"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Club Patron *
            </label>
            <select
              required
              value={formData.patron}
              onChange={(e) => setFormData({...formData, patron: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select patron</option>
              {staff.map(staffMember => (
                <option key={staffMember._id} value={staffMember._id}>
                  {staffMember.firstName || ''} {staffMember.lastName || ''} - {staffMember.position || 'Staff'}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Club description, objectives, and activities..."
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Meeting Schedule</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Day"
                placeholder="e.g., Monday, Wednesday"
                value={formData.meetingSchedule.day}
                onChange={(e) => setFormData({
                  ...formData,
                  meetingSchedule: { ...formData.meetingSchedule, day: e.target.value }
                })}
              />
              <Input
                label="Time"
                placeholder="e.g., 3:00 PM - 4:30 PM"
                value={formData.meetingSchedule.time}
                onChange={(e) => setFormData({
                  ...formData,
                  meetingSchedule: { ...formData.meetingSchedule, time: e.target.value }
                })}
              />
              <Input
                label="Location"
                placeholder="e.g., Room 101, Library"
                value={formData.meetingSchedule.location}
                onChange={(e) => setFormData({
                  ...formData,
                  meetingSchedule: { ...formData.meetingSchedule, location: e.target.value }
                })}
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <Button
              variant="secondary"
              type="button"
              onClick={() => {
                setIsModalOpen(false)
                resetForm()
              }}
            >
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              {editingClub ? 'Update Club' : 'Add Club'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default Clubs
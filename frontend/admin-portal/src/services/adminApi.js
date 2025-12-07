import { API_ENDPOINTS } from '@shared/utils/apiService'

class AdminApi {
  constructor(baseURL) {
    this.baseURL = baseURL || (import.meta.env.VITE_API_URL || 'http://localhost:5000/api')
  }

  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    }

    const token = localStorage.getItem('token')
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    return headers
  }

  async request(endpoint, options = {}) {
    const { method = 'GET', data = null } = options
    
    const config = {
      method,
      headers: this.getHeaders(),
    }

    if (data) {
      config.body = JSON.stringify(data)
    }

    const url = `${this.baseURL}${endpoint}`
    
    console.log(`🔧 ADMIN API: ${method} ${url}`)

    try {
      const response = await fetch(url, config)
      const responseData = await response.json()

      if (!response.ok) {
        const error = new Error(responseData.error || responseData.message || `HTTP ${response.status}`)
        error.status = response.status
        error.data = responseData
        throw error
      }

      return responseData
    } catch (error) {
      console.error(`❌ ADMIN API Error: ${method} ${endpoint}`, error)
      throw error
    }
  }

  // Student CRUD
  async getStudents(params = {}) {
    const query = new URLSearchParams(params).toString()
    const endpoint = query ? `${API_ENDPOINTS.ADMIN.STUDENTS}?${query}` : API_ENDPOINTS.ADMIN.STUDENTS
    return this.request(endpoint)
  }

  async getStudent(id) {
    return this.request(API_ENDPOINTS.ADMIN.STUDENT_BY_ID(id))
  }

  async createStudent(data) {
    return this.request(API_ENDPOINTS.ADMIN.STUDENTS, {
      method: 'POST',
      data
    })
  }

  async updateStudent(id, data) {
    return this.request(API_ENDPOINTS.ADMIN.STUDENT_BY_ID(id), {
      method: 'PUT',
      data
    })
  }

  async deleteStudent(id) {
    return this.request(API_ENDPOINTS.ADMIN.STUDENT_BY_ID(id), {
      method: 'DELETE'
    })
  }

  // Vehicle CRUD
  async getVehicles(params = {}) {
    const query = new URLSearchParams(params).toString()
    const endpoint = query ? `${API_ENDPOINTS.ADMIN.VEHICLES}?${query}` : API_ENDPOINTS.ADMIN.VEHICLES
    return this.request(endpoint)
  }

  async getVehicle(id) {
    return this.request(API_ENDPOINTS.ADMIN.VEHICLE_BY_ID(id))
  }

  async createVehicle(data) {
    return this.request(API_ENDPOINTS.ADMIN.VEHICLES, {
      method: 'POST',
      data
    })
  }

  async updateVehicle(id, data) {
    return this.request(API_ENDPOINTS.ADMIN.VEHICLE_BY_ID(id), {
      method: 'PUT',
      data
    })
  }

  async deleteVehicle(id) {
    return this.request(API_ENDPOINTS.ADMIN.VEHICLE_BY_ID(id), {
      method: 'DELETE'
    })
  }

  // Parent CRUD
  async getParents(params = {}) {
    const query = new URLSearchParams(params).toString()
    const endpoint = query ? `${API_ENDPOINTS.ADMIN.PARENTS}?${query}` : API_ENDPOINTS.ADMIN.PARENTS
    return this.request(endpoint)
  }

  async getParent(id) {
    return this.request(API_ENDPOINTS.ADMIN.PARENT_BY_ID(id))
  }

  async createParent(data) {
    return this.request(API_ENDPOINTS.ADMIN.PARENTS, {
      method: 'POST',
      data
    })
  }

  async updateParent(id, data) {
    return this.request(API_ENDPOINTS.ADMIN.PARENT_BY_ID(id), {
      method: 'PUT',
      data
    })
  }

  async deleteParent(id) {
    return this.request(API_ENDPOINTS.ADMIN.PARENT_BY_ID(id), {
      method: 'DELETE'
    })
  }

  // Staff CRUD
  async getStaff(params = {}) {
    const query = new URLSearchParams(params).toString()
    const endpoint = query ? `${API_ENDPOINTS.ADMIN.STAFF}?${query}` : API_ENDPOINTS.ADMIN.STAFF
    return this.request(endpoint)
  }

  async getOneStaff(id) {
    return this.request(API_ENDPOINTS.ADMIN.STAFF_BY_ID(id))
  }

  async createStaff(data) {
    return this.request(API_ENDPOINTS.ADMIN.STAFF, {
      method: 'POST',
      data
    })
  }

  async updateStaff(id, data) {
    return this.request(API_ENDPOINTS.ADMIN.STAFF_BY_ID(id), {
      method: 'PUT',
      data
    })
  }

  async deleteStaff(id) {
    return this.request(API_ENDPOINTS.ADMIN.STAFF_BY_ID(id), {
      method: 'DELETE'
    })
  }

  // Classroom CRUD
  async getClassrooms(params = {}) {
    const query = new URLSearchParams(params).toString()
    const endpoint = query ? `${API_ENDPOINTS.ADMIN.CLASSROOMS}?${query}` : API_ENDPOINTS.ADMIN.CLASSROOMS
    return this.request(endpoint)
  }

  async getClassroom(id) {
    return this.request(API_ENDPOINTS.ADMIN.CLASSROOM_BY_ID(id))
  }

  async createClassroom(data) {
    return this.request(API_ENDPOINTS.ADMIN.CLASSROOMS, {
      method: 'POST',
      data
    })
  }

  async updateClassroom(id, data) {
    return this.request(API_ENDPOINTS.ADMIN.CLASSROOM_BY_ID(id), {
      method: 'PUT',
      data
    })
  }

  async deleteClassroom(id) {
    return this.request(API_ENDPOINTS.ADMIN.CLASSROOM_BY_ID(id), {
      method: 'DELETE'
    })
  }

  // Grade CRUD
  async getGrades(params = {}) {
    const query = new URLSearchParams(params).toString()
    const endpoint = query ? `${API_ENDPOINTS.ADMIN.GRADES}?${query}` : API_ENDPOINTS.ADMIN.GRADES
    return this.request(endpoint)
  }

  async getGrade(id) {
    return this.request(API_ENDPOINTS.ADMIN.GRADE_BY_ID(id))
  }

  async createGrade(data) {
    return this.request(API_ENDPOINTS.ADMIN.GRADES, {
      method: 'POST',
      data
    })
  }

  async updateGrade(id, data) {
    return this.request(API_ENDPOINTS.ADMIN.GRADE_BY_ID(id), {
      method: 'PUT',
      data
    })
  }

  async deleteGrade(id) {
    return this.request(API_ENDPOINTS.ADMIN.GRADE_BY_ID(id), {
      method: 'DELETE'
    })
  }

  // Department CRUD
  async getDepartments(params = {}) {
    const query = new URLSearchParams(params).toString()
    const endpoint = query ? `${API_ENDPOINTS.ADMIN.DEPARTMENTS}?${query}` : API_ENDPOINTS.ADMIN.DEPARTMENTS
    return this.request(endpoint)
  }

  async getDepartment(id) {
    return this.request(API_ENDPOINTS.ADMIN.DEPARTMENT_BY_ID(id))
  }

  async createDepartment(data) {
    return this.request(API_ENDPOINTS.ADMIN.DEPARTMENTS, {
      method: 'POST',
      data
    })
  }

  async updateDepartment(id, data) {
    return this.request(API_ENDPOINTS.ADMIN.DEPARTMENT_BY_ID(id), {
      method: 'PUT',
      data
    })
  }

  async deleteDepartment(id) {
    return this.request(API_ENDPOINTS.ADMIN.DEPARTMENT_BY_ID(id), {
      method: 'DELETE'
    })
  }

  // Course CRUD
  async getCourses(params = {}) {
    const query = new URLSearchParams(params).toString()
    const endpoint = query ? `${API_ENDPOINTS.ADMIN.COURSES}?${query}` : API_ENDPOINTS.ADMIN.COURSES
    return this.request(endpoint)
  }

  async getCourse(id) {
    return this.request(API_ENDPOINTS.ADMIN.COURSE_BY_ID(id))
  }

  async createCourse(data) {
    return this.request(API_ENDPOINTS.ADMIN.COURSES, {
      method: 'POST',
      data
    })
  }

  async updateCourse(id, data) {
    return this.request(API_ENDPOINTS.ADMIN.COURSE_BY_ID(id), {
      method: 'PUT',
      data
    })
  }

  async deleteCourse(id) {
    return this.request(API_ENDPOINTS.ADMIN.COURSE_BY_ID(id), {
      method: 'DELETE'
    })
  }

  // Curriculum CRUD
  async getCurriculums(params = {}) {
    const query = new URLSearchParams(params).toString()
    const endpoint = query ? `${API_ENDPOINTS.ADMIN.CURRICULUMS}?${query}` : API_ENDPOINTS.ADMIN.CURRICULUMS
    return this.request(endpoint)
  }

  async getCurriculum(id) {
    return this.request(API_ENDPOINTS.ADMIN.CURRICULUM_BY_ID(id))
  }

  async createCurriculum(data) {
    return this.request(API_ENDPOINTS.ADMIN.CURRICULUMS, {
      method: 'POST',
      data
    })
  }

  async updateCurriculum(id, data) {
    return this.request(API_ENDPOINTS.ADMIN.CURRICULUM_BY_ID(id), {
      method: 'PUT',
      data
    })
  }

  async deleteCurriculum(id) {
    return this.request(API_ENDPOINTS.ADMIN.CURRICULUM_BY_ID(id), {
      method: 'DELETE'
    })
  }

  // Club CRUD
  async getClubs(params = {}) {
    const query = new URLSearchParams(params).toString()
    const endpoint = query ? `${API_ENDPOINTS.ADMIN.CLUBS}?${query}` : API_ENDPOINTS.ADMIN.CLUBS
    return this.request(endpoint)
  }

  async getClub(id) {
    return this.request(API_ENDPOINTS.ADMIN.CLUB_BY_ID(id))
  }

  async createClub(data) {
    return this.request(API_ENDPOINTS.ADMIN.CLUBS, {
      method: 'POST',
      data
    })
  }

  async updateClub(id, data) {
    return this.request(API_ENDPOINTS.ADMIN.CLUB_BY_ID(id), {
      method: 'PUT',
      data
    })
  }

  async deleteClub(id) {
    return this.request(API_ENDPOINTS.ADMIN.CLUB_BY_ID(id), {
      method: 'DELETE'
    })
  }

  // Users CRUD
  async getUsers(params = {}) {
    const query = new URLSearchParams(params).toString()
    const endpoint = query ? `${API_ENDPOINTS.ADMIN.USERS}?${query}` : API_ENDPOINTS.ADMIN.USERS
    return this.request(endpoint)
  }

  async getUser(id) {
    return this.request(API_ENDPOINTS.ADMIN.USER_BY_ID(id))
  }

  async createUser(data) {
    return this.request(API_ENDPOINTS.ADMIN.USERS, {
      method: 'POST',
      data
    })
  }

  async updateUser(id, data) {
    return this.request(API_ENDPOINTS.ADMIN.USER_BY_ID(id), {
      method: 'PUT',
      data
    })
  }

  async deleteUser(id) {
    return this.request(API_ENDPOINTS.ADMIN.USER_BY_ID(id), {
      method: 'DELETE'
    })
  }

  // Dashboard Stats
  async getDashboardStats() {
    return this.request('/admin/dashboard')
  }

  // Inventory CRUD
  async getInventory(params = {}) {
    const query = new URLSearchParams(params).toString()
    const endpoint = query ? `${API_ENDPOINTS.ADMIN.INVENTORY}?${query}` : API_ENDPOINTS.ADMIN.INVENTORY
    return this.request(endpoint)
  }

  async getInventoryItem(id) {
    return this.request(API_ENDPOINTS.ADMIN.INVENTORY_BY_ID(id))
  }

  async createInventory(data) {
    return this.request(API_ENDPOINTS.ADMIN.INVENTORY, {
      method: 'POST',
      data
    })
  }

  async updateInventory(id, data) {
    return this.request(API_ENDPOINTS.ADMIN.INVENTORY_BY_ID(id), {
      method: 'PUT',
      data
    })
  }

  async deleteInventory(id) {
    return this.request(API_ENDPOINTS.ADMIN.INVENTORY_BY_ID(id), {
      method: 'DELETE'
    })
  }

  // Stakeholder CRUD
  async getStakeholders(params = {}) {
    const query = new URLSearchParams(params).toString()
    const endpoint = query ? `${API_ENDPOINTS.ADMIN.STAKEHOLDERS}?${query}` : API_ENDPOINTS.ADMIN.STAKEHOLDERS
    return this.request(endpoint)
  }

  async getStakeholder(id) {
    return this.request(API_ENDPOINTS.ADMIN.STAKEHOLDER_BY_ID(id))
  }

  async createStakeholder(data) {
    return this.request(API_ENDPOINTS.ADMIN.STAKEHOLDERS, {
      method: 'POST',
      data
    })
  }

  async updateStakeholder(id, data) {
    return this.request(API_ENDPOINTS.ADMIN.STAKEHOLDER_BY_ID(id), {
      method: 'PUT',
      data
    })
  }

  async deleteStakeholder(id) {
    return this.request(API_ENDPOINTS.ADMIN.STAKEHOLDER_BY_ID(id), {
      method: 'DELETE'
    })
  }

  // Fuel Records CRUD
  async getFuelRecords(params = {}) {
    const query = new URLSearchParams(params).toString()
    const endpoint = query ? `${API_ENDPOINTS.ADMIN.FUEL_RECORDS}?${query}` : API_ENDPOINTS.ADMIN.FUEL_RECORDS
    return this.request(endpoint)
  }

  async getFuelRecord(id) {
    return this.request(API_ENDPOINTS.ADMIN.FUEL_RECORD_BY_ID(id))
  }

  async createFuelRecord(data) {
    return this.request(API_ENDPOINTS.ADMIN.FUEL_RECORDS, {
      method: 'POST',
      data
    })
  }

  async updateFuelRecord(id, data) {
    return this.request(API_ENDPOINTS.ADMIN.FUEL_RECORD_BY_ID(id), {
      method: 'PUT',
      data
    })
  }

  async deleteFuelRecord(id) {
    return this.request(API_ENDPOINTS.ADMIN.FUEL_RECORD_BY_ID(id), {
      method: 'DELETE'
    })
  }

  async getUnverifiedFuelRecords() {
    return this.request(API_ENDPOINTS.ADMIN.UNVERIFIED_FUEL_RECORDS)
  }

  async getFuelAnalytics(vehicleId) {
    return this.request(API_ENDPOINTS.ADMIN.FUEL_ANALYTICS(vehicleId))
  }

  // Maintenance Records CRUD
  async getMaintenanceRecords(params = {}) {
    const query = new URLSearchParams(params).toString()
    const endpoint = query ? `${API_ENDPOINTS.ADMIN.MAINTENANCE}?${query}` : API_ENDPOINTS.ADMIN.MAINTENANCE
    return this.request(endpoint)
  }

  async getMaintenanceRecord(id) {
    return this.request(API_ENDPOINTS.ADMIN.MAINTENANCE_BY_ID(id))
  }

  async createMaintenanceRecord(data) {
    return this.request(API_ENDPOINTS.ADMIN.MAINTENANCE, {
      method: 'POST',
      data
    })
  }

  async updateMaintenanceRecord(id, data) {
    return this.request(API_ENDPOINTS.ADMIN.MAINTENANCE_BY_ID(id), {
      method: 'PUT',
      data
    })
  }

  async deleteMaintenanceRecord(id) {
    return this.request(API_ENDPOINTS.ADMIN.MAINTENANCE_BY_ID(id), {
      method: 'DELETE'
    })
  }

  async getUpcomingMaintenance() {
    return this.request(API_ENDPOINTS.ADMIN.UPCOMING_MAINTENANCE)
  }

  async getMaintenanceAnalytics(vehicleId) {
    return this.request(API_ENDPOINTS.ADMIN.MAINTENANCE_ANALYTICS(vehicleId))
  }

  // Vehicle Documents CRUD
  async getVehicleDocuments(params = {}) {
    const query = new URLSearchParams(params).toString()
    const endpoint = query ? `${API_ENDPOINTS.ADMIN.VEHICLE_DOCUMENTS}?${query}` : API_ENDPOINTS.ADMIN.VEHICLE_DOCUMENTS
    return this.request(endpoint)
  }

  async getVehicleDocument(id) {
    return this.request(API_ENDPOINTS.ADMIN.VEHICLE_DOCUMENT_BY_ID(id))
  }

  async createVehicleDocument(data) {
    return this.request(API_ENDPOINTS.ADMIN.VEHICLE_DOCUMENTS, {
      method: 'POST',
      data
    })
  }

  async updateVehicleDocument(id, data) {
    return this.request(API_ENDPOINTS.ADMIN.VEHICLE_DOCUMENT_BY_ID(id), {
      method: 'PUT',
      data
    })
  }

  async deleteVehicleDocument(id) {
    return this.request(API_ENDPOINTS.ADMIN.VEHICLE_DOCUMENT_BY_ID(id), {
      method: 'DELETE'
    })
  }

  async renewVehicleDocument(id, newExpiryDate) {
    return this.request(API_ENDPOINTS.ADMIN.RENEW_DOCUMENT(id), {
      method: 'PATCH',
      data: { expiryDate: newExpiryDate }
    })
  }

  async verifyVehicleDocument(id) {
    return this.request(API_ENDPOINTS.ADMIN.VERIFY_DOCUMENT(id), {
      method: 'PATCH'
    })
  }

  async getExpiringDocuments() {
    return this.request(API_ENDPOINTS.ADMIN.EXPIRING_DOCUMENTS)
  }

  async getExpiredDocuments() {
    return this.request(API_ENDPOINTS.ADMIN.EXPIRED_DOCUMENTS)
  }

  async getDocumentAnalytics(vehicleId) {
    return this.request(API_ENDPOINTS.ADMIN.DOCUMENT_ANALYTICS(vehicleId))
  }

  // Vehicle Analytics
  async getVehicleAnalytics(id) {
    return this.request(API_ENDPOINTS.ADMIN.VEHICLE_ANALYTICS(id))
  }

  async getVehiclesNeedingService() {
    return this.request(API_ENDPOINTS.ADMIN.VEHICLES_NEEDING_SERVICE)
  }
}

export const adminApi = new AdminApi()
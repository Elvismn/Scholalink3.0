// Comprehensive Admin API Service - ALL admin CRUD operations for ALL models
import { showToast } from '@shared';

class AdminApi {
  constructor(baseURL) {
    this.baseURL = baseURL || (import.meta.env.VITE_API_URL || 'http://localhost:5000/api');
  }

  // Get auth headers
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    const token = localStorage.getItem('token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  // Generic request method
  async request(endpoint, options = {}) {
    const { method = 'GET', data = null } = options;
    
    const config = {
      method,
      headers: this.getHeaders(),
    };

    if (data) {
      config.body = JSON.stringify(data);
    }

    const url = `${this.baseURL}${endpoint}`;
    
    console.log(`👑 ADMIN API: ${method} ${url}`, data || '');

    try {
      const response = await fetch(url, config);
      const responseData = await response.json();

      if (!response.ok) {
        const error = new Error(responseData.error || responseData.message || `HTTP ${response.status}`);
        error.status = response.status;
        error.data = responseData;
        throw error;
      }

      console.log(`✅ ADMIN API Success: ${method} ${endpoint}`);
      return responseData;
    } catch (error) {
      console.error(`❌ ADMIN API Error: ${method} ${endpoint}`, error);
      
      // Auto logout on 401
      if (error.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
      
      showToast.error('Operation failed', error.data?.message || error.message);
      throw error;
    }
  }

  // Helper for query params
  buildQuery(endpoint, params = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        query.append(key, value);
      }
    });
    const queryString = query.toString();
    return queryString ? `${endpoint}?${queryString}` : endpoint;
  }

  // ==================== STUDENTS ====================
  async getStudents(params = {}) {
    return this.request(this.buildQuery('/admin/students', params));
  }

  async getStudent(id) {
    return this.request(`/admin/students/${id}`);
  }

  async createStudent(data) {
    const result = await this.request('/admin/students', { method: 'POST', data });
    showToast.success('Student created successfully');
    return result;
  }

  async updateStudent(id, data) {
    const result = await this.request(`/admin/students/${id}`, { method: 'PUT', data });
    showToast.success('Student updated successfully');
    return result;
  }

  async deleteStudent(id) {
    const result = await this.request(`/admin/students/${id}`, { method: 'DELETE' });
    showToast.success('Student deleted successfully');
    return result;
  }

  // ==================== VEHICLES ====================
  async getVehicles(params = {}) {
    return this.request(this.buildQuery('/admin/vehicles', params));
  }

  async getVehicle(id) {
    return this.request(`/admin/vehicles/${id}`);
  }

  async createVehicle(data) {
    const result = await this.request('/admin/vehicles', { method: 'POST', data });
    showToast.success('Vehicle created successfully');
    return result;
  }

  async updateVehicle(id, data) {
    const result = await this.request(`/admin/vehicles/${id}`, { method: 'PUT', data });
    showToast.success('Vehicle updated successfully');
    return result;
  }

  async deleteVehicle(id) {
    const result = await this.request(`/admin/vehicles/${id}`, { method: 'DELETE' });
    showToast.success('Vehicle deleted successfully');
    return result;
  }

  // Vehicle sub-resources
  async getFuelRecords(vehicleId = null) {
    const endpoint = vehicleId 
      ? `/admin/fuel-records/vehicle/${vehicleId}`
      : '/admin/fuel-records';
    return this.request(endpoint);
  }

  async createFuelRecord(data) {
    const result = await this.request('/admin/fuel-records', { method: 'POST', data });
    showToast.success('Fuel record added');
    return result;
  }

  async updateFuelRecord(id, data) {
    const result = await this.request(`/admin/fuel-records/${id}`, { method: 'PUT', data });
    showToast.success('Fuel record updated');
    return result;
  }

  async deleteFuelRecord(id) {
    const result = await this.request(`/admin/fuel-records/${id}`, { method: 'DELETE' });
    showToast.success('Fuel record deleted');
    return result;
  }

  async getMaintenanceRecords(vehicleId = null) {
    const endpoint = vehicleId 
      ? `/admin/maintenance/vehicle/${vehicleId}`
      : '/admin/maintenance';
    return this.request(endpoint);
  }

  async createMaintenanceRecord(data) {
    const result = await this.request('/admin/maintenance', { method: 'POST', data });
    showToast.success('Maintenance record added');
    return result;
  }

  async updateMaintenanceRecord(id, data) {
    const result = await this.request(`/admin/maintenance/${id}`, { method: 'PUT', data });
    showToast.success('Maintenance record updated');
    return result;
  }

  async deleteMaintenanceRecord(id) {
    const result = await this.request(`/admin/maintenance/${id}`, { method: 'DELETE' });
    showToast.success('Maintenance record deleted');
    return result;
  }

  async getVehicleDocuments(vehicleId = null) {
    const endpoint = vehicleId 
      ? `/admin/vehicle-documents/vehicle/${vehicleId}`
      : '/admin/vehicle-documents';
    return this.request(endpoint);
  }

  async createVehicleDocument(data) {
    const result = await this.request('/admin/vehicle-documents', { method: 'POST', data });
    showToast.success('Document uploaded');
    return result;
  }

  async updateVehicleDocument(id, data) {
    const result = await this.request(`/admin/vehicle-documents/${id}`, { method: 'PUT', data });
    showToast.success('Document updated');
    return result;
  }

  async deleteVehicleDocument(id) {
    const result = await this.request(`/admin/vehicle-documents/${id}`, { method: 'DELETE' });
    showToast.success('Document deleted');
    return result;
  }

  // ==================== PARENTS ====================
  async getParents(params = {}) {
    return this.request(this.buildQuery('/admin/parents', params));
  }

  async getParent(id) {
    return this.request(`/admin/parents/${id}`);
  }

  async createParent(data) {
    const result = await this.request('/admin/parents', { method: 'POST', data });
    showToast.success('Parent created successfully');
    return result;
  }

  async updateParent(id, data) {
    const result = await this.request(`/admin/parents/${id}`, { method: 'PUT', data });
    showToast.success('Parent updated successfully');
    return result;
  }

  async deleteParent(id) {
    const result = await this.request(`/admin/parents/${id}`, { method: 'DELETE' });
    showToast.success('Parent deleted successfully');
    return result;
  }

  // ==================== STAFF ====================
  async getStaff(params = {}) {
    return this.request(this.buildQuery('/admin/staff', params));
  }

  async getStaffMember(id) {
    return this.request(`/admin/staff/${id}`);
  }

  async createStaff(data) {
    const result = await this.request('/admin/staff', { method: 'POST', data });
    showToast.success('Staff member created successfully');
    return result;
  }

  async updateStaff(id, data) {
    const result = await this.request(`/admin/staff/${id}`, { method: 'PUT', data });
    showToast.success('Staff member updated successfully');
    return result;
  }

  async deleteStaff(id) {
    const result = await this.request(`/admin/staff/${id}`, { method: 'DELETE' });
    showToast.success('Staff member deleted successfully');
    return result;
  }

  // ==================== CLASSROOMS ====================
  async getClassrooms(params = {}) {
    return this.request(this.buildQuery('/admin/classrooms', params));
  }

  async getClassroom(id) {
    return this.request(`/admin/classrooms/${id}`);
  }

  async createClassroom(data) {
    const result = await this.request('/admin/classrooms', { method: 'POST', data });
    showToast.success('Classroom created successfully');
    return result;
  }

  async updateClassroom(id, data) {
    const result = await this.request(`/admin/classrooms/${id}`, { method: 'PUT', data });
    showToast.success('Classroom updated successfully');
    return result;
  }

  async deleteClassroom(id) {
    const result = await this.request(`/admin/classrooms/${id}`, { method: 'DELETE' });
    showToast.success('Classroom deleted successfully');
    return result;
  }

  // ==================== GRADES ====================
  async getGrades(params = {}) {
    return this.request(this.buildQuery('/admin/grades', params));
  }

  async getGrade(id) {
    return this.request(`/admin/grades/${id}`);
  }

  async createGrade(data) {
    const result = await this.request('/admin/grades', { method: 'POST', data });
    showToast.success('Grade created successfully');
    return result;
  }

  async updateGrade(id, data) {
    const result = await this.request(`/admin/grades/${id}`, { method: 'PUT', data });
    showToast.success('Grade updated successfully');
    return result;
  }

  async deleteGrade(id) {
    const result = await this.request(`/admin/grades/${id}`, { method: 'DELETE' });
    showToast.success('Grade deleted successfully');
    return result;
  }

  // ==================== COURSES ====================
  async getCourses(params = {}) {
    return this.request(this.buildQuery('/admin/courses', params));
  }

  async getCourse(id) {
    return this.request(`/admin/courses/${id}`);
  }

  async createCourse(data) {
    const result = await this.request('/admin/courses', { method: 'POST', data });
    showToast.success('Course created successfully');
    return result;
  }

  async updateCourse(id, data) {
    const result = await this.request(`/admin/courses/${id}`, { method: 'PUT', data });
    showToast.success('Course updated successfully');
    return result;
  }

  async deleteCourse(id) {
    const result = await this.request(`/admin/courses/${id}`, { method: 'DELETE' });
    showToast.success('Course deleted successfully');
    return result;
  }

  // ==================== DEPARTMENTS ====================
  async getDepartments(params = {}) {
    return this.request(this.buildQuery('/admin/departments', params));
  }

  async getDepartment(id) {
    return this.request(`/admin/departments/${id}`);
  }

  async createDepartment(data) {
    const result = await this.request('/admin/departments', { method: 'POST', data });
    showToast.success('Department created successfully');
    return result;
  }

  async updateDepartment(id, data) {
    const result = await this.request(`/admin/departments/${id}`, { method: 'PUT', data });
    showToast.success('Department updated successfully');
    return result;
  }

  async deleteDepartment(id) {
    const result = await this.request(`/admin/departments/${id}`, { method: 'DELETE' });
    showToast.success('Department deleted successfully');
    return result;
  }

  // ==================== INVENTORY ====================
  async getInventoryItems(params = {}) {
    return this.request(this.buildQuery('/admin/inventory', params));
  }

  async getInventoryItem(id) {
    return this.request(`/admin/inventory/${id}`);
  }

  async createInventoryItem(data) {
    const result = await this.request('/admin/inventory', { method: 'POST', data });
    showToast.success('Inventory item created successfully');
    return result;
  }

  async updateInventoryItem(id, data) {
    const result = await this.request(`/admin/inventory/${id}`, { method: 'PUT', data });
    showToast.success('Inventory item updated successfully');
    return result;
  }

  async deleteInventoryItem(id) {
    const result = await this.request(`/admin/inventory/${id}`, { method: 'DELETE' });
    showToast.success('Inventory item deleted successfully');
    return result;
  }

  // ==================== CURRICULUMS ====================
  async getCurriculums(params = {}) {
    return this.request(this.buildQuery('/admin/curriculums', params));
  }

  async getCurriculum(id) {
    return this.request(`/admin/curriculums/${id}`);
  }

  async createCurriculum(data) {
    const result = await this.request('/admin/curriculums', { method: 'POST', data });
    showToast.success('Curriculum created successfully');
    return result;
  }

  async updateCurriculum(id, data) {
    const result = await this.request(`/admin/curriculums/${id}`, { method: 'PUT', data });
    showToast.success('Curriculum updated successfully');
    return result;
  }

  async deleteCurriculum(id) {
    const result = await this.request(`/admin/curriculums/${id}`, { method: 'DELETE' });
    showToast.success('Curriculum deleted successfully');
    return result;
  }

  // ==================== CLUBS ====================
  async getClubs(params = {}) {
    return this.request(this.buildQuery('/admin/clubs', params));
  }

  async getClub(id) {
    return this.request(`/admin/clubs/${id}`);
  }

  async createClub(data) {
    const result = await this.request('/admin/clubs', { method: 'POST', data });
    showToast.success('Club created successfully');
    return result;
  }

  async updateClub(id, data) {
    const result = await this.request(`/admin/clubs/${id}`, { method: 'PUT', data });
    showToast.success('Club updated successfully');
    return result;
  }

  async deleteClub(id) {
    const result = await this.request(`/admin/clubs/${id}`, { method: 'DELETE' });
    showToast.success('Club deleted successfully');
    return result;
  }

  // ==================== STAKEHOLDERS ====================
  async getStakeholders(params = {}) {
    return this.request(this.buildQuery('/admin/stakeholders', params));
  }

  async getStakeholder(id) {
    return this.request(`/admin/stakeholders/${id}`);
  }

  async createStakeholder(data) {
    const result = await this.request('/admin/stakeholders', { method: 'POST', data });
    showToast.success('Stakeholder created successfully');
    return result;
  }

  async updateStakeholder(id, data) {
    const result = await this.request(`/admin/stakeholders/${id}`, { method: 'PUT', data });
    showToast.success('Stakeholder updated successfully');
    return result;
  }

  async deleteStakeholder(id) {
    const result = await this.request(`/admin/stakeholders/${id}`, { method: 'DELETE' });
    showToast.success('Stakeholder deleted successfully');
    return result;
  }

  // ==================== USERS ====================
  async getUsers(params = {}) {
    return this.request(this.buildQuery('/admin/users', params));
  }

  async getUser(id) {
    return this.request(`/admin/users/${id}`);
  }

  async createUser(data) {
    const result = await this.request('/admin/users', { method: 'POST', data });
    showToast.success('User created successfully');
    return result;
  }

  async updateUser(id, data) {
    const result = await this.request(`/admin/users/${id}`, { method: 'PUT', data });
    showToast.success('User updated successfully');
    return result;
  }

  async deleteUser(id) {
    const result = await this.request(`/admin/users/${id}`, { method: 'DELETE' });
    showToast.success('User deleted successfully');
    return result;
  }

  // ==================== DASHBOARD & STATS ====================
  async getDashboardStats() {
    return this.request('/admin/dashboard/stats');
  }

  async getRecentActivity() {
    return this.request('/admin/dashboard/activity');
  }

  // ==================== BULK OPERATIONS ====================
  async bulkUpdateVehicleDocuments(data) {
    const result = await this.request('/admin/vehicle-documents/bulk-update', { method: 'POST', data });
    showToast.success('Documents updated in bulk');
    return result;
  }

  async renewDocument(id) {
    const result = await this.request(`/admin/vehicle-documents/${id}/renew`, { method: 'PATCH' });
    showToast.success('Document renewed');
    return result;
  }

  async verifyDocument(id) {
    const result = await this.request(`/admin/vehicle-documents/${id}/verify`, { method: 'PATCH' });
    showToast.success('Document verified');
    return result;
  }

  async verifyFuelRecord(id) {
    const result = await this.request(`/admin/fuel-records/${id}/verify`, { method: 'PATCH' });
    showToast.success('Fuel record verified');
    return result;
  }

  async verifyMaintenanceRecord(id) {
    const result = await this.request(`/admin/maintenance/${id}/verify`, { method: 'PATCH' });
    showToast.success('Maintenance record verified');
    return result;
  }

  // ==================== ANALYTICS ====================
  async getVehicleAnalytics(vehicleId) {
    return this.request(`/admin/vehicles/${vehicleId}/analytics`);
  }

  async getFuelAnalytics(vehicleId) {
    return this.request(`/admin/fuel-records/vehicle/${vehicleId}/analytics`);
  }

  async getMaintenanceAnalytics(vehicleId) {
    return this.request(`/admin/maintenance/vehicle/${vehicleId}/analytics`);
  }

  async getMaintenanceForecast(vehicleId) {
    return this.request(`/admin/maintenance/vehicle/${vehicleId}/forecast`);
  }

  async getDocumentAnalytics(vehicleId) {
    return this.request(`/admin/vehicle-documents/vehicle/${vehicleId}/analytics`);
  }

  // ==================== SPECIAL QUERIES ====================
  async getVehiclesNeedingService() {
    return this.request('/admin/vehicles/needing-service');
  }

  async getUpcomingMaintenance() {
    return this.request('/admin/maintenance/upcoming');
  }

  async getUnverifiedFuelRecords() {
    return this.request('/admin/fuel-records/unverified');
  }

  async getExpiringDocuments() {
    return this.request('/admin/vehicle-documents/expiring');
  }

  async getExpiredDocuments() {
    return this.request('/admin/vehicle-documents/expired');
  }
}

// Create singleton instance
export const adminApi = new AdminApi();

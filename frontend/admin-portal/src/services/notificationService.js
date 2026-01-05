// services/notificationService.js
class NotificationService {
  constructor() {
    this.defaultSettings = {
      emailNotifications: true,
      pushNotifications: false,
      twoFactorAuth: false,
      notificationCategories: {
        students: true,
        vehicles: true,
        maintenance: true,
        documents: true,
        fuel: true,
        parents: true,
        staff: true,
        system: true
      },
      notificationFrequency: 'realtime',
      dashboardRefresh: 30
    }
  }

  // Get notification settings
  getSettings() {
    try {
      const saved = localStorage.getItem('notificationSettings')
      if (saved) {
        const parsed = JSON.parse(saved)
        return { ...this.defaultSettings, ...parsed }
      }
      return this.defaultSettings
    } catch (error) {
      console.error('Error loading notification settings:', error)
      return this.defaultSettings
    }
  }

  // Save notification settings
  saveSettings(settings) {
    try {
      localStorage.setItem('notificationSettings', JSON.stringify(settings))
      return true
    } catch (error) {
      console.error('Error saving notification settings:', error)
      return false
    }
  }

  // Request push notification permission
  async requestPushPermission() {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications')
      return false
    }

    if (Notification.permission === 'granted') {
      return true
    }

    if (Notification.permission === 'denied') {
      console.warn('Push notifications have been denied')
      return false
    }

    const permission = await Notification.requestPermission()
    return permission === 'granted'
  }

  // Send a test notification
  sendTestNotification(title, body) {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return false
    }

    const notification = new Notification(title, {
      body,
      icon: '/favicon.ico'
    })

    notification.onclick = () => {
      window.focus()
      notification.close()
    }

    return true
  }
}

export const notificationService = new NotificationService()
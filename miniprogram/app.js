App({
  globalData: {
    userInfo: null,
    token: null,
    configCache: {
      accounts: [],
      categories: [],
      channels: [],
      banks: []
    }
  },

  onLaunch() {
    // 检查登录态
    const token = wx.getStorageSync('token')
    if (token) {
      this.globalData.token = token
      this.loadConfig()
    } else {
      this.login()
    }
  },

  login() {
    wx.login({
      success: (res) => {
        if (res.code) {
          const request = require('./utils/request.js')
          request.post('/auth/login', { code: res.code }).then(data => {
            this.globalData.token = data.token
            this.globalData.userInfo = data.user
            wx.setStorageSync('token', data.token)
            this.loadConfig()
          }).catch(err => {
            console.error('登录失败', err)
          })
        }
      }
    })
  },

  loadConfig() {
    const request = require('./utils/request.js')
    Promise.all([
      request.get('/accounts'),
      request.get('/categories'),
      request.get('/channels'),
      request.get('/banks')
    ]).then(([accounts, categories, channels, banks]) => {
      this.globalData.configCache = { accounts, categories, channels, banks }
    }).catch(err => {
      console.error('加载配置失败', err)
    })
  }
})

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
    // 检查登录状态
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
            wx.showToast({ title: '登录失败，请重试', icon: 'none' })
          })
        }
      },
      fail: (err) => {
        console.error('wx.login 失败', err)
        wx.showToast({ title: '微信登录失败，请重试', icon: 'none' })
      }
    })
  },

  refreshToken() {
    return new Promise((resolve, reject) => {
      wx.removeStorageSync('token')
      this.globalData.token = null
      wx.login({
        success: (res) => {
          if (res.code) {
            const request = require('./utils/request.js')
            // 注意：这里不能直接用 request()，因为 auth 接口不需要 token header
            wx.request({
              url: require('./utils/config.js').baseUrl + '/auth/login',
              method: 'POST',
              data: { code: res.code },
              header: { 'Content-Type': 'application/json' },
              success: (apiRes) => {
                if (apiRes.statusCode === 200) {
                  const data = apiRes.data
                  this.globalData.token = data.token
                  this.globalData.userInfo = data.user
                  wx.setStorageSync('token', data.token)
                  this.loadConfig()
                  resolve(data)
                } else {
                  reject(new Error('刷新登录失败'))
                }
              },
              fail: (err) => {
                reject(err)
              }
            })
          } else {
            reject(new Error('wx.login 无 code'))
          }
        },
        fail: (err) => {
          reject(err)
        }
      })
    })
  },

  loadConfig() {
    const request = require('./utils/request.js')

    const loadAccounts = request.get('/accounts').catch(() => [])
    const loadCategories = request.get('/categories').catch(() => [])
    const loadChannels = request.get('/channels').catch(() => [])
    const loadBanks = request.get('/banks').catch(() => [])

    Promise.all([loadAccounts, loadCategories, loadChannels, loadBanks])
      .then(([accounts, categories, channels, banks]) => {
        this.globalData.configCache = {
          accounts: Array.isArray(accounts) ? accounts : (accounts.list || []),
          categories: Array.isArray(categories) ? categories : (categories.list || []),
          channels: Array.isArray(channels) ? channels : (channels.list || []),
          banks: Array.isArray(banks) ? banks : (banks.list || [])
        }
      }).catch(err => {
        console.error('加载配置失败', err)
      })
  }
})
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
    this.refreshLogin().then(function() {
      // login 成功后已在 refreshLogin 中调用了 loadConfig，无需额外调用
    }).catch(function(err) {
      console.error('启动登录失败', err)
    })
  },

  refreshLogin() {
    var that = this
    return new Promise(function(resolve, reject) {
      wx.removeStorageSync('token')
      that.globalData.token = null
      wx.login({
        success: function(res) {
          if (res.code) {
            wx.request({
              url: require('./utils/config.js').baseUrl + '/auth/login',
              method: 'POST',
              data: { code: res.code },
              header: { 'Content-Type': 'application/json' },
              success: function(apiRes) {
                if (apiRes.statusCode >= 200 && apiRes.statusCode < 300) {
                  var data = apiRes.data
                  that.globalData.token = data.token
                  that.globalData.userInfo = data.user
                  wx.setStorageSync('token', data.token)
                  that.loadConfig()
                  resolve(data)
                } else {
                  var msg = (apiRes.data && apiRes.data.detail) || '登录失败'
                  console.error('登录失败', msg)
                  wx.showToast({ title: msg, icon: 'none' })
                  reject(new Error(msg))
                }
              },
              fail: function(err) {
                console.error('登录网络错误', err)
                wx.showToast({ title: '网络错误，请重试', icon: 'none' })
                reject(err)
              }
            })
          } else {
            reject(new Error('wx.login 无 code'))
          }
        },
        fail: function(err) {
          console.error('wx.login 失败', err)
          wx.showToast({ title: '微信登录失败，请重试', icon: 'none' })
          reject(err)
        }
      })
    })
  },

  loadConfig() {
    var request = require('./utils/request.js')
    var that = this

    Promise.all([
      request.get('/accounts').catch(function() { return [] }),
      request.get('/categories').catch(function() { return [] }),
      request.get('/channels').catch(function() { return [] }),
      request.get('/banks').catch(function() { return [] })
    ]).then(function(results) {
      var accounts = results[0], categories = results[1], channels = results[2], banks = results[3]
      that.globalData.configCache = {
        accounts: Array.isArray(accounts) ? accounts : (accounts.list || []),
        categories: Array.isArray(categories) ? categories : (categories.list || []),
        channels: Array.isArray(channels) ? channels : (channels.list || []),
        banks: Array.isArray(banks) ? banks : (banks.list || [])
      }
      var pages = getCurrentPages()
      if (pages.length > 0) {
        var page = pages[pages.length - 1]
        if (page && page.onShow) {
          page.onShow()
        }
      }
    }).catch(function(err) {
      console.error('加载配置失败', err)
    })
  }
})
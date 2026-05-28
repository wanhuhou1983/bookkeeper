const config = require('./config.js')

// 全局 Token 刷新等待队列
let tokenRefreshPromise = null

function request(options) {
  return new Promise((resolve, reject) => {
    const token = wx.getStorageSync('token')
    const header = {
      'Content-Type': 'application/json',
      ...(options.header || {})
    }
    if (token) {
      header['Authorization'] = 'Bearer ' + token
    }

    const doRequest = () => {
      wx.request({
        url: config.baseUrl + options.url,
        method: options.method || 'GET',
        data: options.data || {},
        header: header,
        success: (res) => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(res.data)
          } else if (res.statusCode === 401) {
            // Token 过期，等待刷新后重试
            getApp().refreshToken().then(() => {
              // 更新 header 中的 token
              const newToken = wx.getStorageSync('token')
              header['Authorization'] = 'Bearer ' + newToken
              // 重试原请求
              wx.request({
                url: config.baseUrl + options.url,
                method: options.method || 'GET',
                data: options.data || {},
                header: header,
                success: (retryRes) => {
                  if (retryRes.statusCode >= 200 && retryRes.statusCode < 300) {
                    resolve(retryRes.data)
                  } else {
                    const msg = retryRes.data?.detail || '请求失败'
                    wx.showToast({ title: msg, icon: 'none' })
                    reject(new Error(msg))
                  }
                },
                fail: (retryErr) => {
                  wx.showToast({ title: '网络错误', icon: 'none' })
                  reject(retryErr)
                }
              })
            }).catch(() => {
              reject(new Error('登录已过期'))
            })
          } else {
            const msg = res.data?.detail || '请求失败'
            wx.showToast({ title: msg, icon: 'none' })
            reject(new Error(msg))
          }
        },
        fail: (err) => {
          wx.showToast({ title: '网络错误', icon: 'none' })
          reject(err)
        }
      })
    }

    doRequest()
  })
}

function get(url, data) {
  return request({ url, method: 'GET', data })
}

function post(url, data) {
  return request({ url, method: 'POST', data })
}

function put(url, data) {
  return request({ url, method: 'PUT', data })
}

function del(url, data) {
  return request({ url, method: 'DELETE', data })
}

module.exports = { request, get, post, put, del }
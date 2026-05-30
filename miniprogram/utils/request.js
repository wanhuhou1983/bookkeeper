var config = require('./config.js')

function request(options) {
  return new Promise(function(resolve, reject) {
    var token = wx.getStorageSync('token')
    var header = {
      'Content-Type': 'application/json'
    }
    if (options.header) {
      Object.assign(header, options.header)
    }
    if (token) {
      header['Authorization'] = 'Bearer ' + token
    }

    function doRequest() {
      wx.request({
        url: config.baseUrl + options.url,
        method: options.method || 'GET',
        data: options.data || {},
        header: header,
        success: function(res) {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(res.data)
          } else if (res.statusCode === 401) {
            getApp().refreshToken().then(function() {
              var newToken = wx.getStorageSync('token')
              header['Authorization'] = 'Bearer ' + newToken
              wx.request({
                url: config.baseUrl + options.url,
                method: options.method || 'GET',
                data: options.data || {},
                header: header,
                success: function(retryRes) {
                  if (retryRes.statusCode >= 200 && retryRes.statusCode < 300) {
                    resolve(retryRes.data)
                  } else {
                    var msg = (retryRes.data && retryRes.data.detail) || '请求失败'
                    wx.showToast({ title: msg, icon: 'none' })
                    reject(new Error(msg))
                  }
                },
                fail: function(retryErr) {
                  wx.showToast({ title: '网络错误', icon: 'none' })
                  reject(retryErr)
                }
              })
            }).catch(function() {
              reject(new Error('登录已过期'))
            })
          } else {
            var msg = (res.data && res.data.detail) || '请求失败'
            wx.showToast({ title: msg, icon: 'none' })
            reject(new Error(msg))
          }
        },
        fail: function(err) {
          wx.showToast({ title: '网络错误', icon: 'none' })
          reject(err)
        }
      })
    }

    doRequest()
  })
}

function get(url, data) {
  return request({ url: url, method: 'GET', data: data })
}

function post(url, data) {
  return request({ url: url, method: 'POST', data: data })
}

function put(url, data) {
  return request({ url: url, method: 'PUT', data: data })
}

function del(url, data) {
  return request({ url: url, method: 'DELETE', data: data })
}

module.exports = { request: request, get: get, post: post, put: put, del: del }
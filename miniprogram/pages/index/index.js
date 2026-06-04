const { get } = require('../../utils/request.js')
const { formatAmount, getCurrentMonth } = require('../../utils/format.js')
const app = getApp()

Page({
  data: {
    month: '',
    categorySummary: [],
    accountSummary: [],
    recentRecords: [],
    expandedAccount: null,
    accountRecords: [],
    loadingRecords: false,
    loading: true
  },

  onLoad: function() {
    this.setData({ month: getCurrentMonth() })
  },

  onShow: function() {
    var that = this
    if (app.globalData.ready) {
      that.loadOverview()
    } else {
      app.globalData.readyCallbacks.push(function() { that.loadOverview() })
    }
  },

  onPullDownRefresh: function() {
    var that = this
    this.loadOverview().then(function() { wx.stopPullDownRefresh() })
  },

  loadOverview: function() {
    var that = this
    this.setData({ loading: true })
    return get('/stats/overview', { month: this.data.month }).then(function(data) {
      that.setData({
        categorySummary: data.by_category || [],
        accountSummary: data.by_account || [],
        recentRecords: data.recent_records || [],
        loading: false
      })
    }).catch(function() {
      that.setData({ loading: false })
    })
  },

  toggleAccount: function(e) {
    var that = this
    var index = e.currentTarget.dataset.index
    var current = this.data.expandedAccount
    if (current === index) {
      this.setData({ expandedAccount: null, accountRecords: [] })
      return
    }
    this.setData({ expandedAccount: index, accountRecords: [], loadingRecords: true })
    get('/records', { account_id: e.currentTarget.dataset.id }).then(function(data) {
      var items = Array.isArray(data.items) ? data.items : (data.list || [])
      that.setData({ accountRecords: items, loadingRecords: false })
    }).catch(function() {
      that.setData({ loadingRecords: false })
    })
  },

  goSearchPage: function() {
    wx.navigateTo({ url: '/pages/stats/search/index' })
  },

  goSavedPage: function() {
    wx.navigateTo({ url: '/pages/stats/saved/index' })
  },

  goCompositePage: function() {
    wx.navigateTo({ url: '/pages/stats/composite/index' })
  },

  goRecordDetail: function(e) {
    var id = e.currentTarget.dataset.id
    var type = e.currentTarget.dataset.type
    var url = type === 1 ? '/pages/expense/edit/index' : '/pages/income/edit/index'
    wx.navigateTo({ url: url + '?id=' + id })
  }
})
const { get } = require('../../../utils/request.js')
const { formatAmount, getCurrentMonth } = require('../../../utils/format.js')
const app = getApp()

Page({
  data: {
    records: [],
    totalExpense: '0.00',
    page: 1,
    hasMore: true,
    loading: false,
    month: ''
  },

  onLoad: function() {
    this.setData({ month: getCurrentMonth() })
  },

  onShow: function() {
    var that = this
    if (app.globalData.ready) {
      that.refresh()
    } else {
      app.globalData.readyCallbacks.push(function() {
        that.refresh()
      })
    }
  },

  onPullDownRefresh: function() {
    var that = this
    this.refresh().then(function() { wx.stopPullDownRefresh() })
  },

  onReachBottom: function() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadMore()
    }
  },

  refresh: function() {
    this.setData({ page: 1, hasMore: true, records: [] })
    return this.loadRecords()
  },

  loadRecords: function() {
    var that = this
    this.setData({ loading: true })
    return get('/records', { type: 1, page: this.data.page }).then(function(data) {
      var records = data.items || data.records || data.list || []
      that.setData({
        records: that.data.page === 1 ? records : that.data.records.concat(records),
        totalExpense: formatAmount(data.total || 0),
        hasMore: records.length >= 20,
        loading: false
      })
    }).catch(function() {
      that.setData({ loading: false })
    })
  },

  loadMore: function() {
    var nextPage = this.data.page + 1
    this.setData({ page: nextPage })
    this.loadRecords()
  },

  goEdit: function(e) {
    var id = e.currentTarget.dataset.id
    wx.navigateTo({ url: '/pages/expense/edit/index' + (id ? '?id=' + id : '') })
  },

  goAdd: function() {
    wx.navigateTo({ url: '/pages/expense/edit/index' })
  }
})
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

  onLoad() {
    this.setData({ month: getCurrentMonth() })
  },

  onShow() {
    var that = this
    if (app.globalData.ready) {
      that.refresh()
    } else {
      app.globalData.readyCallbacks.push(function() {
        that.refresh()
      })
    }
  },

  onPullDownRefresh() {
    this.refresh().then(function() { wx.stopPullDownRefresh() })
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadMore()
    }
  },

  async refresh() {
    this.setData({ page: 1, hasMore: true, records: [] })
    await this.loadRecords()
  },

  async loadRecords() {
    this.setData({ loading: true })
    try {
      var data = await get('/records', { type: 1, page: this.data.page })
      var records = data.records || data.list || []
      this.setData({
        records: this.data.page === 1 ? records : this.data.records.concat(records),
        totalExpense: formatAmount(data.total || 0),
        hasMore: records.length >= 20,
        loading: false
      })
    } catch (err) {
      this.setData({ loading: false })
    }
  },

  loadMore() {
    var nextPage = this.data.page + 1
    this.setData({ page: nextPage })
    this.loadRecords()
  },

  goEdit(e) {
    var id = e.currentTarget.dataset.id
    wx.navigateTo({ url: '/pages/expense/edit/index' + (id ? '?id=' + id : '') })
  },

  goAdd() {
    wx.navigateTo({ url: '/pages/expense/edit/index' })
  }
})
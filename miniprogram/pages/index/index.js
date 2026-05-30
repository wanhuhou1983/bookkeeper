const { get } = require('../../utils/request.js')
const { formatAmount, getCurrentMonth } = require('../../utils/format.js')
const app = getApp()

Page({
  data: {
    month: '',
    totalExpense: '0.00',
    totalIncome: '0.00',
    balance: '0.00',
    categorySummary: [],
    accountSummary: [],
    recentRecords: [],
    loading: true
  },

  onLoad() {
    this.setData({ month: getCurrentMonth() })
  },

  onShow() {
    var that = this
    if (app.globalData.ready) {
      that.loadOverview()
    } else {
      app.globalData.readyCallbacks.push(function() {
        that.loadOverview()
      })
    }
  },

  onPullDownRefresh() {
    this.loadOverview().then(function() { wx.stopPullDownRefresh() })
  },

  async loadOverview() {
    this.setData({ loading: true })
    try {
      var data = await get('/stats/overview', { month: this.data.month })
      this.setData({
        totalExpense: formatAmount(data.month_expense),
        totalIncome: formatAmount(data.month_income),
        balance: formatAmount(data.month_balance),
        categorySummary: data.by_category || [],
        accountSummary: data.by_account || [],
        recentRecords: data.recent_records || [],
        loading: false
      })
    } catch (err) {
      this.setData({ loading: false })
    }
  },

  goSearchPage() {
    wx.navigateTo({ url: '/pages/stats/search/index' })
  },

  goSavedPage() {
    wx.navigateTo({ url: '/pages/stats/saved/index' })
  },

  goCompositePage() {
    wx.navigateTo({ url: '/pages/stats/composite/index' })
  },

  goRecordDetail(e) {
    var id = e.currentTarget.dataset.id
    var type = e.currentTarget.dataset.type
    var url = type === 1 ? '/pages/expense/edit/index' : '/pages/income/edit/index'
    wx.navigateTo({ url: url + '?id=' + id })
  }
})
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

  onLoad: function() {
    this.setData({ month: getCurrentMonth() })
  },

  onShow: function() {
    var that = this
    if (app.globalData.ready) {
      that.loadOverview()
    } else {
      app.globalData.readyCallbacks.push(function() {
        that.loadOverview()
      })
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
        totalExpense: formatAmount(data.month_expense),
        totalIncome: formatAmount(data.month_income),
        balance: formatAmount(data.month_balance),
        categorySummary: data.by_category || [],
        accountSummary: data.by_account || [],
        recentRecords: data.recent_records || [],
        loading: false
      })
    }).catch(function() {
      that.setData({ loading: false })
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

  goAccountDetail: function(e) {
    var id = e.currentTarget.dataset.id
    var name = e.currentTarget.dataset.name
    wx.showToast({ title: '账本: ' + name + ' (ID:' + id + ')', icon: 'none' })
  },

  goRecordDetail: function(e) {
    var id = e.currentTarget.dataset.id
    var type = e.currentTarget.dataset.type
    var url = type === 1 ? '/pages/expense/edit/index' : '/pages/income/edit/index'
    wx.navigateTo({ url: url + '?id=' + id })
  }
})
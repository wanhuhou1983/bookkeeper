const { get, post, del } = require('../../../utils/request.js')
const app = getApp()

var PRESET_EXPENSE = ['Shop', 'Transfer', 'Bonus', 'Interest']
var PRESET_INCOME = ['Transfer', 'Salary', 'Bonus', 'Interest', 'Profit', 'Loan']

Page({
  data: {
    expenseList: [],
    incomeList: [],
    showAdd: false,
    newName: '',
    newType: 1,
    loading: true,
    showPreset: false
  },

  onShow: function() {
    var that = this
    if (app.globalData.ready) {
      that.loadList()
    } else {
      app.globalData.readyCallbacks.push(function() { that.loadList() })
    }
  },

  loadList: function() {
    var that = this
    this.setData({ loading: true })
    get('/categories').then(function(data) {
      var list = Array.isArray(data) ? data : (data.list || [])
      var expenseList = list.filter(function(c) { return c.cat_type === 1 || c.cat_type == null })
      var incomeList = list.filter(function(c) { return c.cat_type === 2 })
      var showPreset = list.length === 0
      that.setData({ expenseList: expenseList, incomeList: incomeList, loading: false, showPreset: showPreset })
      app.globalData.configCache.categories = list
    }).catch(function() {
      that.setData({ loading: false })
    })
  },

  initPresets: function() {
    var that = this
    wx.showLoading({ title: 'Initializing...' })
    var requests = []
    PRESET_EXPENSE.forEach(function(name) {
      requests.push(post('/categories', { name: name, cat_type: 1 }))
    })
    PRESET_INCOME.forEach(function(name) {
      requests.push(post('/categories', { name: name, cat_type: 2 }))
    })
    Promise.all(requests).then(function() {
      wx.hideLoading()
      wx.showToast({ title: 'Presets added', icon: 'success' })
      that.loadList()
    }).catch(function() {
      wx.hideLoading()
    })
  },

  onAddClick: function() {
    this.setData({ showAdd: true, newName: '', newType: 1 })
  },

  onNameInput: function(e) {
    this.setData({ newName: e.detail })
  },

  onTypeChange: function(e) {
    var val = e.detail
    this.setData({ newType: typeof val === 'number' ? val : parseInt(val) || 1 })
  },

  onAddConfirm: function() {
    var that = this
    var name = this.data.newName.trim()
    if (!name) {
      wx.showToast({ title: 'Enter name', icon: 'none' })
      return
    }
    post('/categories', { name: name, cat_type: this.data.newType }).then(function() {
      that.setData({ showAdd: false, newName: '' })
      wx.showToast({ title: 'Added', icon: 'success' })
      that.loadList()
    }).catch(function() {})
  },

  onAddCancel: function() {
    this.setData({ showAdd: false, newName: '' })
  },

  onDelete: function(e) {
    var that = this
    var id = e.currentTarget.dataset.id
    var name = e.currentTarget.dataset.name
    wx.showModal({
      title: 'Confirm delete',
      content: 'Delete "' + name + '"?',
      success: function(res) {
        if (res.confirm) {
          del('/categories/' + id).then(function() {
            wx.showToast({ title: 'Deleted', icon: 'success' })
            that.loadList()
          }).catch(function() {})
        }
      }
    })
  }
})
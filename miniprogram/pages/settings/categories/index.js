const { get, post, del } = require('../../../utils/request.js')
const app = getApp()

var PRESET_EXPENSE = ['消费', '转账', '分红', '利息']
var PRESET_INCOME = ['转账', '工资', '分红', '利息', '盈利']

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
    wx.showLoading({ title: '初始化中...' })
    var requests = []
    PRESET_EXPENSE.forEach(function(name) {
      requests.push(post('/categories', { name: name, cat_type: 1 }))
    })
    PRESET_INCOME.forEach(function(name) {
      requests.push(post('/categories', { name: name, cat_type: 2 }))
    })
    Promise.all(requests).then(function() {
      wx.hideLoading()
      wx.showToast({ title: '预设分类已添加', icon: 'success' })
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
    this.setData({ newType: parseInt(e.detail.value) })
  },

  onAddConfirm: function() {
    var that = this
    var name = this.data.newName.trim()
    if (!name) {
      wx.showToast({ title: '请输入名称', icon: 'none' })
      return
    }
    post('/categories', { name: name, cat_type: this.data.newType }).then(function() {
      that.setData({ showAdd: false, newName: '' })
      wx.showToast({ title: '添加成功', icon: 'success' })
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
      title: '确认删除',
      content: '确定删除类目"' + name + '"吗？',
      success: function(res) {
        if (res.confirm) {
          del('/categories/' + id).then(function() {
            wx.showToast({ title: '删除成功', icon: 'success' })
            that.loadList()
          }).catch(function() {})
        }
      }
    })
  }
})
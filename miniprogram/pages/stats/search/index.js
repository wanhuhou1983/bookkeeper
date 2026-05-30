const { post } = require('../../../utils/request.js')
const { formatAmount } = require('../../../utils/format.js')
const app = getApp()

Page({
  data: {
    form: {
      date_start: '',
      date_end: '',
      account_ids: [],
      category_ids: [],
      channel_ids: [],
      bank_ids: []
    },
    accounts: [],
    categories: [],
    channels: [],
    banks: [],
    resultAmount: '',
    resultCount: '',
    hasResult: false,
    saving: false,
    showSaveDialog: false,
    saveName: '',
    submitting: false,
    ready: false
  },

  onLoad: function() {
    var that = this
    if (app.globalData.ready) {
      that._initFilters()
    } else {
      app.globalData.readyCallbacks.push(function() { that._initFilters() })
    }
  },

  _initFilters: function() {
    var cache = app.globalData.configCache
    this.setData({
      accounts: cache.accounts || [],
      categories: cache.categories || [],
      channels: cache.channels || [],
      banks: cache.banks || [],
      ready: true
    })
  },

  onDateStartChange: function(e) {
    this.setData({ 'form.date_start': e.detail.value })
  },

  onDateEndChange: function(e) {
    this.setData({ 'form.date_end': e.detail.value })
  },

  onAccountToggle: function(e) {
    var id = Number(e.currentTarget.dataset.id)
    var ids = this.data.form.account_ids.slice()
    var idx = -1
    for (var i = 0; i < ids.length; i++) {
      if (ids[i] === id) { idx = i; break }
    }
    if (idx >= 0) { ids.splice(idx, 1) }
    else { ids.push(id) }
    this.setData({ 'form.account_ids': ids })
  },

  onCategoryToggle: function(e) {
    var id = Number(e.currentTarget.dataset.id)
    var ids = this.data.form.category_ids.slice()
    var idx = -1
    for (var i = 0; i < ids.length; i++) {
      if (ids[i] === id) { idx = i; break }
    }
    if (idx >= 0) { ids.splice(idx, 1) }
    else { ids.push(id) }
    this.setData({ 'form.category_ids': ids })
  },

  onChannelToggle: function(e) {
    var id = Number(e.currentTarget.dataset.id)
    var ids = this.data.form.channel_ids.slice()
    var idx = -1
    for (var i = 0; i < ids.length; i++) {
      if (ids[i] === id) { idx = i; break }
    }
    if (idx >= 0) { ids.splice(idx, 1) }
    else { ids.push(id) }
    this.setData({ 'form.channel_ids': ids })
  },

  onBankToggle: function(e) {
    var id = Number(e.currentTarget.dataset.id)
    var ids = this.data.form.bank_ids.slice()
    var idx = -1
    for (var i = 0; i < ids.length; i++) {
      if (ids[i] === id) { idx = i; break }
    }
    if (idx >= 0) { ids.splice(idx, 1) }
    else { ids.push(id) }
    this.setData({ 'form.bank_ids': ids })
  },

  onQuery: function() {
    var that = this
    this.setData({ submitting: true })
    var body = { filters: this.data.form }
    post('/stats/query', body).then(function(data) {
      that.setData({
        resultAmount: formatAmount(data.total || 0),
        resultCount: data.count || 0,
        hasResult: true,
        submitting: false
      })
    }).catch(function() {
      that.setData({ submitting: false })
    })
  },

  onSaveClick: function() {
    this.setData({ showSaveDialog: true, saveName: '' })
  },

  onSaveNameInput: function(e) {
    this.setData({ saveName: e.detail })
  },

  onSaveConfirm: function() {
    var that = this
    var name = this.data.saveName.trim()
    if (!name) {
      wx.showToast({ title: '请输入名称', icon: 'none' })
      return
    }
    this.setData({ saving: true })
    post('/saved-searches', { name: name, filters: this.data.form }).then(function() {
      that.setData({ showSaveDialog: false, saving: false })
      wx.showToast({ title: '保存成功', icon: 'success' })
    }).catch(function() {
      that.setData({ saving: false })
    })
  },

  onSaveCancel: function() {
    this.setData({ showSaveDialog: false })
  }
})
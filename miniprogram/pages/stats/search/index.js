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
    submitting: false
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
    var accounts = (cache.accounts || []).map(function(a) {
      return { id: a.id, name: a.name, selected: false }
    })
    var categories = (cache.categories || []).map(function(c) {
      return { id: c.id, name: c.name, selected: false }
    })
    var channels = (cache.channels || []).map(function(ch) {
      return { id: ch.id, name: ch.name, selected: false }
    })
    var banks = (cache.banks || []).map(function(b) {
      return { id: b.id, name: b.name, selected: false }
    })
    console.log('search cache:', { a: accounts.length, c: categories.length, ch: channels.length, b: banks.length })
    this.setData({
      accounts: accounts,
      categories: categories,
      channels: channels,
      banks: banks
    })
  },

  onDateStartChange: function(e) {
    this.setData({ 'form.date_start': e.detail.value })
  },

  onDateEndChange: function(e) {
    this.setData({ 'form.date_end': e.detail.value })
  },

  _toggleFilter: function(listName, idsKey, e) {
    var index = e.currentTarget.dataset.index
    var list = this.data[listName]
    var item = list[index]
    if (!item) return

    var newSelected = !item.selected
    var updateData = {}
    updateData[listName + '[' + index + '].selected'] = newSelected
    this.setData(updateData)

    var ids = this.data.form[idsKey].slice()
    var pos = -1
    for (var i = 0; i < ids.length; i++) {
      if (ids[i] === item.id) { pos = i; break }
    }
    if (pos >= 0) {
      ids.splice(pos, 1)
    } else {
      ids.push(item.id)
    }
    var formUpdate = {}
    formUpdate['form.' + idsKey] = ids
    this.setData(formUpdate)
  },

  onAccountToggle: function(e) {
    this._toggleFilter('accounts', 'account_ids', e)
  },

  onCategoryToggle: function(e) {
    this._toggleFilter('categories', 'category_ids', e)
  },

  onChannelToggle: function(e) {
    this._toggleFilter('channels', 'channel_ids', e)
  },

  onBankToggle: function(e) {
    this._toggleFilter('banks', 'bank_ids', e)
  },

  onQuery: function() {
    var that = this
    this.setData({ submitting: true })
    var filters = {
      type: null,
      date_from: this.data.form.date_start || null,
      date_to: this.data.form.date_end || null,
      account_ids: this.data.form.account_ids,
      category_ids: this.data.form.category_ids,
      channel_ids: this.data.form.channel_ids,
      bank_ids: this.data.form.bank_ids
    }
    post('/stats/query', { filters: filters }).then(function(data) {
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
      wx.showToast({ title: 'Please enter name', icon: 'none' })
      return
    }
    this.setData({ saving: true })
    var filters = { type: null, date_from: this.data.form.date_start || null, date_to: this.data.form.date_end || null, account_ids: this.data.form.account_ids, category_ids: this.data.form.category_ids, channel_ids: this.data.form.channel_ids, bank_ids: this.data.form.bank_ids }; post('/saved-searches', { name: name, filters: filters }).then(function() {
      that.setData({ showSaveDialog: false, saving: false })
      wx.showToast({ title: 'Saved', icon: 'success' })
    }).catch(function() {
      that.setData({ saving: false })
    })
  },

  onSaveCancel: function() {
    this.setData({ showSaveDialog: false })
  }
})
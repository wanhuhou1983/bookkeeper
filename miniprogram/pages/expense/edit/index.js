const { get, post, put, del } = require('../../../utils/request.js')
const { getToday } = require('../../../utils/format.js')
const app = getApp()

Page({
  data: {
    isEdit: false,
    id: '',
    form: {
      date: '',
      amount: '',
      account_ids: [],
      category_id: '',
      channel_id: '',
      bank_id: '',
      note: ''
    },
    accounts: [],
    categories: [],
    expenseCategories: [],
    incomeCategories: [],
    categoryList: [],
    channels: [],
    banks: [],
    accountNames: [],
    categoryNames: [],
    channelNames: [],
    bankNames: [],
    selectedAccounts: [],
    showAccountPicker: false,
    categoryIndex: 0,
    channelIndex: 0,
    bankIndex: 0,
    submitting: false,
    recordType: 1,
    ready: false
  },

  noop: function() {},

  onLoad: function(options) {
    var that = this
    if (app.globalData.ready) {
      that._doInit(options)
    } else {
      app.globalData.readyCallbacks.push(function() {
        that._doInit(options)
      })
    }
  },

  _doInit: function(options) {
    var that = this
    this.initPickers().then(function() {
      that.setData({
        selectedAccounts: [],
        'form.account_ids': []
      })
      if (options.id) {
        that.setData({ isEdit: true, id: options.id })
        that.loadRecord(options.id)
      }
      that.setData({ ready: true })
    })
  },

  initPickers: function() {
    var that = this
    return new Promise(function(resolve) {
      var cache = app.globalData.configCache
      var accounts = cache.accounts || []
      var categories = cache.categories || []
      var channels = cache.channels || []
      var banks = cache.banks || []
      var expenseCategories = categories.filter(function(c) { return c.cat_type === 1 || c.cat_type == null })
      var incomeCategories = categories.filter(function(c) { return c.cat_type === 2 })
      var categoryList = that.data.recordType === 1 ? expenseCategories : incomeCategories
      var categoryPickerNames = ['None'].concat(categoryList.map(function(c) { return c.name }));
      var channelPickerNames = ['None'].concat(channels.map(function(c) { return c.name }));
      var bankPickerNames = ['None'].concat(banks.map(function(b) { return b.name }));
      that.setData({
        accounts: accounts,
        categories: categories,
        expenseCategories: expenseCategories,
        incomeCategories: incomeCategories,
        categoryList: categoryList,
        channels: channels,
        banks: banks,
        accountNames: accounts.map(function(a) { return a.name }),
        categoryNames: categoryList.map(function(c) { return c.name }),
        channelNames: channels.map(function(c) { return c.name }),
        bankNames: banks.map(function(b) { return b.name }),
        categoryPickerNames: categoryPickerNames,
        channelPickerNames: channelPickerNames,
        bankPickerNames: bankPickerNames,
        'form.date': getToday()
      }, function() {
        // setData 完成后更新索引
        that.setData({
          categoryIndex: 0,
          channelIndex: 0,
          bankIndex: 0,
          'form.category_id': '',
          'form.channel_id': '',
          'form.bank_id': ''
        }, function() { resolve() })
      })
    })
  },

  loadRecord: function(id) {
    var that = this
    return get('/records/' + id).then(function(data) {
      var accountIds = Array.isArray(data.account_ids)
        ? data.account_ids
        : (data.account_id ? [data.account_id] : [])
      var selectedAccounts = accountIds.map(function(aid) {
        var acc = that.data.accounts.find(function(a) { return a.id === aid })
        return { id: aid, name: acc ? acc.name : '' }
      })
      var catIdx = that.data.categoryList.findIndex(function(c) { return c.id === data.category_id }) + 1
      var chIdx = that.data.channels.findIndex(function(c) { return c.id === data.channel_id }) + 1
      var bkIdx = that.data.banks.findIndex(function(b) { return b.id === data.bank_id }) + 1
      that.setData({
        form: {
          date: data.record_date || data.date || '',
          amount: String(data.amount || ''),
          account_ids: accountIds,
          category_id: data.category_id || '',
          channel_id: data.channel_id || '',
          bank_id: data.bank_id || '',
          note: data.note || ''
        },
        selectedAccounts: selectedAccounts,
        categoryIndex: catIdx >= 0 ? catIdx : 0,
        channelIndex: chIdx >= 0 ? chIdx : 0,
        bankIndex: bkIdx >= 0 ? bkIdx : 0
      })
    }).catch(function() {
      wx.showToast({ title: '加载失败', icon: 'none' })
    })
  },

  onDateChange: function(e) {
    this.setData({ 'form.date': e.detail.value })
  },

  onAmountInput: function(e) {
    this.setData({ 'form.amount': e.detail.value })
  },

  onNoteInput: function(e) {
    var val = e.detail.value
    if (val === undefined || val === null) val = ''
    this.setData({ 'form.note': val })
  },

  onShowAccountPicker: function() {
    var ids = this.data.form.account_ids
    var accounts = this.data.accounts.slice()
    accounts.forEach(function(a) {
      a.selected = ids.indexOf(a.id) >= 0
    })
    this.setData({ showAccountPicker: true, accounts: accounts })
  },

  onCloseAccountPicker: function() {
    this.setData({ showAccountPicker: false })
  },

  onAccountCheckbox: function(e) {
    var id = e.currentTarget.dataset.id
    var ids = this.data.form.account_ids.slice()
    var pos = ids.indexOf(id)
    if (pos >= 0) {
      ids.splice(pos, 1)
    } else {
      ids.push(id)
    }
    this.setData({ 'form.account_ids': ids })
    // Update accounts selected state for checkbox display
    var accounts = this.data.accounts.slice()
    var that = this
    var selected = []
    accounts.forEach(function(a) {
      a.selected = ids.indexOf(a.id) >= 0
      if (a.selected) selected.push({ id: a.id, name: a.name })
    })
    this.setData({ accounts: accounts, selectedAccounts: selected })
  },

  onAccountRemove: function(e) {
    var index = e.currentTarget.dataset.index
    var selected = this.data.selectedAccounts.slice()
    selected.splice(index, 1)
    this.setData({
      selectedAccounts: selected,
      'form.account_ids': selected.map(function(a) { return a.id })
    })
  },

  onCategoryConfirm: function(e) {
    var val = parseInt(e.detail.value)
    if (val <= 0) {
      this.setData({ categoryIndex: 0, 'form.category_id': '' })
    } else {
      var realIdx = val - 1
      this.setData({ categoryIndex: val, 'form.category_id': this.data.categoryList[realIdx] ? this.data.categoryList[realIdx].id : '' })
    }
  },

  onChannelConfirm: function(e) {
    var val = parseInt(e.detail.value)
    if (val <= 0) {
      this.setData({ channelIndex: 0, 'form.channel_id': '' })
    } else {
      var realIdx = val - 1
      this.setData({ channelIndex: val, 'form.channel_id': this.data.channels[realIdx] ? this.data.channels[realIdx].id : '' })
    }
  },

  onBankConfirm: function(e) {
    var val = parseInt(e.detail.value)
    if (val <= 0) {
      this.setData({ bankIndex: 0, 'form.bank_id': '' })
    } else {
      var realIdx = val - 1
      this.setData({ bankIndex: val, 'form.bank_id': this.data.banks[realIdx] ? this.data.banks[realIdx].id : '' })
    }
  },

  onDelete: function() {
    var that = this
    wx.showModal({
      title: '确认删除',
      content: '确定删除这条记录吗？',
      success: function(res) {
        if (res.confirm) {
          del('/records/' + that.data.id).then(function() {
            wx.showToast({ title: '删除成功', icon: 'success' })
            setTimeout(function() { wx.navigateBack() }, 1000)
          }).catch(function() {})
        }
      }
    })
  },

  onCopy: function() {
    var that = this
    wx.showModal({
      title: 'Copy record',
      content: 'Create a copy with today\'s date?',
      success: function(res) {
        if (res.confirm) {
          post('/records/' + that.data.id + '/copy').then(function() {
            wx.showToast({ title: 'Copied', icon: 'success' })
            setTimeout(function() { wx.navigateBack() }, 1000)
          }).catch(function() {})
        }
      }
    })
  },

  onSubmit: function() {
    var form = this.data.form
    var that = this
    if (!form.amount || parseFloat(form.amount) <= 0) {
      wx.showToast({ title: '请输入金额', icon: 'none' })
      return
    }
    if (!form.date) {
      wx.showToast({ title: '请选择日期', icon: 'none' })
      return
    }
    if (!form.account_ids || form.account_ids.length === 0) {
      wx.showToast({ title: '请选择账本', icon: 'none' })
      return
    }
    this.setData({ submitting: true })
    var payload = {
      record_date: form.date,
      amount: parseFloat(form.amount),
      category_id: form.category_id || null,
      channel_id: form.channel_id || null,
      bank_id: form.bank_id || null,
      note: form.note || '',
      type: this.data.recordType
    }
    var savePromise
    if (this.data.isEdit) {
      payload.account_id = form.account_ids[0];
      savePromise = put('/records/' + this.data.id, payload)
    } else {
      var requests = form.account_ids.map(function(accountId) {
        var p = Object.assign({}, payload, { account_id: accountId })
        return post('/records', p)
      })
      savePromise = Promise.all(requests)
    }
    savePromise.then(function() {
      wx.showToast({ title: that.data.isEdit ? '修改成功' : '添加成功', icon: 'success' })
      setTimeout(function() { wx.navigateBack() }, 1000)
    }).finally(function() {
      that.setData({ submitting: false })
    })
  }
})
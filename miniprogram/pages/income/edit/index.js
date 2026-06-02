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
    categoryIndex: 0,
    channelIndex: 0,
    bankIndex: 0,
    submitting: false,
    recordType: 2,
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
      if (that.data.accounts.length > 0) {
        var first = that.data.accounts[0]
        that.setData({
          selectedAccounts: [{ id: first.id, name: first.name }],
          'form.account_ids': [first.id]
        })
      }
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
        'form.date': getToday()
      }, function() {
        // setData 瀹屾垚鍚庢洿鏂扮储寮?        that.setData({
          categoryIndex: categoryList.length > 0 ? 0 : 0,
          channelIndex: channels.length > 0 ? 0 : 0,
          bankIndex: banks.length > 0 ? 0 : 0,
          'form.category_id': categoryList.length > 0 ? categoryList[0].id : '',
          'form.channel_id': channels.length > 0 ? channels[0].id : '',
          'form.bank_id': banks.length > 0 ? banks[0].id : ''
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
      var catIdx = that.data.categoryList.findIndex(function(c) { return c.id === data.category_id })
      var chIdx = that.data.channels.findIndex(function(c) { return c.id === data.channel_id })
      var bkIdx = that.data.banks.findIndex(function(b) { return b.id === data.bank_id })
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
      wx.showToast({ title: '鍔犺浇澶辫触', icon: 'none' })
    })
  },

  onDateChange: function(e) {
    this.setData({ 'form.date': e.detail.value })
  },

  onAmountInput: function(e) {
    this.setData({ 'form.amount': e.detail.value })
  },

  onNoteInput: function(e) {
    this.setData({ 'form.note': e.detail.value || e.detail })
  },

  onAccountAdd: function(e) {
    var val = e.detail.value
    var account = this.data.accounts[val]
    if (!account) return
    var selectedIds = this.data.selectedAccounts.map(function(a) { return a.id })
    if (selectedIds.indexOf(account.id) !== -1) {
      wx.showToast({ title: '璇ヨ处鏈凡閫夋嫨', icon: 'none' })
      return
    }
    var selected = this.data.selectedAccounts.slice()
    selected.push({ id: account.id, name: account.name })
    this.setData({
      selectedAccounts: selected,
      'form.account_ids': selected.map(function(a) { return a.id })
    })
  },

  onAccountRemove: function(e) {
    var index = e.currentTarget.dataset.index
    var selected = this.data.selectedAccounts.slice()
    if (selected.length <= 1) {
      wx.showToast({ title: '鑷冲皯淇濈暀涓€涓处鏈?, icon: 'none' })
      return
    }
    selected.splice(index, 1)
    this.setData({
      selectedAccounts: selected,
      'form.account_ids': selected.map(function(a) { return a.id })
    })
  },

  onCategoryConfirm: function(e) {
    var val = parseInt(e.detail.value)
    this.setData({
      categoryIndex: val,
      'form.category_id': this.data.categoryList[val] ? this.data.categoryList[val].id : ''
    })
  },

  onChannelConfirm: function(e) {
    var val = parseInt(e.detail.value)
    this.setData({
      channelIndex: val,
      'form.channel_id': this.data.channels[val] ? this.data.channels[val].id : ''
    })
  },

  onBankConfirm: function(e) {
    var val = parseInt(e.detail.value)
    this.setData({
      bankIndex: val,
      'form.bank_id': this.data.banks[val] ? this.data.banks[val].id : ''
    })
  },

  onDelete: function() {
    var that = this
    wx.showModal({
      title: '纭鍒犻櫎',
      content: '纭畾鍒犻櫎杩欐潯璁板綍鍚楋紵',
      success: function(res) {
        if (res.confirm) {
          del('/records/' + that.data.id).then(function() {
            wx.showToast({ title: '鍒犻櫎鎴愬姛', icon: 'success' })
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
      wx.showToast({ title: '璇疯緭鍏ラ噾棰?, icon: 'none' })
      return
    }
    if (!form.date) {
      wx.showToast({ title: '璇烽€夋嫨鏃ユ湡', icon: 'none' })
      return
    }
    if (!form.account_ids || form.account_ids.length === 0) {
      wx.showToast({ title: '璇烽€夋嫨璐︽湰', icon: 'none' })
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
      payload.account_id = form.account_ids[0]
      savePromise = put('/records/' + this.data.id, payload)
    } else {
      var requests = form.account_ids.map(function(accountId) {
        var p = Object.assign({}, payload, { account_id: accountId })
        return post('/records', p)
      })
      savePromise = Promise.all(requests)
    }
    savePromise.then(function() {
      wx.showToast({ title: that.data.isEdit ? '淇敼鎴愬姛' : '娣诲姞鎴愬姛', icon: 'success' })
      setTimeout(function() { wx.navigateBack() }, 1000)
    }).finally(function() {
      that.setData({ submitting: false })
    })
  }
})
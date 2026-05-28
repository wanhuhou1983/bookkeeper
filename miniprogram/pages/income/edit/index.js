const { get, post, put } = require('../../../utils/request.js')
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
    availableAccounts: [],
    categoryIndex: -1,
    channelIndex: -1,
    bankIndex: -1,
    submitting: false,
    recordType: 2
  },

  onLoad(options) {
    this.initPickers().then(() => {
      if (this.data.accounts.length > 0) {
        var first = this.data.accounts[0]
        this.setData({
          selectedAccounts: [{ id: first.id, name: first.name }],
          'form.account_ids': [first.id]
        })
      } else {
        this.setData({
          selectedAccounts: [{ id: '', name: '' }],
          'form.account_ids': ['']
        })
      }

      if (options.id) {
        this.setData({ isEdit: true, id: options.id })
        this.loadRecord(options.id)
      }
    })
  },

  initPickers() {
    return new Promise((resolve) => {
      var cache = app.globalData.configCache
      var accounts = cache.accounts || []
      var categories = cache.categories || []
      var channels = cache.channels || []
      var banks = cache.banks || []
      var expenseCategories = categories.filter(function(c) { return c.cat_type === 1 || c.cat_type == null })
      var incomeCategories = categories.filter(function(c) { return c.cat_type === 2 })
      var categoryList = this.data.recordType === 1 ? expenseCategories : incomeCategories

      this.setData({
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
      }, function() { resolve() })
    })
  },

  async loadRecord(id) {
    try {
      var data = await get('/records/' + id)
      var accountIds = Array.isArray(data.account_ids)
        ? data.account_ids
        : (data.account_id ? [data.account_id] : [])

      var selectedAccounts = accountIds.map(function(aid) {
        var acc = this.data.accounts.find(function(a) { return a.id === aid })
        return { id: aid, name: acc ? acc.name : '' }
      }.bind(this))

      this.setData({
        form: {
          date: data.date || '',
          amount: String(data.amount || ''),
          account_ids: accountIds,
          category_id: data.category_id || '',
          channel_id: data.channel_id || '',
          bank_id: data.bank_id || '',
          note: data.note || ''
        },
        selectedAccounts: selectedAccounts,
        categoryIndex: this.data.categoryList.findIndex(function(c) { return c.id === data.category_id }),
        channelIndex: this.data.channels.findIndex(function(c) { return c.id === data.channel_id }),
        bankIndex: this.data.banks.findIndex(function(b) { return b.id === data.bank_id })
      })
    } catch (err) {
      wx.showToast({ title: '加载失败', icon: 'none' })
    }
  },

  onDateChange(e) {
    this.setData({ 'form.date': e.detail.value })
  },

  onAmountInput(e) {
    this.setData({ 'form.amount': e.detail })
  },

  onNoteInput(e) {
    this.setData({ 'form.note': e.detail })
  },

  onAccountPickerOpen() {
    var selectedIds = this.data.selectedAccounts.map(function(a) { return a.id })
    var available = this.data.accounts.filter(function(a) { return selectedIds.indexOf(a.id) === -1 })
    this.setData({ showAccountPicker: true, availableAccounts: available })
  },

  onAccountPickerClose() {
    this.setData({ showAccountPicker: false })
  },

  onAccountSelect(e) {
    var index = e.currentTarget.dataset.index
    var account = this.data.availableAccounts[index]
    if (!account) return
    var selected = this.data.selectedAccounts.slice()
    selected.push({ id: account.id, name: account.name })
    this.setData({
      selectedAccounts: selected,
      'form.account_ids': selected.map(function(a) { return a.id }),
      showAccountPicker: false
    })
  },

  onAccountRemove(e) {
    var index = e.currentTarget.dataset.index
    var selected = this.data.selectedAccounts.slice()
    if (selected.length <= 1) {
      wx.showToast({ title: '至少保留一个账本', icon: 'none' })
      return
    }
    selected.splice(index, 1)
    this.setData({
      selectedAccounts: selected,
      'form.account_ids': selected.map(function(a) { return a.id })
    })
  },

  onCategoryConfirm(e) {
    var index = e.detail.index
    this.setData({
      categoryIndex: index,
      'form.category_id': this.data.categoryList[index] ? this.data.categoryList[index].id : ''
    })
  },

  onChannelConfirm(e) {
    var index = e.detail.index
    this.setData({
      channelIndex: index,
      'form.channel_id': this.data.channels[index] ? this.data.channels[index].id : ''
    })
  },

  onBankConfirm(e) {
    var index = e.detail.index
    this.setData({
      bankIndex: index,
      'form.bank_id': this.data.banks[index] ? this.data.banks[index].id : ''
    })
  },

  async onSubmit() {
    var form = this.data.form
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
    try {
      var basePayload = {
        date: form.date,
        amount: parseFloat(form.amount),
        category_id: form.category_id || null,
        channel_id: form.channel_id || null,
        bank_id: form.bank_id || null,
        note: form.note || '',
        type: this.data.recordType
      }

      if (this.data.isEdit) {
        await put('/records/' + this.data.id, basePayload)
        wx.showToast({ title: '修改成功', icon: 'success' })
      } else {
        var requests = form.account_ids.map(function(accountId) {
          return post('/records', Object.assign({}, basePayload, { account_id: accountId }))
        })
        await Promise.all(requests)
        wx.showToast({ title: '添加成功', icon: 'success' })
      }
      setTimeout(function() { wx.navigateBack() }, 1000)
    } catch (err) {
    } finally {
      this.setData({ submitting: false })
    }
  }
})
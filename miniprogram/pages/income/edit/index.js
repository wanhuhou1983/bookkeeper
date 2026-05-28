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
        const first = this.data.accounts[0]
        this.setData({
          selectedAccounts: [{ id: first.id, name: first.name }],
          'form.account_ids': [first.id]
        })
      } else {
        this.setData({
          selectedAccounts: [{ id: '', name: '鏈垎绫? }],
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
      const { accounts, categories, channels, banks } = app.globalData.configCache
      const expenseCategories = (categories || []).filter(c => c.cat_type === 1 || c.cat_type == null)
      const incomeCategories = (categories || []).filter(c => c.cat_type === 2)
      const categoryList = this.data.recordType === 1 ? expenseCategories : incomeCategories

      this.setData({
        accounts: accounts || [],
        categories: categories || [],
        expenseCategories,
        incomeCategories,
        categoryList,
        channels: channels || [],
        banks: banks || [],
        accountNames: (accounts || []).map(a => a.name),
        categoryNames: categoryList.map(c => c.name),
        channelNames: (channels || []).map(c => c.name),
        bankNames: (banks || []).map(b => b.name),
        'form.date': getToday()
      }, () => resolve())
    })
  },

  async loadRecord(id) {
    try {
      const data = await get('/records/' + id)
      const accountIds = Array.isArray(data.account_ids)
        ? data.account_ids
        : (data.account_id ? [data.account_id] : [])

      const selectedAccounts = accountIds.map(aid => {
        const acc = this.data.accounts.find(a => a.id === aid)
        return { id: aid, name: acc ? acc.name : '鏈煡璐︽湰' }
      })

      const form = {
        date: data.date || '',
        amount: String(data.amount || ''),
        account_ids: accountIds,
        category_id: data.category_id || '',
        channel_id: data.channel_id || '',
        bank_id: data.bank_id || '',
        note: data.note || ''
      }

      this.setData({
        form,
        selectedAccounts,
        categoryIndex: this.data.categoryList.findIndex(c => c.id === data.category_id),
        channelIndex: this.data.channels.findIndex(c => c.id === data.channel_id),
        bankIndex: this.data.banks.findIndex(b => b.id === data.bank_id)
      })
    } catch (err) {
      wx.showToast({ title: '鍔犺浇澶辫触', icon: 'none' })
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
    const selectedIds = this.data.selectedAccounts.map(a => a.id)
    const available = this.data.accounts.filter(a => !selectedIds.includes(a.id))
    this.setData({ showAccountPicker: true, availableAccounts: available })
  },

  onAccountPickerClose() {
    this.setData({ showAccountPicker: false })
  },

  onAccountSelect(e) {
    const index = e.currentTarget.dataset.index
    const account = this.data.availableAccounts[index]
    if (!account) return

    const selected = this.data.selectedAccounts.slice()
    selected.push({ id: account.id, name: account.name })
    const ids = selected.map(a => a.id)
    this.setData({
      selectedAccounts: selected,
      'form.account_ids': ids,
      showAccountPicker: false
    })
  },

  onAccountRemove(e) {
    const index = e.currentTarget.dataset.index
    const selected = this.data.selectedAccounts.slice()
    if (selected.length <= 1) {
      wx.showToast({ title: '鑷冲皯淇濈暀涓€涓处鏈?, icon: 'none' })
      return
    }
    selected.splice(index, 1)
    const ids = selected.map(a => a.id)
    this.setData({
      selectedAccounts: selected,
      'form.account_ids': ids
    })
  },

  onCategoryConfirm(e) {
    const index = e.detail.index
    this.setData({
      categoryIndex: index,
      'form.category_id': this.data.categoryList[index]?.id || ''
    })
  },

  onChannelConfirm(e) {
    const index = e.detail.index
    this.setData({
      channelIndex: index,
      'form.channel_id': this.data.channels[index]?.id || ''
    })
  },

  onBankConfirm(e) {
    const index = e.detail.index
    this.setData({
      bankIndex: index,
      'form.bank_id': this.data.banks[index]?.id || ''
    })
  },

  async onSubmit() {
    const { form } = this.data
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
    try {
      const basePayload = {
        date: form.date,
        amount: parseFloat(form.amount),
        category_id: form.category_id || null,
        channel_id: form.channel_id || null,
        bank_id: form.bank_id || null,
        note: form.note || '',
        type: this.data.recordType
      }

      if (this.data.isEdit) {
        await put('/records/' + this.data.id, {
          ...basePayload,
          account_ids: form.account_ids
        })
        wx.showToast({ title: '淇敼鎴愬姛', icon: 'success' })
      } else {
        const requests = form.account_ids.map(accountId =>
          post('/records', { ...basePayload, account_id: accountId })
        )
        await Promise.all(requests)
        wx.showToast({ title: '娣诲姞鎴愬姛', icon: 'success' })
      }
      setTimeout(() => wx.navigateBack(), 1000)
    } catch (err) {
      // request.js already shows error toast
    } finally {
      this.setData({ submitting: false })
    }
  }
})
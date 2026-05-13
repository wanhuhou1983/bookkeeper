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
      account_id: '',
      category_id: '',
      channel_id: '',
      bank_id: '',
      note: ''
    },
    accounts: [],
    categories: [],
    channels: [],
    banks: [],
    showBankPicker: false,
    accountNames: [],
    categoryNames: [],
    channelNames: [],
    bankNames: [],
    accountIndex: -1,
    categoryIndex: -1,
    channelIndex: -1,
    bankIndex: -1,
    submitting: false
  },

  onLoad(options) {
    const date = getToday()
    this.setData({ 'form.date': date })

    if (options.id) {
      this.setData({ isEdit: true, id: options.id })
      this.loadRecord(options.id)
    }

    this.initPickers()
  },

  initPickers() {
    const { accounts, categories, channels, banks } = app.globalData.configCache
    this.setData({
      accounts,
      categories,
      channels,
      banks,
      accountNames: accounts.map(a => a.name),
      categoryNames: categories.map(c => c.name),
      channelNames: channels.map(c => c.name),
      bankNames: banks.map(b => b.name)
    })
  },

  async loadRecord(id) {
    try {
      const data = await get('/records/' + id)
      const form = {
        date: data.date || '',
        amount: String(data.amount || ''),
        account_id: data.account_id || '',
        category_id: data.category_id || '',
        channel_id: data.channel_id || '',
        bank_id: data.bank_id || '',
        note: data.note || ''
      }
      this.setData({
        form,
        accountIndex: this.data.accounts.findIndex(a => a.id === data.account_id),
        categoryIndex: this.data.categories.findIndex(c => c.id === data.category_id),
        channelIndex: this.data.channels.findIndex(c => c.id === data.channel_id),
        bankIndex: this.data.banks.findIndex(b => b.id === data.bank_id),
        showBankPicker: this.isBankChannel(data.channel_id)
      })
    } catch (err) {
      wx.showToast({ title: '加载失败', icon: 'none' })
    }
  },

  isBankChannel(channelId) {
    const channel = this.data.channels.find(c => c.id === channelId)
    return channel && channel.name === '银行转账'
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

  onAccountConfirm(e) {
    const index = e.detail.index
    this.setData({
      accountIndex: index,
      'form.account_id': this.data.accounts[index]?.id || ''
    })
  },

  onCategoryConfirm(e) {
    const index = e.detail.index
    this.setData({
      categoryIndex: index,
      'form.category_id': this.data.categories[index]?.id || ''
    })
  },

  onChannelConfirm(e) {
    const index = e.detail.index
    const channelId = this.data.channels[index]?.id || ''
    const showBank = this.isBankChannel(channelId)
    this.setData({
      channelIndex: index,
      'form.channel_id': channelId,
      showBankPicker: showBank,
      bankIndex: showBank ? this.data.bankIndex : -1,
      'form.bank_id': showBank ? this.data.form.bank_id : ''
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
      wx.showToast({ title: '请输入金额', icon: 'none' })
      return
    }
    if (!form.date) {
      wx.showToast({ title: '请选择日期', icon: 'none' })
      return
    }

    this.setData({ submitting: true })
    try {
      const payload = { ...form, type: 2 }
      if (this.data.isEdit) {
        await put('/records/' + this.data.id, payload)
        wx.showToast({ title: '修改成功', icon: 'success' })
      } else {
        await post('/records', payload)
        wx.showToast({ title: '添加成功', icon: 'success' })
      }
      setTimeout(() => wx.navigateBack(), 1000)
    } catch (err) {
      // request.js already shows error toast
    } finally {
      this.setData({ submitting: false })
    }
  }
})

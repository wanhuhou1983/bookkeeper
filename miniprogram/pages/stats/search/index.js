const { post } = require('../../../utils/request.js')
const { formatAmount, getToday } = require('../../../utils/format.js')
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
    // 多选弹窗
    showAccountPicker: false,
    showCategoryPicker: false,
    showChannelPicker: false,
    showBankPicker: false,
    // 结果
    resultAmount: '',
    resultCount: '',
    hasResult: false,
    saving: false,
    showSaveDialog: false,
    saveName: '',
    submitting: false
  },

  onLoad() {
    const { accounts, categories, channels, banks } = app.globalData.configCache
    this.setData({
      accounts,
      categories,
      channels,
      banks
    })
  },

  onDateStartChange(e) {
    this.setData({ 'form.date_start': e.detail.value })
  },

  onDateEndChange(e) {
    this.setData({ 'form.date_end': e.detail.value })
  },

  // 账本多选
  onAccountToggle(e) {
    const id = e.currentTarget.dataset.id
    const ids = this.data.form.account_ids.slice()
    const idx = ids.indexOf(id)
    if (idx >= 0) ids.splice(idx, 1)
    else ids.push(id)
    this.setData({ 'form.account_ids': ids })
  },

  onCategoryToggle(e) {
    const id = e.currentTarget.dataset.id
    const ids = this.data.form.category_ids.slice()
    const idx = ids.indexOf(id)
    if (idx >= 0) ids.splice(idx, 1)
    else ids.push(id)
    this.setData({ 'form.category_ids': ids })
  },

  onChannelToggle(e) {
    const id = e.currentTarget.dataset.id
    const ids = this.data.form.channel_ids.slice()
    const idx = ids.indexOf(id)
    if (idx >= 0) ids.splice(idx, 1)
    else ids.push(id)
    this.setData({ 'form.channel_ids': ids })
  },

  onBankToggle(e) {
    const id = e.currentTarget.dataset.id
    const ids = this.data.form.bank_ids.slice()
    const idx = ids.indexOf(id)
    if (idx >= 0) ids.splice(idx, 1)
    else ids.push(id)
    this.setData({ 'form.bank_ids': ids })
  },

  showPicker(e) {
    const type = e.currentTarget.dataset.type
    this.setData({ [type]: true })
  },

  closePicker(e) {
    const type = e.currentTarget.dataset.type
    this.setData({ [type]: false })
  },

  async onQuery() {
    this.setData({ submitting: true })
    try {
      const data = await post('/stats/query', this.data.form)
      this.setData({
        resultAmount: formatAmount(data.total || 0),
        resultCount: data.count || 0,
        hasResult: true,
        submitting: false
      })
    } catch (err) {
      this.setData({ submitting: false })
    }
  },

  onSaveClick() {
    this.setData({ showSaveDialog: true, saveName: '' })
  },

  onSaveNameInput(e) {
    this.setData({ saveName: e.detail })
  },

  async onSaveConfirm() {
    const name = this.data.saveName.trim()
    if (!name) {
      wx.showToast({ title: '请输入名称', icon: 'none' })
      return
    }
    this.setData({ saving: true })
    try {
      await post('/saved-searches', {
        name,
        filters: this.data.form
      })
      this.setData({ showSaveDialog: false, saving: false })
      wx.showToast({ title: '保存成功', icon: 'success' })
    } catch (err) {
      this.setData({ saving: false })
    }
  },

  onSaveCancel() {
    this.setData({ showSaveDialog: false })
  }
})

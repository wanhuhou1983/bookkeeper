const { get, post, del } = require('../../../utils/request.js')
const app = getApp()

// 预设分类：支出类
const PRESET_EXPENSE = ['消费', '转账', '分红', '利息']
// 预设分类：收入类
const PRESET_INCOME = ['转账', '工资', '分红', '利息', '盈利']

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

  onShow() {
    this.loadList()
  },

  async loadList() {
    this.setData({ loading: true })
    try {
      const data = await get('/categories')
      const list = Array.isArray(data) ? data : (data.list || [])
      const expenseList = list.filter(c => c.type === 1 || c.type == null)
      const incomeList = list.filter(c => c.type === 2)
      const showPreset = list.length === 0
      this.setData({ expenseList, incomeList, loading: false, showPreset })
      app.globalData.configCache.categories = list
    } catch (err) {
      this.setData({ loading: false })
    }
  },

  async initPresets() {
    wx.showLoading({ title: '初始化中...' })
    try {
      const requests = [
        ...PRESET_EXPENSE.map(name => post('/categories', { name, type: 1 })),
        ...PRESET_INCOME.map(name => post('/categories', { name, type: 2 }))
      ]
      await Promise.all(requests)
      wx.hideLoading()
      wx.showToast({ title: '预设分类已添加', icon: 'success' })
      this.loadList()
    } catch (err) {
      wx.hideLoading()
    }
  },

  onAddClick(e) {
    const type = e.currentTarget.dataset.type || 1
    this.setData({ showAdd: true, newName: '', newType: type })
  },

  onNameInput(e) {
    this.setData({ newName: e.detail })
  },

  onTypeChange(e) {
    this.setData({ newType: parseInt(e.detail.value) })
  },

  async onAddConfirm() {
    const name = this.data.newName.trim()
    if (!name) {
      wx.showToast({ title: '请输入名称', icon: 'none' })
      return
    }
    try {
      await post('/categories', { name, type: this.data.newType })
      this.setData({ showAdd: false, newName: '' })
      wx.showToast({ title: '添加成功', icon: 'success' })
      this.loadList()
    } catch (err) {
      // request.js handles error
    }
  },

  onAddCancel() {
    this.setData({ showAdd: false, newName: '' })
  },

  onDelete(e) {
    const { id, name } = e.currentTarget.dataset
    wx.showModal({
      title: '确认删除',
      content: `确定删除类目"${name}"吗？`,
      success: async (res) => {
        if (res.confirm) {
          try {
            await del('/categories/' + id)
            wx.showToast({ title: '删除成功', icon: 'success' })
            this.loadList()
          } catch (err) {
            // request.js handles error
          }
        }
      }
    })
  }
})
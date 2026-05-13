const { get, post, del } = require('../../../utils/request.js')
const app = getApp()

Page({
  data: {
    list: [],
    showAdd: false,
    newName: '',
    loading: true
  },

  onShow() {
    this.loadList()
  },

  async loadList() {
    this.setData({ loading: true })
    try {
      const data = await get('/accounts')
      const list = Array.isArray(data) ? data : (data.list || [])
      this.setData({ list, loading: false })
      // 同步更新全局缓存
      app.globalData.configCache.accounts = list
    } catch (err) {
      this.setData({ loading: false })
    }
  },

  onAddClick() {
    this.setData({ showAdd: true, newName: '' })
  },

  onNameInput(e) {
    this.setData({ newName: e.detail })
  },

  async onAddConfirm() {
    const name = this.data.newName.trim()
    if (!name) {
      wx.showToast({ title: '请输入名称', icon: 'none' })
      return
    }
    try {
      await post('/accounts', { name })
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
      content: `确定删除账本「${name}」吗？`,
      success: async (res) => {
        if (res.confirm) {
          try {
            await del('/accounts/' + id)
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

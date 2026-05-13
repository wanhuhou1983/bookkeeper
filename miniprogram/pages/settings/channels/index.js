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
      const data = await get('/channels')
      const list = Array.isArray(data) ? data : (data.list || [])
      this.setData({ list, loading: false })
      app.globalData.configCache.channels = list
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
      await post('/channels', { name })
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
      content: `确定删除渠道「${name}」吗？`,
      success: async (res) => {
        if (res.confirm) {
          try {
            await del('/channels/' + id)
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

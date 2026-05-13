const { get, del, put } = require('../../../utils/request.js')
const { formatAmount } = require('../../../utils/format.js')

Page({
  data: {
    list: [],
    loading: true,
    showRename: false,
    renameId: '',
    renameName: ''
  },

  onShow() {
    this.loadList()
  },

  async loadList() {
    this.setData({ loading: true })
    try {
      const data = await get('/saved-searches')
      const list = Array.isArray(data) ? data : (data.list || [])
      this.setData({ list, loading: false })
    } catch (err) {
      this.setData({ loading: false })
    }
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: '/pages/stats/detail/index?id=' + id + '&type=saved' })
  },

  onLongPress(e) {
    const { id, name } = e.currentTarget.dataset
    wx.showActionSheet({
      itemList: ['重命名', '删除'],
      success: (res) => {
        if (res.tapIndex === 0) {
          this.setData({ showRename: true, renameId: id, renameName: name })
        } else if (res.tapIndex === 1) {
          this.onDelete(id, name)
        }
      }
    })
  },

  onDelete(id, name) {
    wx.showModal({
      title: '确认删除',
      content: `确定删除统计项「${name}」吗？`,
      success: async (res) => {
        if (res.confirm) {
          try {
            await del('/saved-searches/' + id)
            wx.showToast({ title: '删除成功', icon: 'success' })
            this.loadList()
          } catch (err) {
            // handled
          }
        }
      }
    })
  },

  onRenameInput(e) {
    this.setData({ renameName: e.detail })
  },

  async onRenameConfirm() {
    const name = this.data.renameName.trim()
    if (!name) {
      wx.showToast({ title: '请输入名称', icon: 'none' })
      return
    }
    try {
      await put('/saved-searches/' + this.data.renameId, { name })
      this.setData({ showRename: false })
      wx.showToast({ title: '重命名成功', icon: 'success' })
      this.loadList()
    } catch (err) {
      // handled
    }
  },

  onRenameCancel() {
    this.setData({ showRename: false })
  },

  onPullDownRefresh() {
    this.loadList().then(() => wx.stopPullDownRefresh())
  }
})

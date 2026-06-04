const { get, post, put, del } = require('../../../utils/request.js')
const app = getApp()

// 预设渠道列表
const PRESET_CHANNELS = ['支付宝', '微信', '云闪付', '京东', '现金', '淘宝', '拼多多', '抖音']

Page({
  data: {
    list: [],
    showAdd: false,
    newName: '',
    loading: true,
    showPreset: false,
    showEdit: false,
    editId: '',
    editName: ''
  },

  onShow() {
    this.loadList()
  },

  async loadList() {
    this.setData({ loading: true })
    try {
      const data = await get('/channels')
      const list = Array.isArray(data) ? data : (data.list || [])
      const showPreset = list.length === 0
      this.setData({ list, loading: false, showPreset })
      app.globalData.configCache.channels = list
    } catch (err) {
      this.setData({ loading: false })
    }
  },

  async initPresets() {
    wx.showLoading({ title: '初始化中...' })
    try {
      const requests = PRESET_CHANNELS.map(name => post('/channels', { name }))
      await Promise.all(requests)
      wx.hideLoading()
      wx.showToast({ title: '预设渠道已添加', icon: 'success' })
      this.loadList()
    } catch (err) {
      wx.hideLoading()
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

  onEditClick: function(e) {
    var id = e.currentTarget.dataset.id
    var name = e.currentTarget.dataset.name
    this.setData({ showEdit: true, editId: id, editName: name })
  },

  onEditNameInput: function(e) {
    this.setData({ editName: e.detail })
  },

  onEditConfirm: function() {
    var that = this
    var name = this.data.editName.trim()
    if (!name) {
      wx.showToast({ title: 'Enter name', icon: 'none' })
      return
    }
    put('/channels/' + this.data.editId, { name: name }).then(function() {
      that.setData({ showEdit: false })
      wx.showToast({ title: 'Renamed', icon: 'success' })
      that.loadList()
    }).catch(function() {})
  },

  onEditCancel: function() {
    this.setData({ showEdit: false })
  },

  onDelete(e) {
    const { id, name } = e.currentTarget.dataset
    wx.showModal({
      title: '确认删除',
      content: `确定删除渠道"${name}"吗？`,
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
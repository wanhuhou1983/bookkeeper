const { get, post, put, del } = require('../../../utils/request.js')
const app = getApp()

Page({
  data: {
    list: [],
    channels: [],
    showAdd: false,
    newName: '',
    channelIndex: -1,
    channelNames: [],
    loading: true,
    showEdit: false,
    editId: '',
    editName: ''
  },

  onShow() {
    this.loadList()
    const { channels } = app.globalData.configCache
    this.setData({
      channels,
      channelNames: channels.map(c => c.name)
    })
  },

  async loadList() {
    this.setData({ loading: true })
    try {
      const data = await get('/banks')
      const list = Array.isArray(data) ? data : (data.list || [])
      this.setData({ list, loading: false })
      app.globalData.configCache.banks = list
    } catch (err) {
      this.setData({ loading: false })
    }
  },

  onAddClick() {
    this.setData({ showAdd: true, newName: '', channelIndex: -1 })
  },

  onNameInput(e) {
    this.setData({ newName: e.detail })
  },

  onChannelConfirm(e) {
    this.setData({ channelIndex: e.detail.index })
  },

  async onAddConfirm() {
    const name = this.data.newName.trim()
    if (!name) {
      wx.showToast({ title: '请输入名称', icon: 'none' })
      return
    }
    try {
      const payload = { name }
      if (this.data.channelIndex >= 0) {
        payload.channel_id = this.data.channels[this.data.channelIndex].id
      }
      await post('/banks', payload)
      this.setData({ showAdd: false, newName: '', channelIndex: -1 })
      wx.showToast({ title: '添加成功', icon: 'success' })
      this.loadList()
    } catch (err) {
      // request.js handles error
    }
  },

  onAddCancel() {
    this.setData({ showAdd: false, newName: '', channelIndex: -1 })
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
    put('/banks/' + this.data.editId, { name: name }).then(function() {
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
      content: `确定删除银行「${name}」吗？`,
      success: async (res) => {
        if (res.confirm) {
          try {
            await del('/banks/' + id)
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

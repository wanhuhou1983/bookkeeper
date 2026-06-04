const { get, post, put, del } = require('../../../utils/request.js')
const app = getApp()

var PRESET_CHANNELS = ['Alipay', 'WeChat', 'CloudFlash', 'JD', 'Cash', 'Taobao', 'Pinduoduo', 'Douyin']

Page({
  data: {
    list: [],
    showAdd: false,
    showEdit: false,
    editId: '',
    editName: '',
    newName: '',
    loading: true,
    showPreset: false
  },

  onShow: function() {
    var that = this
    if (app.globalData.ready) { that.loadList() }
    else { app.globalData.readyCallbacks.push(function() { that.loadList() }) }
  },

  loadList: function() {
    var that = this
    this.setData({ loading: true })
    get('/channels').then(function(data) {
      var list = Array.isArray(data) ? data : (data.list || [])
      list.sort(function(a,b) { if(a.is_system&&!b.is_system)return -1; if(!a.is_system&&b.is_system)return 1; return a.name.localeCompare(b.name) })
      var showPreset = list.length === 0
      that.setData({ list: list, loading: false, showPreset: showPreset })
      app.globalData.configCache.channels = list
    }).catch(function() { that.setData({ loading: false }) })
  },

  initPresets: function() {
    var that = this
    wx.showLoading({ title: 'Initializing...' })
    Promise.all(PRESET_CHANNELS.map(function(n) { return post('/channels', { name: n }) })).then(function() {
      wx.hideLoading(); wx.showToast({ title: 'Presets added', icon: 'success' }); that.loadList()
    }).catch(function() { wx.hideLoading() })
  },

  onAddClick: function() { this.setData({ showAdd: true, newName: '' }) },
  onNameInput: function(e) { this.setData({ newName: e.detail }) },
  onAddConfirm: function() {
    var that = this; var name = this.data.newName.trim()
    if (!name) { wx.showToast({ title: 'Enter name', icon: 'none' }); return }
    post('/channels', { name: name }).then(function() {
      that.setData({ showAdd: false, newName: '' }); wx.showToast({ title: 'Added', icon: 'success' }); that.loadList()
    }).catch(function() {})
  },
  onAddCancel: function() { this.setData({ showAdd: false, newName: '' }) },

  onEditClick: function(e) {
    var id = e.currentTarget.dataset.id; var name = e.currentTarget.dataset.name
    this.setData({ showEdit: true, editId: id, editName: name })
  },
  onEditNameInput: function(e) { this.setData({ editName: e.detail }) },
  onEditConfirm: function() {
    var that = this; var name = this.data.editName.trim()
    if (!name) { wx.showToast({ title: 'Enter name', icon: 'none' }); return }
    put('/channels/' + this.data.editId, { name: name }).then(function() {
      that.setData({ showEdit: false }); wx.showToast({ title: 'Renamed', icon: 'success' }); that.loadList()
    }).catch(function() {})
  },
  onEditCancel: function() { this.setData({ showEdit: false }) },

  onDelete: function(e) {
    var that = this; var id = e.currentTarget.dataset.id; var name = e.currentTarget.dataset.name
    wx.showModal({ title: 'Confirm delete', content: 'Delete "' + name + '"?', success: function(res) {
      if (res.confirm) { del('/channels/' + id).then(function() { wx.showToast({ title: 'Deleted', icon: 'success' }); that.loadList() }).catch(function() {}) }
    }})
  }
})

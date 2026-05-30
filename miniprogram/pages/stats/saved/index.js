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

  onShow: function() {
    this.loadList()
  },

  loadList: function() {
    var that = this
    this.setData({ loading: true })
    get('/saved-searches').then(function(data) {
      var list = Array.isArray(data) ? data : (data.list || [])
      that.setData({ list: list, loading: false })
    }).catch(function() {
      that.setData({ loading: false })
    })
  },

  goDetail: function(e) {
    var id = e.currentTarget.dataset.id
    wx.navigateTo({ url: '/pages/stats/detail/index?id=' + id + '&type=saved' })
  },

  onLongPress: function(e) {
    var that = this
    var id = e.currentTarget.dataset.id
    var name = e.currentTarget.dataset.name
    wx.showActionSheet({
      itemList: ['Rename', 'Delete'],
      success: function(res) {
        if (res.tapIndex === 0) {
          that.setData({ showRename: true, renameId: id, renameName: name })
        } else if (res.tapIndex === 1) {
          that.onDelete(id, name)
        }
      }
    })
  },

  onDelete: function(id, name) {
    var that = this
    wx.showModal({
      title: 'Confirm delete',
      content: 'Delete "' + name + '"?',
      success: function(res) {
        if (res.confirm) {
          del('/saved-searches/' + id).then(function() {
            wx.showToast({ title: 'Deleted', icon: 'success' })
            that.loadList()
          }).catch(function() {})
        }
      }
    })
  },

  onRenameInput: function(e) {
    this.setData({ renameName: e.detail })
  },

  onRenameConfirm: function() {
    var that = this
    var name = this.data.renameName.trim()
    if (!name) {
      wx.showToast({ title: 'Enter name', icon: 'none' })
      return
    }
    put('/saved-searches/' + this.data.renameId, { name: name }).then(function() {
      that.setData({ showRename: false })
      wx.showToast({ title: 'Renamed', icon: 'success' })
      that.loadList()
    }).catch(function() {})
  },

  onRenameCancel: function() {
    this.setData({ showRename: false })
  },

  onPullDownRefresh: function() {
    var that = this
    this.loadList().then(function() { wx.stopPullDownRefresh() })
  }
})
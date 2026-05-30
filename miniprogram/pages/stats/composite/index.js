const { get, post, del } = require('../../../utils/request.js')
const { formatAmount } = require('../../../utils/format.js')

Page({
  data: {
    list: [],
    savedSearches: [],
    showCreate: false,
    newName: '',
    selectedItems: [],
    operators: ['+', '-'],
    loading: true,
    createForm: {
      name: '',
      items: [{ search_id: '', operator: '+' }]
    }
  },

  onShow: function() {
    this.loadData()
  },

  loadData: function() {
    var that = this
    this.setData({ loading: true })
    get('/composite-stats').then(function(compositeData) {
      var list = Array.isArray(compositeData) ? compositeData : (compositeData.list || [])
      get('/saved-searches').then(function(savedData) {
        var savedSearches = Array.isArray(savedData) ? savedData : (savedData.list || [])
        that.setData({ list: list, savedSearches: savedSearches, loading: false })
      }).catch(function() {
        that.setData({ loading: false })
      })
    }).catch(function() {
      that.setData({ loading: false })
    })
  },

  onCreateClick: function() {
    this.setData({
      showCreate: true,
      createForm: { name: '', items: [{ search_id: '', operator: '+' }] }
    })
  },

  onNameInput: function(e) {
    this.setData({ 'createForm.name': e.detail })
  },

  onAddFormItem: function() {
    var items = this.data.createForm.items.slice()
    items.push({ search_id: '', operator: '+' })
    this.setData({ 'createForm.items': items })
  },

  onRemoveFormItem: function(e) {
    var index = e.currentTarget.dataset.index
    var items = this.data.createForm.items.slice()
    items.splice(index, 1)
    this.setData({ 'createForm.items': items })
  },

  onSearchSelect: function(e) {
    var idx = e.currentTarget.dataset.index
    var pickerIdx = e.detail.value
    var selected = this.data.savedSearches[pickerIdx]
    if (selected) {
      var update = {}
      update['createForm.items[' + idx + '].search_id'] = selected.id
      update['createForm.items[' + idx + '].search_name'] = selected.name
      update['createForm.items[' + idx + '].search_idx'] = pickerIdx
      this.setData(update)
    }
  },

  onOperatorSelect: function(e) {
    var index = e.currentTarget.dataset.index
    var value = e.detail.value
    var update = {}
    update['createForm.items[' + index + '].operator'] = value
    this.setData(update)
  },

  onCreateConfirm: function() {
    var that = this
    var createForm = this.data.createForm
    if (!createForm.name.trim()) {
      wx.showToast({ title: 'Enter name', icon: 'none' })
      return
    }
    var validItems = createForm.items.filter(function(i) { return i.search_id })
    if (!validItems.length) {
      wx.showToast({ title: 'Select at least one', icon: 'none' })
      return
    }
    post('/composite-stats', { name: createForm.name, items: validItems }).then(function() {
      that.setData({ showCreate: false })
      wx.showToast({ title: 'Created', icon: 'success' })
      that.loadData()
    }).catch(function() {})
  },

  onCreateCancel: function() {
    this.setData({ showCreate: false })
  },

  goDetail: function(e) {
    var id = e.currentTarget.dataset.id
    wx.navigateTo({ url: '/pages/stats/detail/index?id=' + id + '&type=composite' })
  },

  onDelete: function(e) {
    var that = this
    var id = e.currentTarget.dataset.id
    var name = e.currentTarget.dataset.name
    wx.showModal({
      title: 'Confirm delete',
      content: 'Delete "' + name + '"?',
      success: function(res) {
        if (res.confirm) {
          del('/composite-stats/' + id).then(function() {
            wx.showToast({ title: 'Deleted', icon: 'success' })
            that.loadData()
          }).catch(function() {})
        }
      }
    })
  }
})
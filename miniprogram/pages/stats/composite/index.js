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
    // 新建表单
    createForm: {
      name: '',
      items: [{ search_id: '', operator: '+' }]
    }
  },

  onShow() {
    this.loadData()
  },

  async loadData() {
    this.setData({ loading: true })
    try {
      const [compositeData, savedData] = await Promise.all([
        get('/composite-stats'),
        get('/saved-searches')
      ])
      const list = Array.isArray(compositeData) ? compositeData : (compositeData.list || [])
      const savedSearches = Array.isArray(savedData) ? savedData : (savedData.list || [])
      this.setData({ list, savedSearches, loading: false })
    } catch (err) {
      this.setData({ loading: false })
    }
  },

  onCreateClick() {
    this.setData({
      showCreate: true,
      createForm: {
        name: '',
        items: [{ search_id: '', operator: '+' }]
      }
    })
  },

  onNameInput(e) {
    this.setData({ 'createForm.name': e.detail })
  },

  onAddFormItem() {
    const items = this.data.createForm.items.slice()
    items.push({ search_id: '', operator: '+' })
    this.setData({ 'createForm.items': items })
  },

  onRemoveFormItem(e) {
    const index = e.currentTarget.dataset.index
    const items = this.data.createForm.items.slice()
    items.splice(index, 1)
    this.setData({ 'createForm.items': items })
  },

  onSearchSelect(e) {
    const idx = e.currentTarget.dataset.index
    const pickerIdx = e.detail.value
    const selected = this.data.savedSearches[pickerIdx]
    if (selected) {
      this.setData({
        [`createForm.items[${idx}].search_id`]: selected.id,
        [`createForm.items[${idx}].search_name`]: selected.name,
        [`createForm.items[${idx}].search_idx`]: pickerIdx
      })
    }
  },

  onOperatorSelect(e) {
    const index = e.currentTarget.dataset.index
    const value = e.detail.value
    this.setData({ [`createForm.items[${index}].operator`]: value })
  },

  async onCreateConfirm() {
    const { createForm } = this.data
    if (!createForm.name.trim()) {
      wx.showToast({ title: '请输入名称', icon: 'none' })
      return
    }
    const validItems = createForm.items.filter(i => i.search_id)
    if (!validItems.length) {
      wx.showToast({ title: '请至少选择一个统计项', icon: 'none' })
      return
    }
    try {
      await post('/composite-stats', {
        name: createForm.name,
        items: validItems
      })
      this.setData({ showCreate: false })
      wx.showToast({ title: '创建成功', icon: 'success' })
      this.loadData()
    } catch (err) {
      // handled
    }
  },

  onCreateCancel() {
    this.setData({ showCreate: false })
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: '/pages/stats/detail/index?id=' + id + '&type=composite' })
  },

  onDelete(e) {
    const { id, name } = e.currentTarget.dataset
    wx.showModal({
      title: '确认删除',
      content: `确定删除复合统计「${name}」吗？`,
      success: async (res) => {
        if (res.confirm) {
          try {
            await del('/composite-stats/' + id)
            wx.showToast({ title: '删除成功', icon: 'success' })
            this.loadData()
          } catch (err) {
            // handled
          }
        }
      }
    })
  }
})

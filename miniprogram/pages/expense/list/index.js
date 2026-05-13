const { get } = require('../../../utils/request.js')
const { formatAmount, getCurrentMonth } = require('../../../utils/format.js')

Page({
  data: {
    records: [],
    totalExpense: '0.00',
    page: 1,
    hasMore: true,
    loading: false,
    month: ''
  },

  onLoad() {
    this.setData({ month: getCurrentMonth() })
  },

  onShow() {
    this.refresh()
  },

  onPullDownRefresh() {
    this.refresh().then(() => wx.stopPullDownRefresh())
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadMore()
    }
  },

  async refresh() {
    this.setData({ page: 1, hasMore: true, records: [] })
    await this.loadRecords()
  },

  async loadRecords() {
    this.setData({ loading: true })
    try {
      const data = await get('/records', { type: 1, page: this.data.page })
      const records = data.records || data.list || []
      this.setData({
        records: this.data.page === 1 ? records : this.data.records.concat(records),
        totalExpense: formatAmount(data.total || 0),
        hasMore: records.length >= 20,
        loading: false
      })
    } catch (err) {
      this.setData({ loading: false })
    }
  },

  loadMore() {
    this.setData({ page: this.data.page + 1 })
    this.loadRecords()
  },

  goEdit(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/expense/edit/index${id ? '?id=' + id : ''}` })
  },

  goAdd() {
    wx.navigateTo({ url: '/pages/expense/edit/index' })
  }
})

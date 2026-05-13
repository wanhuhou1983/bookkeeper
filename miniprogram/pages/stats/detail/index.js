const { get } = require('../../../utils/request.js')
const { formatAmount } = require('../../../utils/format.js')

Page({
  data: {
    id: '',
    type: '',  // 'saved' or 'composite'
    detail: null,
    loading: true
  },

  onLoad(options) {
    this.setData({
      id: options.id,
      type: options.type || 'saved'
    })
    this.loadDetail()
  },

  async loadDetail() {
    this.setData({ loading: true })
    const url = this.data.type === 'composite'
      ? '/composite-stats/' + this.data.id
      : '/saved-searches/' + this.data.id
    try {
      const data = await get(url)
      this.setData({
        detail: data,
        loading: false
      })
      wx.setNavigationBarTitle({ title: data.name || '统计详情' })
    } catch (err) {
      this.setData({ loading: false })
    }
  },

  onPullDownRefresh() {
    this.loadDetail().then(() => wx.stopPullDownRefresh())
  }
})

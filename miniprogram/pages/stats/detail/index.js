const { get } = require('../../../utils/request.js')
const { formatAmount } = require('../../../utils/format.js')

Page({
  data: {
    id: '',
    type: '',
    detail: null,
    loading: true
  },

  onLoad: function(options) {
    this.setData({
      id: options.id,
      type: options.type || 'saved'
    })
    this.loadDetail()
  },

  loadDetail: function() {
    var that = this
    this.setData({ loading: true })
    var url = this.data.type === 'composite'
      ? '/composite-stats/' + this.data.id
      : '/saved-searches/' + this.data.id
    get(url).then(function(data) {
      that.setData({ detail: data, loading: false })
      wx.setNavigationBarTitle({ title: data.name || 'Detail' })
      // Also load records for saved searches
      if (that.data.type === 'saved') {
        get('/saved-searches/' + that.data.id + '/records').then(function(records) {
          var d = that.data.detail
          d.records = records || []
          that.setData({ detail: d })
        }).catch(function() {})
      }
    }).catch(function() {
      that.setData({ loading: false })
    })
  },

  onPullDownRefresh: function() {
    var that = this
    this.loadDetail().then(function() { wx.stopPullDownRefresh() })
  }
})
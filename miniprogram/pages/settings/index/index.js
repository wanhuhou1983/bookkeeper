Page({
  data: {},

  goAccounts() {
    wx.navigateTo({ url: '/pages/settings/accounts/index' })
  },

  goCategories() {
    wx.navigateTo({ url: '/pages/settings/categories/index' })
  },

  goChannels() {
    wx.navigateTo({ url: '/pages/settings/channels/index' })
  },

  goBanks() {
    wx.navigateTo({ url: '/pages/settings/banks/index' })
  }
})

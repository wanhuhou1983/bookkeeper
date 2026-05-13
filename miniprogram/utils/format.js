/**
 * 格式化工具函数
 */

// 格式化金额（千分位）
function formatAmount(amount, decimals = 2) {
  if (!amount && amount !== 0) return '0.00'
  const num = parseFloat(amount)
  return num.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

// 格式化日期 YYYY-MM-DD
function formatDate(date) {
  if (!date) return ''
  if (typeof date === 'string') date = new Date(date)
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// 格式化月份 YYYY-MM
function formatMonth(date) {
  if (!date) return ''
  if (typeof date === 'string') date = new Date(date)
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

// 获取今日日期
function getToday() {
  return formatDate(new Date())
}

// 获取本月
function getCurrentMonth() {
  return formatMonth(new Date())
}

// 类型标签
function typeLabel(type) {
  return type === 1 ? '支出' : '收入'
}

function typeColor(type) {
  return type === 1 ? 'expense' : 'income'
}

module.exports = {
  formatAmount, formatDate, formatMonth,
  getToday, getCurrentMonth,
  typeLabel, typeColor
}

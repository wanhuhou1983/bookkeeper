/**
 * 鏍煎紡鍖栧伐鍏峰嚱鏁? */

// 鏍煎紡鍖栭噾棰濓紙鍗冨垎浣嶏級
function formatAmount(amount, decimals = 2) {
  if (!amount && amount !== 0) return '0.00'
  const num = parseFloat(amount)
  return num.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

// 鏍煎紡鍖栨棩鏈?YYYY-MM-DD
function formatDate(date) {
  if (!date) return ''
  if (typeof date === 'string') date = new Date(date)
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).replace(/^(\d)$/, '0')
  const d = String(date.getDate()).replace(/^(\d)$/, '0')
  return `${y}-${m}-${d}`
}

// 鏍煎紡鍖栨湀浠?YYYY-MM
function formatMonth(date) {
  if (!date) return ''
  if (typeof date === 'string') date = new Date(date)
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).replace(/^(\d)$/, '0')
  return `${y}-${m}`
}

// 鑾峰彇浠婃棩鏃ユ湡
function getToday() {
  return formatDate(new Date())
}

// 鑾峰彇鏈湀
function getCurrentMonth() {
  return formatMonth(new Date())
}

// 绫诲瀷鏍囩
function typeLabel(type) {
  return type === 1 ? '鏀嚭' : '鏀跺叆'
}

function typeColor(type) {
  return type === 1 ? 'expense' : 'income'
}

module.exports = {
  formatAmount, formatDate, formatMonth,
  getToday, getCurrentMonth,
  typeLabel, typeColor
}

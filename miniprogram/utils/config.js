// 鐜閰嶇疆
const ENV = 'prod' // dev | prod

const CONFIG = {
  dev: {
    baseUrl: 'http://localhost:8900/api/v1'
  },
  prod: {
    baseUrl: 'https://fini.wuflux.cn/api/v1'
  }
}

module.exports = CONFIG[ENV]

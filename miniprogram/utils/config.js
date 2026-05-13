// 环境配置
const ENV = 'dev' // dev | prod

const CONFIG = {
  dev: {
    baseUrl: 'http://localhost:8900/api/v1'
  },
  prod: {
    baseUrl: 'https://your-domain.com/api/v1'
  }
}

module.exports = CONFIG[ENV]

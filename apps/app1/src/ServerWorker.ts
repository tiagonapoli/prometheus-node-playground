import Koa from 'koa'
import { collectDefaultMetrics, Gauge, register, Registry, Histogram } from 'prom-client'
import cluster from 'cluster'

const sleep = (ms: number) => {
  return new Promise(resolve => {
    return setTimeout(resolve, ms)
  })
}

const randomIntFromInterval = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1) + min)
}

export class ServerWorker {
  private prometheusRegistry: Registry
  constructor() {
    this.prometheusRegistry = register
  }

  private getMetricsMiddleware() {
    const gauge = new Gauge({ name: 'http_request_current', help: 'Current http requests' })
    this.prometheusRegistry.registerMetric(gauge)
    collectDefaultMetrics({ register: this.prometheusRegistry })
    return async (ctx, next) => {
      if (ctx.request.path !== '/metrics') {
        gauge.inc(1)
        await next()
        gauge.dec(1)
        return
      }

      const metrics = this.prometheusRegistry.metrics()
      ctx.set('Content-Type', this.prometheusRegistry.contentType)
      ctx.body = metrics
      ctx.status = 200
    }
  }

  public getKoaApp() {
    const app = new Koa()
    app.use(this.getMetricsMiddleware())
    app.use(async (ctx, next) => {
      await sleep(randomIntFromInterval(30, 80))
      ctx.status = randomIntFromInterval(1, 10) <= 2 ? 400 : 200
      return next()
    })

    return app
  }

  public start() {
    return this.getKoaApp().listen(3000, () => {
      console.log(`Worker ${cluster.worker.id} listening on port 3000`)
    })
  }
}

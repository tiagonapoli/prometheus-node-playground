import cluster from 'cluster'
import Koa from 'koa'
import { AggregatorRegistry } from 'prom-client'
import { promisify } from 'util'

export class ServerMaster {
  private prometheusAggregatorRegistry: AggregatorRegistry

  constructor() {
    this.prometheusAggregatorRegistry = new AggregatorRegistry()
  }

  private getMetricsMiddleware() {
    return async (ctx, next) => {
      if (ctx.request.path !== '/master_metrics') {
        return next()
      }

      try {
        const metrics = await promisify(this.prometheusAggregatorRegistry.clusterMetrics)()
        ctx.set('Content-Type', this.prometheusAggregatorRegistry.contentType)
        ctx.body = metrics
        ctx.status = 200
      } catch (err) {
        console.log(err)
        ctx.status = 500
      }
    }
  }

  public getKoaApp() {
    const app = new Koa()
    app.use(this.getMetricsMiddleware())
    return app
  }

  public start() {
    for (let i = 0; i < 4; i++) {
      cluster.fork()
    }

    return this.getKoaApp().listen(3001, () => {
      console.log(`Master listening on port 3001`)
    })
  }
}

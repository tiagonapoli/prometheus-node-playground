"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cluster_1 = __importDefault(require("cluster"));
const koa_1 = __importDefault(require("koa"));
const prom_client_1 = require("prom-client");
const util_1 = require("util");
class ServerMaster {
    constructor() {
        this.prometheusAggregatorRegistry = new prom_client_1.AggregatorRegistry();
    }
    getMetricsMiddleware() {
        return async (ctx, next) => {
            if (ctx.request.path !== '/master_metrics') {
                return next();
            }
            try {
                const metrics = await util_1.promisify(this.prometheusAggregatorRegistry.clusterMetrics)();
                ctx.set('Content-Type', this.prometheusAggregatorRegistry.contentType);
                ctx.body = metrics;
                ctx.status = 200;
            }
            catch (err) {
                console.log(err);
                ctx.status = 500;
            }
        };
    }
    getKoaApp() {
        const app = new koa_1.default();
        app.use(this.getMetricsMiddleware());
        return app;
    }
    start() {
        for (let i = 0; i < 4; i++) {
            cluster_1.default.fork();
        }
        return this.getKoaApp().listen(3001, () => {
            console.log(`Master listening on port 3001`);
        });
    }
}
exports.ServerMaster = ServerMaster;

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const koa_1 = __importDefault(require("koa"));
const prom_client_1 = require("prom-client");
const cluster_1 = __importDefault(require("cluster"));
const sleep = (ms) => {
    return new Promise(resolve => {
        return setTimeout(resolve, ms);
    });
};
const randomIntFromInterval = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1) + min);
};
class ServerWorker {
    constructor() {
        this.prometheusRegistry = prom_client_1.register;
    }
    getMetricsMiddleware() {
        const gauge = new prom_client_1.Gauge({ name: 'http_request_current', help: 'Current http requests' });
        this.prometheusRegistry.registerMetric(gauge);
        prom_client_1.collectDefaultMetrics({ register: this.prometheusRegistry });
        return async (ctx, next) => {
            if (ctx.request.path !== '/metrics') {
                gauge.inc(1);
                await next();
                gauge.dec(1);
                return;
            }
            const metrics = this.prometheusRegistry.metrics();
            ctx.set('Content-Type', this.prometheusRegistry.contentType);
            ctx.body = metrics;
            ctx.status = 200;
        };
    }
    getKoaApp() {
        const app = new koa_1.default();
        app.use(this.getMetricsMiddleware());
        app.use(async (ctx, next) => {
            await sleep(randomIntFromInterval(30, 80));
            ctx.status = randomIntFromInterval(1, 10) <= 2 ? 400 : 200;
            return next();
        });
        return app;
    }
    start() {
        return this.getKoaApp().listen(3000, () => {
            console.log(`Worker ${cluster_1.default.worker.id} listening on port 3000`);
        });
    }
}
exports.ServerWorker = ServerWorker;

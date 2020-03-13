"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cluster_1 = __importDefault(require("cluster"));
const ServerMaster_1 = require("./ServerMaster");
const ServerWorker_1 = require("./ServerWorker");
const start = () => {
    if (cluster_1.default.isMaster) {
        const master = new ServerMaster_1.ServerMaster();
        master.start();
    }
    else {
        const worker = new ServerWorker_1.ServerWorker();
        worker.start();
    }
};
if (require.main === module) {
    start();
}

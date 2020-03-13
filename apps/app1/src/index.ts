import cluster from 'cluster'
import { ServerMaster } from './ServerMaster'
import { ServerWorker } from './ServerWorker'

const start = () => {
  if (cluster.isMaster) {
    const master = new ServerMaster()
    master.start()
  } else {
    const worker = new ServerWorker()
    worker.start()
  }
}

if (require.main === module) {
  start()
}

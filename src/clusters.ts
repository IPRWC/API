import os from 'os';
import cluster from 'cluster';

const CPUS = os.cpus();
if (cluster.isMaster) {
  CPUS.forEach(() => {
    cluster.fork();
  });
  cluster.on('exit', () => {
    cluster.fork();
  });
} else {
  // eslint-disable-next-line global-require
  require('./index.js');
}

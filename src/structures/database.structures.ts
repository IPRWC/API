import { ConnectionManager } from 'typeorm';
import { join } from 'path';
import {
  dbName, dbHost, dbPort, dbUser, dbPassword,
} from '../config';

const connectionManager: ConnectionManager = new ConnectionManager();

connectionManager.create({
  name: dbName,
  type: 'mariadb',
  database: dbName,
  username: dbUser,
  password: dbPassword,
  port: dbPort,
  host: dbHost,
  entities: [join(__dirname, '..', 'models/*/*{.js,.ts}')],
});

export default connectionManager;

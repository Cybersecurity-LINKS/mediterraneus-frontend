import { Server } from './server.js';
import { ConnectorWallet } from './wallet.js';

const port = parseInt(process.env.PORT || '1234');

export const connectorWallet = new ConnectorWallet();
const starter = new Server()
  .start(port)
  .then(async port => {
    console.log('⚡️[server]: Initializing connector wallet...');
    await connectorWallet.initConnectorWallet();
    console.log(`⚡️[server]: Server is running at http://localhost:${port}`)
  })
  .catch(error => {
    console.log(error)
  });
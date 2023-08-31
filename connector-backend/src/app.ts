import { Server } from './server.js';
import { ConnectorWallet } from './wallet.js';

const port = parseInt(process.env.PORT || '1234');
export const connectorWallet = new ConnectorWallet();

export const starter = new Server().start(port)
  .then(async port => {
    console.log('Initializing connector wallet...');
    await connectorWallet.initConnectorWallet();
    console.log(`Running on port ${port}`)
  })
  .catch(error => {
    console.log(error)
  });
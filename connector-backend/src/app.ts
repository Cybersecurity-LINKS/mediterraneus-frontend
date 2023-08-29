// import { IpfsUploader } from './ipfs_uploader';
import { Server } from './server';
import { ConnectorWallet } from './wallet';

const port = parseInt(process.env.PORT || '1234');
export const connectorWallet = new ConnectorWallet();
// const ipfsUploader = new IpfsUploader();
// export let heliaNode;

export const starter = new Server().start(port)
  .then(async port => {
    console.log('Initializing connector wallet...');
    await connectorWallet.initConnectorWallet();
    // heliaNode = await ipfsUploader.createNode();
    console.log(`Running on port ${port}`)
  })
  .catch(error => {
    console.log(error)
  });
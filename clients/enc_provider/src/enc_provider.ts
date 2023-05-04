import express from 'express';
import { check, validationResult } from 'express-validator';
import morgan from 'morgan';
import { Provider } from './lib/client/';
import Accounts from 'web3-eth-accounts'
import { EncryptData } from './lib/provider_utils';
import { EncResponse } from './lib/interfaces/IencResponse';

// init express
const app = new express();
const port = 5555;

// set up the middlewares
app.use(morgan('dev'));
app.use(express.json());

app.get('/hello', function (req, res, next) {
  console.log("Hello World");
})

app.post('/api/encrypt', [
  check('evmAddress').notEmpty().isString(),
  check('signature').notEmpty().isString(),
  check('dataToEncrypt').notEmpty()
], function (req, res) {
  const errors = validationResult(req);
  if(!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  const signer = new Accounts().recover(req.body.dataToEncrypt, req.body.signature);

  if(signer !== req.body.evmAddress) {
    return res.status(400).json({error: `Signature validation failed. Provided source signer is ${req.body.evmAddress} but got ${signer}`});
  } else {
    const provider = new Provider('/src/lib/client');
    let response: EncResponse = new EncResponse();
    response.encryptedData = new EncryptData()._encrypt(provider.evmAccount.privateKey, req.body.dataToEncrypt);
    response.from = provider.evmAccount.address;
    return res.status(201).json(response).end();
  }

})

// activate the server
app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
    
    let Iprovider = new Provider('/src/lib/client');
    if(Iprovider.isWalletInitialized === false)
      Iprovider.createEVMAccount(); 
    else{
      console.log("Utilizing EVM address: ", Iprovider.getEVMaddress);
    }
});
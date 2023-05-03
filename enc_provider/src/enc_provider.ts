import express from 'express';
import { check, validationResult } from 'express-validator';
import morgan from 'morgan';
import { Provider } from './lib/client/';
import Accounts from 'web3-eth-accounts'
import { EncryptData } from './lib/provider_utils';

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
  check('evmAddress').notEmpty(),
  check('signature').notEmpty().isString(),
  check('dataToEncrypt').notEmpty()
], function (req, res) {
  const errors = validationResult(req);
  if(!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  const signer = new Accounts().recover(req.body.dataToEncrypt, req.body.signature);

  if(signer !== req.evmAddress) {
    return res.status(400).json({error: `Signature validation failed. Provided source signer is ${req.body.evmAddress}`});
  } else {
    const priv_key = new Provider().evmAccount.privateKey;
    let encryptedData = new EncryptData()._encrypt(priv_key, req.body.dataToEncrypt);
    return res.status(201).json(encryptedData).end();
  }

})

// activate the server
app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
    
    let Iprovider = new Provider();
    if(Iprovider.isWalletInitialized === false)
      Iprovider.createEVMAccount(); 
    else{
      console.log("Utilizing EVM address: ", Iprovider.getEVMaddress);
    }
});
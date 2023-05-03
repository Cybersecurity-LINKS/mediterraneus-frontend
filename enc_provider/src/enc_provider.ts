import express from 'express';
import morgan from 'morgan';
import { ProviderInit } from './lib/client/';

// init express
const app = new express();
const port = 5555;

// set up the middlewares
app.use(morgan('dev'));
app.use(express.json());

app.post('/api/encrypt', function (req, res, next) {

})

// activate the server
app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
    let Iprovider = new ProviderInit();
    
    Iprovider.createEVMaddress(); 
    Iprovider.createWallet();
  });
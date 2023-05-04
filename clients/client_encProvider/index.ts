import { Provider } from '../enc_provider/src/lib/client'
import { EncRequest } from './src';

async function main() {
    let Iprovider = new Provider('/SC_DataMarketplace_samples/clients/enc_provider/src/lib/client');
    await Iprovider.createEVMAccount();
    console.log("Utilizing EVM address: ", Iprovider.getEVMaddress);

    let req = new EncRequest();
    await req.request_encryption(Iprovider.evmAccount, "ciao");
}

main()
.then(() => {
  process.exit(0)
})
.catch((error) => {
  console.error(error);
  process.exit(1);
});
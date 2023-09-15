import { useMetaMask } from '@/hooks/useMetaMask'
import { NETWORKS, NETWORK_SYMBOL, formatChainAsNum } from '@/utils'
import { Figure, Toast, Row} from 'react-bootstrap'
import { Link } from 'react-router-dom'

export const Display = () => {

  const { wallet } = useMetaMask()

  return (
    <>
      <Toast className='mt-3 ms-5'>
        <Toast.Header closeButton={false}>
          <Figure className='mt-2 ms-2 rounded me-2 bg-success '>
            <Figure.Image
              width={25}
              height={30}
              src="../shimmerlogo.svg"
              className="ms-3 me-3 mt-3 mb-3"
            />
          </Figure>
          <strong className="mb-auto me-auto mt-auto text-black" style={{ fontSize: 18 }}>{NETWORKS[Number(wallet.chainId)]}</strong>
        </Toast.Header>
        <Toast.Body className='ms-2'><strong className="text-black" style={{ fontSize: 16}}>Wallet Accounts: </strong><Link target="_blank" to={`https://explorer.evm.testnet.shimmer.network/address/${wallet.accounts[0]}`}>{wallet.accounts[0]}</Link></Toast.Body>
        <Toast.Body className='ms-2'><strong className="text-black" style={{ fontSize: 16 }}>Wallet Balance: </strong> <br></br>{wallet.balance} {NETWORK_SYMBOL[Number(wallet.chainId)]} </Toast.Body>
        <Row xs={2} className='ms-2'>
        <Toast.Body><strong className="text-black" style={{ fontSize: 16 }}>Hex ChainId: </strong> <br></br>{wallet.chainId}</Toast.Body>
        <Toast.Body><strong className="text-black" style={{ fontSize: 16 }}>Numeric ChainId: </strong> <br></br>{formatChainAsNum(wallet.chainId)}</Toast.Body>
        </Row>
      </Toast>
    </>
  );
}
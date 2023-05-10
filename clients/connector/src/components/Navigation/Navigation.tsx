import { useMetaMask } from '@/hooks/useMetaMask'
import { formatAddress } from '@/utils'

import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import Button from 'react-bootstrap/Button';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';
import { Link } from 'react-router-dom';

export const Navigation = () => {

  const { wallet, hasProvider, isConnecting, connectMetaMask } = useMetaMask()

  return (
    <Navbar bg="light" variant="light">
    <Container>
      <Navbar.Brand className="float-left mr-2">MARKETPLACE</Navbar.Brand>
      <Nav className="me-auto">
        <Nav.Link as={Link} to="/publish" >Publish</Nav.Link>
        <Nav.Link as={Link} to="/catalogue" >Catalogue</Nav.Link>
      </Nav>
      <Nav className='float-right mr-2'>
      {!hasProvider &&
        <Nav.Link href="https://metamask.io" target="_blank">Install MetaMask</Nav.Link>
      }
      {window.ethereum?.isMetaMask && wallet.accounts.length < 1 &&
        <Button variant="primary"disabled={isConnecting}  onClick={connectMetaMask}>
          Connect MetaMask
        </Button>
      }
      {hasProvider && wallet.accounts.length > 0 &&
        <OverlayTrigger  
          placement="bottom"
          overlay={<Tooltip>Open in Block Explorer</Tooltip>}
        >
          <Nav.Link 
            className="text_link tooltip-bottom"
            target="_blank"
            href={`https://explorer.evm.testnet.shimmer.network/address/${wallet.accounts[0]}`}>
            {formatAddress(wallet.accounts[0])}
          </Nav.Link>
        </OverlayTrigger>
      }
      </Nav>
    </Container>
  </Navbar>
  );
}
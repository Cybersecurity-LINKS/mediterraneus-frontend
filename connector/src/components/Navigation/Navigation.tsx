import { useMetaMask } from '@/hooks/useMetaMask'
import { formatAddress2 } from '@/utils'
import { Link } from 'react-router-dom';
import { Figure, Row, OverlayTrigger, Tooltip, Button, Navbar, Nav, Container, Card } from 'react-bootstrap';

export const Navigation = (props: any) => {

  const { wallet, hasProvider, isConnecting, connectMetaMask } = useMetaMask()

  return (
    <Navbar bg="light" variant="light">
    <Container fluid>
      <Navbar.Brand className="float-left ms-5" as={Link} to="/" style={{fontSize: "25px"}}>MARKETPLACE</Navbar.Brand>
      {props.loggedIn ? 
      <Nav className="" style={{fontSize: "20px"}}>
        <Nav.Link as={Link} to="/identity" className='me-2 ms-2'>Identity</Nav.Link>
        <Nav.Link as={Link} to="/uploadasset" className='me-2 ms-2'>Upload Asset</Nav.Link>
        <Nav.Link as={Link} to="/publish" className='me-2 ms-2'>Publish</Nav.Link>
        <Nav.Link as={Link} to="/catalogue" className='me-2 ms-2'>Catalogue</Nav.Link>
      </Nav> :  "" }
      
      <Nav className='float-right me-5'>
      {!hasProvider &&
        <Nav.Link href="https://metamask.io" target="_blank">Install MetaMask</Nav.Link>
      }
      {window.ethereum?.isMetaMask && wallet.accounts.length < 1 && props.loggedIn &&
        <Button variant="primary"disabled={isConnecting}  onClick={connectMetaMask}>
          Connect MetaMask
        </Button>
      }
      {hasProvider && wallet.accounts.length > 0 && props.loggedIn &&
        <>
        <OverlayTrigger  
              placement="bottom"
              overlay={<Tooltip>Open in Block Explorer</Tooltip>}
            > 
        <Card style={{ width: '12rem' }} border="primary" bg="primary">
          <Row xs="auto" className="mt-2 ms-2 me-2">
            <Figure className='mt-2'>
              <Figure.Image
                width={30}
                height={30}
                src="metamasklogo.svg"
              />
            </Figure>
            
              <Nav.Link 
                className="text_link tooltip-bottom text-white mt-1"
                target="_blank"
                href={`https://explorer.evm.testnet.shimmer.network/address/${wallet.accounts[0]}`}>
                {formatAddress2(wallet.accounts[0])} 
              </Nav.Link>
          </Row>
        </Card>
        </OverlayTrigger>
        </>
      }
      </Nav>
    </Container>
  </Navbar>
  );
}
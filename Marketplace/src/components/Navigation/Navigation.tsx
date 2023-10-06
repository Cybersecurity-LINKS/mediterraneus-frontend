import { useMetaMask } from '@/hooks/useMetaMask'
import { formatAddress2 } from '@/utils'
import { Link } from 'react-router-dom';
import { Image, Row, OverlayTrigger, Tooltip, Button, Navbar, Nav, Container, Card } from 'react-bootstrap';
import { useIdentity } from '@/hooks/useIdentity';
import { useEffect } from 'react';

        
const logo = <ion-icon size="large" name="bag-handle-outline"></ion-icon>;

export const Navigation = (props: any) => {

  const { wallet, hasProvider, isConnecting, connectMetaMask } = useMetaMask()
  const { clearSessionStorage } = useIdentity();
  const baseExplorerURL = import.meta.env.VITE_EVM_EXPLORER;

  useEffect(() => {
    const logOut_accountchanged = () => {
      clearSessionStorage();
      sessionStorage.setItem("loggedIn", "false");
      props.setLoggedIn(false);
    } 

    window.ethereum.on('accountsChanged', logOut_accountchanged)
  })

  const handleLogout = () => {
    clearSessionStorage();
    sessionStorage.setItem("loggedIn", "false");
    props.setLoggedIn(false)
  }

  let metamaskNavItem;

  if (!hasProvider) {
    metamaskNavItem = 
    <Nav.Item> <Nav.Link href="https://metamask.io" target="_blank">Install MetaMask</Nav.Link> </Nav.Item>;
  } else if (window.ethereum?.isMetaMask && wallet.accounts.length < 1 && props.loggedIn) {
     
    metamaskNavItem = 
    <Nav.Item>
      <Button variant="primary" disabled={isConnecting}  onClick={connectMetaMask}>
        Connect MetaMask
      </Button>
    </Nav.Item>;
  } else if (wallet.accounts.length > 0 && props.loggedIn) {
    metamaskNavItem =
      <Nav.Item className="my-auto">
        <OverlayTrigger placement="bottom" overlay={<Tooltip>Open in Block Explorer</Tooltip>}> 
          <Button variant="outline-primary" style={{fontSize: '20px', textDecoration: 'none'}}
            target="_blank" href={`${baseExplorerURL+"/address/"+wallet.accounts[0]}`} >
            <Image className="me-2"width={25} height={25} src="metamasklogo.svg"/> 
            {formatAddress2(wallet.accounts[0])} 
          </Button>
        </OverlayTrigger>
      </Nav.Item>
  }
  
  return (
    <Navbar bg="light" variant="light">
    <Container fluid>

      <Navbar.Brand className="d-flex flex-row align-items-center ms-2" as={Link} to="/">
        {logo}
        <h4 className="ms-2 mt-2">MARKETPLACE</h4>
      </Navbar.Brand>

      {props.loggedIn ? 
        <Nav style={{fontSize: "20px"}}>
          <Nav.Link as={Link} to="/identity" className='me-2 ms-2'>Identity</Nav.Link>
          <Nav.Link as={Link} to="/uploadasset" className='me-2 ms-2'>Upload Asset</Nav.Link>
          <Nav.Link as={Link} to="/publish" className='me-2 ms-2'>Publish</Nav.Link>
          <Nav.Link as={Link} to="/catalogue" className='me-2 ms-2'>Catalogue</Nav.Link>
        </Nav> :  "" 
      }
      
      <Nav className='me-2'>
        {metamaskNavItem}
        { props.loggedIn && 
          <Nav.Item className='ms-2 my-auto'>
            <Button  variant='outline-danger' style={{fontSize: '20px'}} onClick={handleLogout}>
              Logout
            </Button>
          </Nav.Item>
        }
      </Nav>
    </Container>
  </Navbar>
  );
}
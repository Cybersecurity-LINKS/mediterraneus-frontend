import { useMetaMask } from '@/hooks/useMetaMask'
import { formatAddress2 } from '@/utils'
import { Link } from 'react-router-dom';
import { Badge, Image, Row, Form, Col, OverlayTrigger, Tooltip, Button, Navbar, Nav, Container, Card } from 'react-bootstrap';
import { useIdentity } from '@/hooks/useIdentity';
import { useEffect, useState } from 'react';
import isUrl from 'is-url';

        
const logo = <ion-icon size="large" name="bag-handle-outline"></ion-icon>;

export const Navigation = (props: any) => {

  const { wallet, hasProvider, isConnecting, connectMetaMask } = useMetaMask()
  const { clearSessionStorage, setTriggerTrue, connectorUrl, setConnector } = useIdentity();
  const [disabled, setDisabled] = useState(false);
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
    setDisabled(false);
    clearSessionStorage();
    sessionStorage.setItem("loggedIn", "false");
    props.setLoggedIn(false)
  }

  let metamaskNavItem;

  if (!hasProvider) {
    metamaskNavItem = 
    <Nav.Item> <Nav.Link href="https://metamask.io" target="_blank">Install MetaMask</Nav.Link> </Nav.Item>;
  } else if (window.ethereum?.isMetaMask && wallet.accounts.length < 1) {
     
    metamaskNavItem = 
    <Nav.Item>
      <Button variant="primary" disabled={isConnecting}  onClick={connectMetaMask}>
        Connect MetaMask
      </Button>
    </Nav.Item>;
  } else if (wallet.accounts.length > 0) {
    metamaskNavItem =
      <Nav.Item className="my-auto">
        <OverlayTrigger placement="bottom" overlay={<Tooltip>Open in Block Explorer</Tooltip>}> 
          <Button variant="outline-primary" 
            target="_blank" href={`${baseExplorerURL+"/address/"+wallet.accounts[0]}`} >
            <Image className="me-2"width={25} height={25} src="metamasklogo.svg"/> 
            {formatAddress2(wallet.accounts[0])} 
          </Button>
        </OverlayTrigger>
      </Nav.Item>
  }
  
  function handleSubmit(e: { preventDefault: () => void; target: any; }) {
    // Prevent the browser from reloading the page
    e.preventDefault();

    if (disabled == false)
      setTriggerTrue(); 

    setDisabled(!disabled);

    // Read the form data
    // const form = e.target;
    // const formData = new FormData(form);

    // // Or you can work with it as a plain object:
    // const formJson = Object.fromEntries(formData.entries());
    // console.log(formJson);
    
    // setConnector(event.target.value);
  }

  return (
    <Navbar sticky="top" bg="light" variant="light">
      <Container fluid>

        <Navbar.Brand className="d-flex align-items-center ms-2" as={Link} to="/">
          {logo}
          <h4 className="ms-2 mt-2">MARKETPLACE</h4>
        </Navbar.Brand>

        <Navbar.Collapse id="basic-navbar-nav">
          <Nav>
            { isUrl(connectorUrl) ? <Nav.Link as={Link} to="/identity" className='me-2 ms-2'>Identity</Nav.Link> :  "" }
            { isUrl(connectorUrl) ? <Nav.Link as={Link} to="/uploadasset" className='me-2 ms-2'>Upload</Nav.Link>  :  ""}
            { isUrl(connectorUrl) ? <Nav.Link as={Link} to="/publish" className='me-2 ms-2'>Publish</Nav.Link>  :  ""}
            {props.loggedIn ? <Nav.Link as={Link} to="/catalogue" className='me-2 ms-2'>Catalogue</Nav.Link> :  ""}
          </Nav>  
        </Navbar.Collapse>
        
        <Nav className='me-2'>
            <Form className="d-flex" onSubmit={handleSubmit}>
              <Badge bg="secondary" className="mx-2 my-auto" >Connector</Badge>
              <Form.Control name="connector" type="input" placeholder="Connector service url" className="me-2 my-auto" value={connectorUrl} disabled={disabled} onChange={e => setConnector(e.target.value)}/>
              <Button variant="outline-success" className="me-2 my-auto" type="submit">{disabled ? "Edit" : "Connect"}</Button>
            </Form>
          {metamaskNavItem}
          { props.loggedIn && 
            <Nav.Item className='ms-2 my-auto'>
              <Button  variant='outline-danger' onClick={handleLogout}>
                Log out
              </Button>
            </Nav.Item>
          }
        </Nav>
    </Container>
  </Navbar>
  );
}
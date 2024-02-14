// SPDX-FileCopyrightText: 2024 Fondazione LINKS
//
// SPDX-License-Identifier: GPL-3.0-or-later

import { useMetaMask } from '@/hooks/useMetaMask'
import { formatAddress2 } from '@/utils'
import { Link } from 'react-router-dom';
import { Badge, Image, Form, OverlayTrigger, Tooltip, Button, Navbar, Nav, Container, NavDropdown } from 'react-bootstrap';
import { useIdentity } from '@/hooks/useIdentity';
import { useAuth } from '@/hooks/useAuth';

import { useEffect, useState } from 'react';
import isUrl from 'is-url';
import { IoBagHandle } from "react-icons/io5";

export function Navigation() {

  const { wallet, hasProvider, isConnecting, connectMetaMask } = useMetaMask()
  const { clearSessionStorage, setTriggerTrue, connectorUrl, setConnector } = useIdentity();
  const [disabled, setDisabled] = useState(false);
  const baseExplorerURL = import.meta.env.VITE_EVM_EXPLORER;
  const {isAuthenticated, setIsAuthenticated}= useAuth();

  useEffect(() => {
    const logOut_accountchanged = () => {
      clearSessionStorage();
      localStorage.setItem("token", "false");
      setIsAuthenticated(false);
    } 

    window.ethereum.on('accountsChanged', logOut_accountchanged)
  })

  const handleLogout = () => {
    setDisabled(false);
    clearSessionStorage();
    localStorage.setItem("token", "false");
    setIsAuthenticated(false)
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
            <Image className="me-2"width={25} height={25} src="images/metamasklogo.svg"/> 
            {formatAddress2(wallet.accounts[0])} 
          </Button>
        </OverlayTrigger>
      </Nav.Item>
  }
  
  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    // Prevent the browser from reloading the page
    event.preventDefault();

    if (disabled == false) {
      // console.log("trigger");
      setTriggerTrue(); 
    }
    setDisabled(!disabled);

    // Read the form data
    // const form = event.target;
    // const formData = new FormData(form);

    // // Or you can work with it as a plain object:
    // const formJson = Object.fromEntries(formData.entries());
    // console.log(formJson);
    
    // setConnector(event.target.value);
  }

  return (
    <Navbar expand="lg" sticky="top" bg="light" variant="light">
      <Container fluid>

        <Navbar.Brand className="d-flex align-items-center ms-2" as={Link} to="/home">
          <IoBagHandle size="32"/>
          <h4 className="ms-2 mt-2">MARKETPLACE</h4>
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav>
            { isUrl(connectorUrl) ? <Nav.Link as={Link} to="/issuer" className='me-2 ms-2'>Issuer</Nav.Link> :  "" }
            { isUrl(connectorUrl) ? 
              <NavDropdown title="Connector" id="basic-nav-dropdown">
                <NavDropdown.Item as={Link} to="/uploadasset">Upload</NavDropdown.Item>
                <NavDropdown.Item as={Link} to="/publish">Publish</NavDropdown.Item>
                <NavDropdown.Item as={Link} to="/identity">Manage identity</NavDropdown.Item>
              </NavDropdown>  
              :  ""
            }
            { isUrl(connectorUrl) ? <Nav.Link as={Link} to="/self-catalogue" className='me-2 ms-2'>Self-Catalogue</Nav.Link> :  ""}
            { isUrl(connectorUrl) ? <Nav.Link as={Link} to="/login" className='me-2 ms-2'>Verifier</Nav.Link> :  ""}
            
          </Nav>  
        </Navbar.Collapse>
        
        <Nav className='me-2'>
            <Form className="d-flex" onSubmit={handleSubmit}>
              <Badge bg="secondary" className="mx-2 my-auto" >Connector</Badge>
              <Form.Control name="connector" type="input" placeholder="Connector service url" className="me-2 my-auto" value={connectorUrl} disabled={disabled} onChange={e => setConnector(e.target.value)}/>
              <Button variant="outline-success" className="me-2 my-auto" type="submit">{disabled ? "Edit" : "Connect"}</Button>
            </Form>
          {metamaskNavItem}
          { isAuthenticated && 
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
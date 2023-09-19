import 'bootstrap/dist/css/bootstrap.min.css';

import { Navigation } from './components/Navigation'
import { Display } from './components/Display'
import { Publish} from './components/Publish';

import { MetaMaskError } from './components/MetaMaskError'
import { MetaMaskContextProvider } from './hooks/useMetaMask'
import { Col, Container, Row, ToastContainer } from 'react-bootstrap';
import { Routes, Route, Navigate, useLocation } from 'react-router';
import { Identity } from './components/Identity';

import * as client from "@iota/client-wasm/web";
import * as identity from "@iota/identity-wasm/web";
import { UploadAsset } from './components/UploadAsset';
import { IdentityContextProvider } from './hooks/useIdentity';
import { IdentityToast } from './components/Identity/DisplayToast';
import { useState } from 'react';
import { Login } from './components/Login';
import { Catalogue } from './components/Catalogue';
import { ConnectorContextProvider } from '@/hooks/useConnector';


client
  .init("client_wasm_bg.wasm")
  .then(() => identity.init("identity_wasm_bg.wasm"));

export const App = () => {
  const { state } = useLocation();
  const [loggedIn, setLoggedIn] = useState(false);
  
  return (
    <MetaMaskContextProvider>
    <ConnectorContextProvider>
    <IdentityContextProvider>
        <Navigation loggedIn={loggedIn}/>
        <Container fluid>
        <Routes>
        <Route path="" element={
            loggedIn ?
            <Row>
              <ToastContainer>
                    <Display />
                    <IdentityToast />
              </ToastContainer>
            </Row>
            :
            <Navigate to="/login"/>
          }/>
          <Route path="/login" element={
              loggedIn ? <Navigate to="" /> : <Login />
          }/>
          <Route path="/register" element={
              <Identity />
          }/>
          <Route path="publish" element={
            loggedIn ?
            <>
                <Row className="d-flex justify-content-center">
                  <Col sm={4}>
                    <Display />
                    <IdentityToast />
                  </Col>
                  <Col sm={8}>
                    <Publish />
                  </Col>
                </Row>
                <Row className="fixed-bottom">
                  <MetaMaskError />
                </Row>
            </>
            : 
            <Navigate to="/login"/>
            }
          />
          <Route path="catalogue" element={
            loggedIn ?
              <Catalogue/>
            :
              <Navigate to="/login"/>
          } />
          <Route path="identity" element={
            loggedIn ?
            <>
              <Row className="d-flex justify-content-center">
                <Identity />
              </Row>
              <Row className="fixed-bottom">
                  <MetaMaskError />
              </Row>
            </>
            :
            <Navigate to="/login"/>
          } />
          <Route path="uploadasset" element={
            loggedIn ?
            <>
            <Row className="d-flex justify-content-center">
                <UploadAsset />
            </Row>
            <Row className="fixed-bottom">
                  <MetaMaskError />
            </Row>
            </>
            :
            <Navigate to="/login"/>
          } />
        </Routes>
      </Container>
    </IdentityContextProvider>
    </ConnectorContextProvider>
    </MetaMaskContextProvider>
  )
}
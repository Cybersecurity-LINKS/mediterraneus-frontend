import 'bootstrap/dist/css/bootstrap.min.css';
import { useState, useEffect } from 'react';
import { Container, Row, ToastContainer } from 'react-bootstrap';
import { Routes, Route, Navigate } from 'react-router';

import { MetaMaskError } from './components/MetaMaskError';
import { Navigation } from './components/Navigation';
import { Login } from './components/Login';
import { Display } from './components/Display';
import { UploadAsset } from './components/UploadAsset';
import { Publish} from './components/Publish';
import { Identity } from './components/Identity';
import { IdentityToast } from './components/Identity/DisplayToast';
import { Catalogue } from './components/Catalogue';

import { MetaMaskContextProvider } from './hooks/useMetaMask';
import { IdentityContextProvider } from './hooks/useIdentity';

import * as client from "@iota/client-wasm/web";
import * as identity from "@iota/identity-wasm/web";

client.init("client_wasm_bg.wasm").then(() => identity.init("identity_wasm_bg.wasm"));

export const App = () => {
  const [loggedIn, setLoggedIn] = useState(false);
  
  useEffect(() => {
    // TODO: remove/change sessionStorage usage, if you change manually the session storage you can navigate within the other web pages
    const loggedIn_ = sessionStorage.getItem("loggedIn");
    if (loggedIn_ === "true") {
      setLoggedIn(true);
    } else {
      setLoggedIn(false);
    }
  }, []);

  return (
    <MetaMaskContextProvider>
    <IdentityContextProvider>
        <Navigation loggedIn={loggedIn} setLoggedIn={setLoggedIn}/>
        <Container fluid>
          <Routes>
            <Route path="/" element={
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
                loggedIn ? <Navigate to="/" /> : <Login setLoggedIn={setLoggedIn} />
            }/>
            <Route path="/register" element={
                <Identity />
            }/>
            <Route path="publish" element={
                <Row className="d-flex justify-content-center">
                  <Publish/>
                </Row>
              }
            />
            <Route path="catalogue" element={
              loggedIn ?
                <Catalogue/>
              :
                <Navigate to="/login"/>
            } />
            <Route path="identity" element={
                <Row className="d-flex justify-content-center">
                  <Identity />
                </Row>
            } />
            <Route path="uploadasset" element={
              <Row className="d-flex justify-content-center">
                  <UploadAsset />
              </Row>

            } />
          </Routes>
        <Row className="fixed-bottom">
          <MetaMaskError />
        </Row>
      </Container>
    </IdentityContextProvider>
    </MetaMaskContextProvider>
  )
}
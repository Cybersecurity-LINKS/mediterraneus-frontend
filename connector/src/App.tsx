import 'bootstrap/dist/css/bootstrap.min.css';

import { Navigation } from './components/Navigation'
import { Display } from './components/Display'
import { Catalogue } from './components/Catalogue'
import { Publish} from './components/Publish';

import { MetaMaskError } from './components/MetaMaskError'
import { MetaMaskContextProvider } from './hooks/useMetaMask'
import { Col, Container, Row, ToastContainer } from 'react-bootstrap';
import { Routes, Route } from 'react-router';
import { Identity } from './components/Identity';

import * as client from "@iota/client-wasm/web";
import * as identity from "@iota/identity-wasm/web";
import { UploadAsset } from './components/UploadAsset';
import { IdentityContextProvider } from './hooks/useIdentity';
import { IdentityToast } from './components/Identity/DisplayToast';

client
  .init("client_wasm_bg.wasm")
  .then(() => identity.init("identity_wasm_bg.wasm"));

export const App = () => {
  return (
    <MetaMaskContextProvider>
    <IdentityContextProvider>
        <Navigation />
        <Container fluid>
        <Routes>
          <Route path="" element={
            <Row>
              <ToastContainer>
                    <Display />
                    <IdentityToast />
              </ToastContainer>
            </Row>
          }/>
          <Route path="publish" element={
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
            }
          />
          <Route path="catalogue" element={
            <Catalogue/>
          } />
          <Route path="identity" element={
            <>
              <Row className="d-flex justify-content-center">
                {/* <Col sm={4}><Display /></Col> */}
                {/* <Col sm={8}><Identity /></Col> */}
                <Identity />
              </Row>
              <Row className="fixed-bottom">
                  <MetaMaskError />
              </Row>
            </>
          } />
          <Route path="uploadasset" element={
            <>
            <Row className="d-flex justify-content-center">
                <UploadAsset />
            </Row>
            <Row className="fixed-bottom">
                  <MetaMaskError />
            </Row>
            </>
          } />
        </Routes>
      </Container>
    </IdentityContextProvider>
    </MetaMaskContextProvider>
  )
}
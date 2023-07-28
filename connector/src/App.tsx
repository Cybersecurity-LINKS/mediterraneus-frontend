import 'bootstrap/dist/css/bootstrap.min.css';

import { Navigation } from './components/Navigation'
import { Display } from './components/Display'
import { Catalogue } from './components/Catalogue'
import { Publish} from './components/Publish';

import { MetaMaskError } from './components/MetaMaskError'
import { MetaMaskContextProvider, useMetaMask } from './hooks/useMetaMask'
import { Col, Container, Row, ToastContainer } from 'react-bootstrap';
import { Routes, Route } from 'react-router';
import { Identity } from './components/Identity';

import * as client from "@iota/client-wasm/web";
import * as identity from "@iota/identity-wasm/web";

client
  .init("client_wasm_bg.wasm")
  .then(() => identity.init("identity_wasm_bg.wasm"));

export const App = () => {

  return (
    <MetaMaskContextProvider>
        <Navigation />
        <Container fluid>
        <Routes>
          <Route path="" element={
            <Row>
              <ToastContainer>
                    <Display />
              </ToastContainer>
            </Row>
          }/>
          <Route path="publish" element={
            <>
                <Row className="d-flex justify-content-center">
                  <Col sm={4}>
                    <Display />
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
        </Routes>
      </Container>
        
    </MetaMaskContextProvider>
  )
}
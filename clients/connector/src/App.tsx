import 'bootstrap/dist/css/bootstrap.min.css';

import { Navigation } from './components/Navigation'
import { Display } from './components/Display'
import { Catalogue } from './components/Catalogue'
import { Publish} from './components/Publish';

import { MetaMaskError } from './components/MetaMaskError'
import { MetaMaskContextProvider } from './hooks/useMetaMask'
import { Container, Row } from 'react-bootstrap';
import { Routes, Route } from 'react-router';

export const App = () => {

  return (
    <MetaMaskContextProvider>
        <Navigation />
        <Container fluid>
        <Routes>
          {/* <Route path="users" element={<Users />}>
            <Route path=":id" element={<UserProfile />} />
          </Route> */}
          <Route path="" element={
            <Row>
              <Display />
            </Row>
          }/>
          <Route path="publish" element={
            <>
              <Row>
                <Display />
                <Row className="d-flex justify-content-center mt-3"> 
                  <Publish />
                </Row>
              </Row>
            
              <Row className="fixed-bottom">
                <MetaMaskError />
              </Row>
            </>
            }
          />
          <Route path="catalogue" element={<Catalogue/>} />
        </Routes>
      </Container>
        
    </MetaMaskContextProvider>
  )
}
import 'bootstrap/dist/css/bootstrap.min.css';

import { Navigation } from './components/Navigation'
import { Display } from './components/Display'
import { MetaMaskError } from './components/MetaMaskError'
import { MetaMaskContextProvider } from './hooks/useMetaMask'
import { Container, Row } from 'react-bootstrap';
import Publish from './components/Publish/Publish';

export const App = () => {

  return (
    <MetaMaskContextProvider>
        <Navigation />
        <Container fluid>
          <Row>
            <Display />
            <Row className="d-flex justify-content-center mt-3"> 
              <Publish />
              {/* application */}
            </Row>
          </Row>
          <Row className="fixed-bottom">
            <MetaMaskError />
          </Row>
        </Container>
    </MetaMaskContextProvider>
  )
}
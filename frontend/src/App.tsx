import 'bootstrap/dist/css/bootstrap.min.css';
import { Col, Container, Row } from 'react-bootstrap';
import { Navigate, Outlet, RouterProvider } from 'react-router';
import { createBrowserRouter } from 'react-router-dom';

import { Error } from './components/Error';
import { Navigation } from './components/Navigation';
import { Login } from './components/Verifier';
import { UploadAsset } from './components/UploadAsset';
import { Publish} from './components/Publish';
import { Identity } from './components/Issuer';
import { Catalogue } from './components/Catalogue';
import { SideBar } from './components/Sidebar';

import { MetaMaskContextProvider } from './hooks/useMetaMask';
import { IdentityContextProvider } from './hooks/useIdentity';
import { AuthContextProvider, useAuth } from './hooks/useAuth';

import * as client from "@iota/client-wasm/web";
import * as identity from "@iota/identity-wasm/web";
import { ErrContextProvider } from './hooks/useError';

client.init("libraries/client_wasm_bg.wasm").then(() => identity.init("libraries/identity_wasm_bg.wasm"));

function Layout() {
  return (
    <>
      <ErrContextProvider>
      <MetaMaskContextProvider>
      <AuthContextProvider>
      <IdentityContextProvider>
            <Navigation/>
            <Container fluid>  
              <Row>
                <Col md={3}>
                  <SideBar />
                </Col>       
                <Col md={9}>
                  <Outlet /> {/* 2️⃣ Render the app routes via the Layout Outlet */}
                </Col>
              </Row>
              <Row className="fixed-bottom">
                <Col className="mx-4 mb-2"><Error/></Col>
              </Row>
            </Container>
      </IdentityContextProvider>
      </AuthContextProvider>
      </MetaMaskContextProvider>
      </ErrContextProvider>
    </>
  );
}

const ProtectedRoute = (props: {redirectPath: string,  children?:  React.ReactElement}) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to={props.redirectPath} replace />;
  }

  return props.children ? props.children : <Outlet />;
};

export const App = () => {

  const router = createBrowserRouter([  // 🆕
    { element: <Layout/>,  /* 1️⃣ Wrap your routes in a pathless layout route */
      children: [
        { path: "/home", element: <></> }, 
        { path: "/login", Component: Login }, 
        { path: "/issuer", Component: Identity },
        { path: "/uploadasset", Component: UploadAsset },
        { path: "/publish", Component: Publish },
        { path: "/register", Component: Identity },
        { path: "/public-catalogue", element: <Catalogue/> },
        { element: <ProtectedRoute redirectPath="/home" />,
          children: [
            { path: "/protected-catalogue", element: <Catalogue/> },
          ]
        },
      ]
    },
    { path:"*", Component: () => <h1>404</h1> }
  ]);

  return <RouterProvider router={router} />;
}
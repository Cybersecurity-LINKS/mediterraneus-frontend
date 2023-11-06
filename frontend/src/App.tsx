import 'bootstrap/dist/css/bootstrap.min.css';
import { useState, useEffect } from 'react';
import { Col, Container, Row } from 'react-bootstrap';
import { Navigate, Outlet, RouterProvider } from 'react-router';

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
import { AuthContextProvider, useAuth } from './hooks/useAuth';

import * as client from "@iota/client-wasm/web";
import * as identity from "@iota/identity-wasm/web";
import { createBrowserRouter } from 'react-router-dom';

client.init("libraries/client_wasm_bg.wasm").then(() => identity.init("libraries/identity_wasm_bg.wasm"));

function Layout() { // TODO: create a sidebar
  return (
    <>
      <MetaMaskContextProvider>
        <AuthContextProvider>
          <IdentityContextProvider>
            <Navigation/>
            <Container fluid>        
              {/* 2️⃣ Render the app routes via the Layout Outlet */}
              <Outlet />
              <Row className="fixed-bottom">
                <MetaMaskError />
              </Row>
            </Container>
          </IdentityContextProvider>
        </AuthContextProvider>
      </MetaMaskContextProvider>
    </>
  );
}

const ProtectedRoute = (props: {redirectPath: string,  children?: any}) => {
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
        { path: "/", Component: Login }, 
        { path: "/register", Component: Identity },
        { path: "/publish", Component: Publish },
        { path: "/identity", Component: Identity },
        { path: "/uploadasset", Component: UploadAsset },
        { element: <ProtectedRoute redirectPath="/" />,
          children: [
            { path: "/home", 
              element:  // TODO: create a sidebar and remove this
                <Col>
                  <Row><Display/></Row>
                  <Row><IdentityToast/></Row>
                </Col> 
            },
            { path: "/catalogue", element: <Catalogue/> },
          ]
        },
      ]
    },
    { path:"*", Component: () => <h1>404</h1> }
  ]);

  return <RouterProvider router={router} />;
}
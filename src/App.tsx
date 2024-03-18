// SPDX-FileCopyrightText: 2024 Fondazione LINKS
//
// SPDX-License-Identifier: GPL-3.0-or-later

import 'bootstrap/dist/css/bootstrap.min.css';
import { Col, Container, Row } from 'react-bootstrap';
import { Navigate, Outlet, RouterProvider } from 'react-router';
import { createBrowserRouter } from 'react-router-dom';

import { Error } from './components/Error';
import { Navigation } from './components/Navigation';
import { Login } from './components/Verifier';
import { UploadAsset } from './components/UploadAsset';
import { Publish} from './components/Publish';
import { Issuer } from './components/Issuer';
import { Catalogue } from './components/Catalogue';
import { SideBar } from './components/Sidebar';

import { MetaMaskContextProvider } from './hooks/useMetaMask';
import { IdentityContextProvider } from './hooks/useIdentity';
import { AuthContextProvider, useAuth } from './hooks/useAuth';
import { ErrContextProvider } from './hooks/useError';

import init from "@iota/sdk-wasm/web";
import * as identity from "@iota/identity-wasm/web";

init()
.then(() => identity.init()).catch(console.error);

function Layout() {
  return (
    <>
      <ErrContextProvider>
      <MetaMaskContextProvider>
      <AuthContextProvider>
      <IdentityContextProvider>
        <Navigation/>
        <Container>  
          <Row className="justify-content-between mt-5">
            <Col sm={3}>
              <SideBar />
            </Col>      
            <Col sm={9} >
              <Container className="justify-content-center" fluid>
                <Outlet /> {/* 2️⃣ Render the app routes via the Layout Outlet */}
              </Container>
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
        { path: "/", element: <></> }, 
        { path: "/login", Component: Login }, // Verifier page
        { path: "/issuer", Component: Issuer },
        { path: "/uploadasset", Component: UploadAsset },
        { path: "/publish", Component: Publish },
        { path: "/register", Component: Issuer },
        { path: "/self-catalogue", element: <Catalogue/> },
        { element: <ProtectedRoute redirectPath="/home" />,
          children: [
            { path: "/protected-catalogue", element: <Catalogue/> },
          ]
        },
      ], 
    },
    { path:"*", Component: () => <h1 className='position-absolute top-50 start-50 translate-middle'>404</h1> }
 
  ]);

  return <RouterProvider router={router} />;
}
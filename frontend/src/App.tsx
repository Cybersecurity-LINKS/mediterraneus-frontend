import 'bootstrap/dist/css/bootstrap.min.css';
import { useState, useEffect } from 'react';
import { Col, Container, Row, ToastContainer } from 'react-bootstrap';
import { Routes, Route, Navigate, Outlet, RouterProvider } from 'react-router';

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
import { createBrowserRouter } from 'react-router-dom';

client.init("libraries/client_wasm_bg.wasm").then(() => identity.init("libraries/identity_wasm_bg.wasm"));

function Layout(props: any) { // TODO: create a sidebar
  return (
    <>
      <MetaMaskContextProvider>
      <IdentityContextProvider>
        <Navigation loggedIn={props.loggedIn} setLoggedIn={props.setLoggedIn}/>
        <Container fluid>        
          {/* 2️⃣ Render the app routes via the Layout Outlet */}
          <Outlet />
          <Row className="fixed-bottom">
            <MetaMaskError />
          </Row>
        </Container>
      </IdentityContextProvider>
      </MetaMaskContextProvider>
    </>
  );
}

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

  // TODO: create common protected component
  const router = createBrowserRouter([  // 🆕
    { element: <Layout loggedIn={loggedIn} setLoggedIn={setLoggedIn}/>,  /* 1️⃣ Wrap your routes in a pathless layout route */
      children: [
        { path: "/register", Component: Identity },
        { path: "/publish", Component: Publish },
        { path: "/identity", Component: Identity },
        { path: "/uploadasset", Component: UploadAsset },
        { path: "/", element: loggedIn ? // TODO: create a sidebar and remove this
                <Col>
                  <Row><Display /></Row>
                  <Row><IdentityToast /></Row>
                </Col>
                :
                <Navigate to="/login"/>
        },
        { path: "/login", element: loggedIn ? <Navigate to="/" /> : <Login setLoggedIn={setLoggedIn} /> }, 
        { path: "/catalogue", element:loggedIn ? <Catalogue/> : <Navigate to="/login"/> },
      ]
    },
    { path:"*", Component: () => <h1>404</h1>}
  ]);

  return <RouterProvider router={router} />;
}
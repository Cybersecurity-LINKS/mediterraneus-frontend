// SPDX-FileCopyrightText: 2024 Fondazione LINKS
//
// SPDX-License-Identifier: GPL-3.0-or-later

import { useIdentity } from '@/hooks/useIdentity'
import { useMetaMask } from '@/hooks/useMetaMask';
import { parseJwt, removeCenterOfStr } from '@/utils';
import isUrl from 'is-url';
import { useState } from 'react';
import { Alert, Button, Card, Col, OverlayTrigger, Row, Spinner, Stack, Tooltip } from 'react-bootstrap'
import { Link } from 'react-router-dom';
import connectorAPI from '@/api/connectorAPIs';
import { VerticallyCenteredModal } from '../VerticallyCenteredModal';

function CardContent() {
  const { wallet } = useMetaMask();
  const { did, didDoc, vc, setTriggerTrue, connectorUrl } = useIdentity();
  const [cretingIdentityLoading, setCreatingIdentity] = useState(false);
  const [credentialModalShow, setCredentialModalShow] = useState(false);
  const [copied, setCopied] = useState(false);
  
  //TODO: why don't use hooks for setting the did and vc and do that call there? 
  const createDID = async () => {
    try {
        setCreatingIdentity(true);
        console.log("Wallet address: ", wallet.accounts[0]);
        await connectorAPI.createDID(connectorUrl, wallet.accounts[0]);
        setTriggerTrue();
        setCreatingIdentity(false);
    } catch (error) {
        console.log(error)
        setCreatingIdentity(false);
        throw error;
    }
  }

  return (
    <>
      <Row className="mt-3">
        <h5>Decentralized Identifier</h5>
        { cretingIdentityLoading 
          ?// true
          <Spinner variant="primary" className='mx-auto'/>
          :// false 
          did == undefined && didDoc == undefined
          ? // true
            <Row className='justify-content-md-center'>
              <Col md="auto">
                <Button className="my-2 mx-auto" onClick={createDID}>Create DID</Button>
              </Col>  
            </Row> 
          : // false
          <>
          <Row>
            <Stack direction="horizontal" gap={3}>
              <OverlayTrigger placement="right" delay={{ show: 200, hide: 200 }} overlay={<Tooltip>Open in explorer</Tooltip>}>          
                <Link  target="_blank" to={`https://explorer.iota.org/testnet/search/${did?.toString()}`} style={{ textDecoration: 'none' }}>
                  {did!.toString()}</Link> 
              </OverlayTrigger>
              <OverlayTrigger placement="bottom" 
                delay={{ show: 250, hide: 400 }} 
                overlay={<Tooltip id="button-tooltip">{copied ? "Copied!" : "Copy"}</Tooltip>}
                onExited={()=>setCopied(false)}
              >
                <Button size="sm" variant="outline-dark" onClick={() => {
                  navigator.clipboard.writeText(did!.toString()); 
                  setCopied(true);
                }}>
                  <i className="bi bi-copy"/>
                </Button>
              </OverlayTrigger>
            </Stack>
          </Row>
          </>
          
        }
      </Row>
      <Row className="mt-3">
        <h5>Verifiable Credentials</h5>
        { 
          vc == undefined 
          ? // true
          <Link style={{textDecoration: 'none'}} to="/issuer">Contact the Issuer and join</Link>
          : // false
          <>  
              <Row >
                <Stack direction="horizontal" gap={3}>
                  
                  {/* <i className="bi bi-person-vcard"/>Credential */}
                  <OverlayTrigger placement="right" delay={{ show: 200, hide: 200 }} overlay={<Tooltip>Show Credential</Tooltip>}>          
                    <Button size="sm" variant="outline-dark" onClick={() => setCredentialModalShow(true)}>
                    <i className="bi bi-person-vcard"/>
                    </Button>
                  </OverlayTrigger>
                  <VerticallyCenteredModal 
                    show={credentialModalShow}
                    onHide={() => setCredentialModalShow(false)}
                    title={"Verifiable Credential"}
                    body={parseJwt(vc.toString())}
                  />
                </Stack>
              </Row>
          </>
        }        
      </Row>
      </>
  );
}

export const IdentityCard = () => {
  const { connectorUrl } = useIdentity();
  return (
      <Card className='mt-3 ms-3' >
        <Card.Header><i className="bi bi-fingerprint"/><strong>Identity</strong></Card.Header>
        <Card.Body>
          { isUrl(connectorUrl) ? <CardContent/> : <Alert className="my-auto" variant="danger">Connector URL missing or not connected!</Alert> }
        </Card.Body>
      </Card>
  );
}
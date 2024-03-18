// SPDX-FileCopyrightText: 2024 Fondazione LINKS
//
// SPDX-License-Identifier: GPL-3.0-or-later

import { useIdentity } from '@/hooks/useIdentity'
import { useMetaMask } from '@/hooks/useMetaMask';
import { removeCenterOfStr } from '@/utils';
import isUrl from 'is-url';
import { useState } from 'react';
import { Alert, Button, Card, Col, OverlayTrigger, Row, Spinner, Tooltip } from 'react-bootstrap'
import { Link } from 'react-router-dom';
import connectorAPI from '@/api/connectorAPIs';
import { VerticallyCenteredModal } from '../VerticallyCenteredModal';
import { IoFingerPrint, IoIdCard } from "react-icons/io5";


function CardContent() {
  const { wallet } = useMetaMask();
  const { did, didDoc, vc, setTriggerTrue, connectorUrl } = useIdentity();
  const [cretingIdentityLoading, setCreatingIdentity] = useState(false);
  const [credentialModalShow, setCredentialModalShow] = useState(false);

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
            <OverlayTrigger placement="right" delay={{ show: 200, hide: 200 }} overlay={<Tooltip>Open in explorer</Tooltip>}>          
              <Link target="_blank" to={`https://explorer.iota.org/testnet/search/${did?.toString()}`} style={{ textDecoration: 'none' }}>{removeCenterOfStr(did!.toString(), 21, 74)}</Link> 
            </OverlayTrigger>
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
            <Card key="Credential" bg="light" border="secondary" style={{ width: '16rem'}} className="mx-auto">
              <Row className='g-0'>
                  <Col md="4" className="my-auto">
                    <IoIdCard size="64"/>
                  </Col>
                  <Col md="8">
                    <Card.Body>
                      <Card.Title> Your <br/> Credential </Card.Title>
                      <OverlayTrigger placement="right" delay={{ show: 200, hide: 200 }} overlay={<Tooltip>Show Credential</Tooltip>}>          
                        <Button variant="outline-secondary" className="me-2" onClick={() => setCredentialModalShow(true)}>Show</Button>
                      </OverlayTrigger>
                      <VerticallyCenteredModal 
                        show={credentialModalShow}
                        onHide={() => setCredentialModalShow(false)}
                        title={"Verifiable Credential"}
                        body={JSON.stringify(vc, null, 2)}
                      />
                    </Card.Body>
                  </Col>
              </Row>
            </Card>
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
        <Card.Header><IoFingerPrint size="32"/><strong className="ms-2">Identity</strong></Card.Header>
        <Card.Body>
          { isUrl(connectorUrl) ? <CardContent/> : <Alert className="my-auto" variant="danger">Connector URL missing or not connected!</Alert> }
        </Card.Body>
      </Card>
  );
}
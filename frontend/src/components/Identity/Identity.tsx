import { useMetaMask } from "@/hooks/useMetaMask";
import { extractNumberFromVCid, getIdentitySC } from "@/utils";
import { Credential } from "@iota/identity-wasm/web"
import { ContractTransactionResponse, ethers } from "ethers";
import { Button, Card, Container, Form, Spinner } from "react-bootstrap";
import { IdentityAccordion } from "./IdentityAccordion";
import { useIdentity } from "@/hooks/useIdentity";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { Col, Row, Alert, OverlayTrigger, Tooltip, Figure } from 'react-bootstrap';
import {formatDid} from '@/utils';
import isUrl from 'is-url';

const issuer_api = import.meta.env.VITE_ISSUER_API as string;

export const Identity = () => {
    const { state } = useLocation();
    const navigate = useNavigate();

    const { provider, wallet, isConnecting, connectMetaMask } = useMetaMask();
    const { did, didDoc, vc, setTriggerTrue, loading, connectorUrl, setConnector } = useIdentity();

    const [cretingIdentity, setCreatingIdentity] = useState(false);

    const createIdentity_ext = async (event: any) => {
        if (!isUrl(connectorUrl)) {
            throw "Connector url missing";
        }

        try {
            event.preventDefault();
            setCreatingIdentity(true);
            console.log("Wallet address: ", wallet.accounts[0]);
            const response = await fetch(`${connectorUrl}/identities`, {
                method: 'POST',
                headers: {
                "Content-type": "application/json"
                },
                body: JSON.stringify({eth_address: wallet.accounts[0]}) 
            });
            await response.json().then(resp => {
                console.log(resp.did, did)
                setTriggerTrue();
                setCreatingIdentity(false);
            });
        } catch (error) {
            console.log(error)
            setCreatingIdentity(false);
            throw error;
        }
    }

    const requestVC = async () => {
        if (did === undefined) {
            throw "DID missing";
        }
        try {
            setCreatingIdentity(true);
            // TODO: issuer url
            const response = await fetch(`${issuer_api}/challenges?did=${did!.toString()}`);
            if (!response.ok) {
                console.log("Request already present");
                throw response.json();
            }
            // TODO: throw and catch error if response is not ok
            const nonce = (await response.json()).nonce;
            console.log("challenge: ", nonce);
            const responseSign = await fetch(`${connectorUrl}/identities/${wallet.accounts[0]}/sign-data`, {
                method: 'POST',
                headers: {
                    "Content-type": "application/json"
                },
                body: JSON.stringify({payload: nonce}) 
            });
            const json_sign = await responseSign.json();
            console.log("ssi signature: ", json_sign.ssi_signature);
            const signer = await provider?.getSigner();
            const pseudo_sign = await signer?.signMessage(nonce);
            const inactiveVC_response = await fetch(`${issuer_api}/credentials`, {
                method: 'POST',
                headers: {
                    "Content-type": "application/json"
                },
                body: JSON.stringify({
                    did: did!.toString(),
                    nonce: nonce,
                    ssi_signature: json_sign.ssi_signature.toString(),
                    pseudo_sign: pseudo_sign
                })
            }); 
            const inactiveVC_json = await inactiveVC_response.json();
            const vc_cred = Credential.fromJSON(JSON.parse(inactiveVC_json.vc))
            const vc_numId = extractNumberFromVCid(vc_cred);
            console.log("VC id:", ethers.toBigInt(vc_numId))

            const IDSC_istance = await getIdentitySC(provider!);
            let tx: ContractTransactionResponse = await IDSC_istance.activateVC(ethers.toBigInt(vc_numId));
            await tx.wait();
            // store VC in connector's backend.
            const storeVCresp = await fetch(`${connectorUrl}/identities/${wallet.accounts[0]}`, {
                method: 'PATCH',
                headers: {
                    "Content-type": "application/json"
                },
                body: JSON.stringify({
                    vc: vc_cred?.toJSON(),
                })
            });
            if(!storeVCresp.ok || storeVCresp.status != 201)
                throw Error("Cannot store VC");
            setTriggerTrue();
            setCreatingIdentity(false);
        } catch (error) {
            console.log(error);
            setCreatingIdentity(false);
            throw error;
        }
    }

    const gotoLogin = async () => {
        navigate("/login");
    }

    return (
        <>
            {
                loading ? 
                <Container className="d-flex justify-content-center"><Spinner animation="grow" variant="warning" style={{
                    width: '5rem', 
                    height: '5rem', 
                    position: 'absolute', 
                    justifyContent: 'center',
                    flex: 1,
                    alignItems: 'center',
                    marginTop: 270,
                }}/></Container>
                :
                cretingIdentity ? <Container className="d-flex justify-content-center"><Spinner animation="border" variant="success" style={{
                    width: '5rem', 
                    height: '5rem', 
                    position: 'absolute', 
                    justifyContent: 'center',
                    flex: 1,
                    alignItems: 'center',
                    marginTop: 270,
                }}/></Container> : 
                <Container fluid className="d-flex mt-3 justify-content-center">
                    <Card style={{width: '70rem'}} className='d-flex justify-content-center mb-5 mt-3'>
                        <Card.Body className='mb-2 mt-3 ms-auto me-auto'>
                            <Card.Title>Self-Sovereign Identity</Card.Title>
                        </Card.Body>
                        {
                            (state !== null) && state.fromLogin && !cretingIdentity && ((vc as Credential) !== undefined) && (did !== undefined) && (
                                <Col className="mb-3 ms-auto me-auto" sm={{span:3, offset:4}}>
                                    <Button style={{width: '100%'}} variant="outline-success" onClick={gotoLogin}>
                                        Go to Login
                                    </Button>
                                </Col>

                            )
                        }
                        {
                            did === undefined 
                            ? // true
                            <>                            
                                <IdentityAccordion title={"Decentralized IDentifier"} content={"No Decentralized IDentifier available. Please create one."} />  
                                <Button className="mb-2 mt-3 ms-auto me-auto" onClick={createIdentity_ext}>Create DID on Connector</Button>
                            </>
                            : // false
                            <>
                                <IdentityAccordion title={"Decentralized IDentifier"} content={did.toString() +"\n"+ JSON.stringify(didDoc, null, 2)} />
                            </>
                        }
                        {
                            ((vc as Credential) === undefined) 
                            ? // true
                            <>
                                <IdentityAccordion title={"Verifiable Credential"} content={"No Verifiable Credential available. Please request one."} />
                                <Button className="mb-2 mt-3 ms-auto me-auto" onClick={requestVC}>Request VC to the Issuer</Button>
                            </>
                            :
                            <IdentityAccordion title={"Verifiable Credential"} content={JSON.stringify(vc, null, 2)} />
                        }
                    </Card>
                </Container>
            }
        </>
    )
}
import { Col, Button, Card, Container, Spinner } from "react-bootstrap";
import { useLocation, useNavigate } from "react-router";
import { useState } from "react";

import { IdentityAccordion } from "./IdentityAccordion";

import { ContractTransactionResponse, ethers } from "ethers";
import { Credential } from "@iota/identity-wasm/web"
import { extractNumberFromVCid, getIdentitySC } from "@/utils";

import { useMetaMask } from "@/hooks/useMetaMask";
import { useIdentity } from "@/hooks/useIdentity";

import issuerAPI from "@/api/issuerAPIs";
import connectorAPI from "@/api/connectorAPIs";

export const Identity = () => {
    const navigate = useNavigate();
    const { state } = useLocation();
    const { provider, wallet } = useMetaMask();
    const { did, didDoc, vc, setTriggerTrue, loading, connectorUrl, setConnector } = useIdentity();

    const [cretingIdentityLoading, setCreatingIdentity] = useState(false);

    //TODO: why don't use hooks for setting the did and vc and do that call there? 
    const createDID = async (event: any) => {
        event.preventDefault();
        try {
            setCreatingIdentity(true);
            console.log("Wallet address: ", wallet.accounts[0]);
            await connectorAPI.createDID(connectorUrl,  wallet.accounts[0]);
            setTriggerTrue();
            setCreatingIdentity(false);
        } catch (error) {
            console.log(error)
            setCreatingIdentity(false);
            throw error;
        }
    }

    const requestCredential = async () => {
        if (did === undefined) {
            throw "DID missing";
        }
        try {
            setCreatingIdentity(true);
            const nonce = await issuerAPI.getChallenge(did!.toString());
            const identitySignature = await connectorAPI.signData(
                connectorUrl, 
                wallet.accounts[0], 
                nonce
            );
            const signer = await provider?.getSigner();
            const walletSignature = await signer?.signMessage(nonce);
            const credential = await issuerAPI.requestCredential(
                did!.toString(), 
                nonce, 
                identitySignature,
                walletSignature!
            );
            const credentialId = extractNumberFromVCid(Credential.fromJSON(credential));
            console.log("VC id:", ethers.toBigInt(credentialId))

            const IDSC_istance = await getIdentitySC(provider!);
            let tx: ContractTransactionResponse = await IDSC_istance.activateVC(ethers.toBigInt(credentialId));
            await tx.wait();
            await connectorAPI.storeCredential(
                connectorUrl,
                wallet.accounts[0],
                credential
            );
            setTriggerTrue();
            setCreatingIdentity(false);
        } catch (error) {
            console.log(error);
            setCreatingIdentity(false);
            throw error;
        }
    }

    return (
        <>
            {
                loading ? 
                <Container className="d-flex justify-content-center">
                    <Spinner animation="grow" variant="warning" style={{
                        width: '5rem', 
                        height: '5rem', 
                        position: 'absolute', 
                        justifyContent: 'center',
                        flex: 1,
                        alignItems: 'center',
                        marginTop: 270,
                    }}/>
                </Container>
                :
                cretingIdentityLoading ? 
                <Container className="d-flex justify-content-center">
                    <Spinner animation="border" variant="success" style={{
                        width: '5rem', 
                        height: '5rem', 
                        position: 'absolute', 
                        justifyContent: 'center',
                        flex: 1,
                        alignItems: 'center',
                        marginTop: 270,
                    }}/>
                </Container> : 
                <Container fluid className="d-flex mt-3 justify-content-center">
                    <Card style={{width: '70rem'}} className='d-flex justify-content-center mb-5 mt-3'>
                        <Card.Body className='mb-2 mt-3 ms-auto me-auto'>
                            <Card.Title>Self-Sovereign Identity</Card.Title>
                        </Card.Body>
                        {
                            (state !== null) && state.fromLogin && !cretingIdentityLoading && ((vc as Credential) !== undefined) && (did !== undefined) && (
                                <Col className="mb-3 ms-auto me-auto" sm={{span:3, offset:4}}>
                                    <Button style={{width: '100%'}} variant="outline-success" onClick={()=>navigate("/login")}>
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
                                <Button className="mb-2 mt-3 ms-auto me-auto" onClick={createDID}>Create DID on Connector</Button>
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
                                <Button className="mb-2 mt-3 ms-auto me-auto" onClick={requestCredential}>Request VC to the Issuer</Button>
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
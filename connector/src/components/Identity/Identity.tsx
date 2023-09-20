import { useMetaMask } from "@/hooks/useMetaMask";
import { extractNumberFromVCid, getIdentitySC } from "@/utils";
import { Credential } from "@iota/identity-wasm/web"
import { ContractTransactionResponse, ethers } from "ethers";
import { Button, Card, Container, Form, Spinner } from "react-bootstrap";
import { IdentityAccordion } from "./IdentityAccordion";
import { useIdentity } from "@/hooks/useIdentity";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { useConnector } from "@/hooks/useConnector";

export const Identity = () => {
    const { state } = useLocation();
    const navigate = useNavigate();
    const { provider, wallet, isConnecting, connectMetaMask } = useMetaMask();
    const { did, didDoc, vc, setTriggerTrue, loading } = useIdentity();
    const { connectorUrl, setConnector } = useConnector();

    const [cretingIdentity, setCreatingIdentity] = useState(false);
 
    const createIdentity_ext = async (event: any) => {
        try {
            event.preventDefault();
            setCreatingIdentity(true);
            console.log(wallet.accounts[0]);
            const response = await fetch(`${connectorUrl}/identity`, {
            method: 'POST',
            headers: {
              "Content-type": "application/json"
            },
            body: JSON.stringify({eth_address: wallet.accounts[0]}) 
          });
          await response.json().then(resp => {
            console.log(resp.did)
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
        try {
            setCreatingIdentity(true);
            const response = await fetch('http://localhost:3213/api/identity', {
                method: 'POST',
                headers: {
                    "Content-type": "application/json"
                },
                body: JSON.stringify({did: did!.toString()})   
            });
            const json_resp = await response.json();
            console.log(json_resp);
            const vcHash = `${json_resp.vchash}`;

            const responseSign = await fetch(`${connectorUrl}/signdata`, {
                method: 'POST',
                headers: {
                    "Content-type": "application/json"
                },
                body: JSON.stringify({eth_address: wallet.accounts[0], vchash: vcHash}) 
            });
            const json_sign = await responseSign.json();
            console.log(json_sign);
            // const ssi_signature = privKeytoBytes(json_sign.ssi_signature)
            // if(ssi_signature === undefined || ssi_signature.length != 64) { // hex len = 64 * 2
            //     console.log("Signature undefined or invalid");
            //     throw Error("Signature undefined or invalid");
            // }
            const signer = await provider?.getSigner();
            const pseudo_sign = await signer?.signMessage(ethers.toBeArray(`${vcHash}`))
        
            const inactiveVC_response = await fetch('http://localhost:3213/api/identity/2', {
                method: 'POST',
                headers: {
                    "Content-type": "application/json"
                },
                body: JSON.stringify({
                    vc_hash: vcHash,
                    ssi_signature: json_sign.ssi_signature.toString(),
                    pseudo_sign: pseudo_sign
                })
            }) 
            const inactiveVC_json = await inactiveVC_response.json();
            const vc_cred = Credential.fromJSON(JSON.parse(inactiveVC_json.vc))
            const vc_numId = extractNumberFromVCid(vc_cred);
            console.log(ethers.toBigInt(vc_numId))

            const IDSC_istance = await getIdentitySC(provider!);
            let tx: ContractTransactionResponse = await IDSC_istance.activateVC(ethers.toBigInt(vc_numId));
            await tx.wait();
            // store VC in connector's backend.
            const storeVCresp = await fetch(`${connectorUrl}/storeVC`, {
                method: 'POST',
                headers: {
                    "Content-type": "application/json"
                },
                body: JSON.stringify({
                    eth_address: wallet.accounts[0],
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

    const downloadIdentity = async () => {
        const response = await fetch(`${connectorUrl}/identitymaterial/${wallet.accounts[0]}`, {
            method: 'GET',
            headers: {
                "Content-type": "application/json"
            },
        });
        if(response.status == 200){
            const identityMat = await response.json();
            console.log(identityMat)
            const file = new Blob([JSON.stringify(identityMat)], {type: "text/json;charset=utf-8"})

            // anchor link
            const element = document.createElement("a");
            element.href = URL.createObjectURL(file);
            element.download = "IdentityMat-" + Date.now() + ".json";

            // simulate link click
            document.body.appendChild(element); // Required for this to work in FireFox
            element.click();
        } else {
            // set error message
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
                            <Card.Title style={{fontSize: "25px", fontFamily: "serif"}}>Self-Sovereign Identity</Card.Title>
                            {
                                (state !== null) && !state.fromLogin && !cretingIdentity && ((vc as Credential) !== undefined) && (did !== undefined) && (
                                    <Button className="mt-3 ms-auto me-auto" style={{width: '100%'}} size="lg" variant="outline-success" onClick={downloadIdentity} value="download">
                                        Download your IDentity
                                    </Button>
                                )
                            }
                            {
                                (state !== null) && state.fromLogin && !cretingIdentity && ((vc as Credential) !== undefined) && (did !== undefined) && (
                                    <Button className="mt-3 ms-auto me-auto" style={{width: '100%'}} size="lg" variant="outline-success" onClick={gotoLogin} value="download">
                                        Go to Login
                                    </Button>
                                )
                            }
                        </Card.Body>
                        <Form.Group controlId="username" className="mb-3 d-flex justify-content-center">
                            {/* Check if MetaMask is available and no accounts are connected */}
                            {(state !== null) && state.fromLogin && window.ethereum?.isMetaMask && wallet.accounts.length < 1 && (
                                <>
                                <h4 className="me-2">Connect your wallet</h4>
                                <Button variant="outline-primary" disabled={isConnecting} onClick={connectMetaMask}>Connect MetaMask</Button>
                                </>) 
                            || (state !== null) && state.fromLogin && (
                                    <><h4 className="me-2" style={{fontSize: "25px", fontFamily: "serif"}}>Connect your wallet</h4>
                                    <Form.Text style={{fontSize: '18px', color: 'blue'}}>{wallet.accounts[0]}</Form.Text></>
                            )}
                        </Form.Group>
                        {
                            ((state !== null) && state.fromLogin ?
                                <Form.Group controlId="connService" className="mb-3 d-flex justify-content-center">
                                <h4 style={{fontSize: "25px", fontFamily: "serif"}}>Connector Service URL*</h4>
                                <div className='d-flex justify-content-center ms-3'>
                                    <Form.Control type="input" placeholder="http://127.0.0.1" value={connectorUrl} onChange={(event) => {setConnector(event.target.value); setTriggerTrue()}}/>
                                </div>
                                </Form.Group>
                            : "")
                        }
                        {
                            did === undefined 
                            ? // true
                            <>                            
                                <IdentityAccordion title={"Decentralized IDentifier"} content={"No Decentralized IDentifier available. Please request one."} />  
                                <Button className="mb-2 mt-3 ms-auto me-auto" onClick={createIdentity_ext}>Request DID</Button>
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
                                <IdentityAccordion title={"Verifiable Credential"} content={""} />
                                <Button className="mb-2 mt-3 ms-auto me-auto" onClick={requestVC}>Request Verifiable Credential</Button>
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
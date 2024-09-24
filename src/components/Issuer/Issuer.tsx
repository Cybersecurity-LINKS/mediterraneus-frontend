// SPDX-FileCopyrightText: 2024 Fondazione LINKS
//
// SPDX-License-Identifier: GPL-3.0-or-later

import { Button, Container, Spinner, Row, Modal, Form, Alert} from "react-bootstrap";
import { useState } from "react";

import { Credential } from "@iota/identity-wasm/web";

import { useMetaMask } from "@/hooks/useMetaMask";
import { useIdentity } from "@/hooks/useIdentity";
import { useError } from "@/hooks/useError";

import issuerAPI from "@/api/issuerAPIs";
import connectorAPI from "@/api/connectorAPIs";

export const Issuer = () => {
    const { provider, wallet,  } = useMetaMask();
    const { id, did, vc, setTriggerTrue, loading, connectorUrl } = useIdentity();

    const [modalShow, setModalShow] = useState(false);
    const [formData, setFormData] = useState({name: "", surname: ""});
    const [isConsentChecked, setIsConsentChecked] = useState(false); // state for consensus checkbox

    const [cretingIdentityLoading, setCreatingIdentity] = useState(false);
    const [issuedCredential, setIssuedCredential] = useState(false);
    const { setError } = useError();

    //TODO: why don't use hooks for setting the did and vc and do that call there? 
    const requestCredential = async (event: React.FormEvent) => {
        event.preventDefault();
        if (did === undefined || id === undefined) {
            setError("DID missing");
            return;
        }
        try {
            setCreatingIdentity(true);
            const nonce = await issuerAPI.getChallenge(did!.toString());
            const identitySignature = await connectorAPI.signData(
                connectorUrl, 
                id,
                nonce
            );
            const signer = await provider?.getSigner();
            const walletSignature = await signer?.signMessage(nonce);
            console.log("eth signature: ", walletSignature);
            const credentialResponse = await issuerAPI.requestCredential(
                did!.toString(), 
                nonce, 
                identitySignature,
                walletSignature!,
                { name: formData.name, surname: formData.surname }
            );
            const credentialJwt = credentialResponse.credentialJwt;
            console.log(`Credential [${credentialResponse.credentialId}], JWT: ${credentialJwt}`);
                        
            await connectorAPI.storeCredential(
                connectorUrl,
                wallet.accounts[0],
                credentialJwt
            );
            setTriggerTrue();
            setModalShow(false);
            setCreatingIdentity(false);
            setIssuedCredential(true);
            setFormData({name: "", surname: ""});
        } catch (error) {
            console.log(error);
            setTriggerTrue();
            setModalShow(false);
            setCreatingIdentity(false);
            setIssuedCredential(true);
            setFormData({name: "", surname: ""});
            throw error;
        }
    }

    const handleChange = (event: React.FormEvent) => {

        const { name, value } = event.target as HTMLInputElement;
        setFormData((prevFormData) => ({ ...prevFormData, [name]: value }));
    };

    const handleCheckChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setIsConsentChecked(event.target.checked);
    }

    return (
        <>
            <h1 className="text-center">Issuer</h1>
            {
                loading 
                ? // true
                    <Row className='justify-content-center mt-5'>
                        <Spinner animation="grow" variant="primary" className="my-auto"/>
                    </Row>                                
                :  // false
                <Row className="mt-3">
                {
                    ((vc as Credential) === undefined) 
                    ? // true
                    <>
                        <span className="text-center">It seems that you don&apos;t own a credential yet. Request one to the Issuer.</span>
                        <Container className="d-flex justify-content-center mt-5">
                            <Button className="mx-auto my-auto" onClick={() => {setModalShow(true)}}>Claim credential</Button>
                        </Container>                            
                    </>
                    : // false
                        <span className="text-center">{issuedCredential ? "Credential issued." : "You already have a credential, check you identity."}</span>
                }
                </Row>
            }
            
            <Modal key="registerForm" show={modalShow} onHide={() => {setModalShow(false); setFormData({name: "", surname: ""}); setIsConsentChecked(false);}}>
                <Form onSubmit={requestCredential}>
                    <Modal.Header closeButton>
                        <Modal.Title>About you</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Form.Group className="mb-3" controlId="formName">
                            <Form.Label><strong>Name</strong></Form.Label>
                            <Form.Control 
                            type="text"
                            name="name"
                            placeholder="Insert your name"
                            onChange={handleChange}
                            value={formData.name}
                            required
                            />
                        </Form.Group>
                        <Form.Group className="mb-3" controlId="formSurname">
                            <Form.Label><strong>Surname</strong></Form.Label>
                            <Form.Control 
                            type="text"
                            name="surname"
                            placeholder="Insert your surname"
                            onChange={handleChange}
                            value={formData.surname}
                            required
                            />
                        </Form.Group>
                        <Alert key="info-modal" variant="warning">
                            Please do not enter personal data in this test form. We ask you to enter only pseudonyms and/or made-up names or text strings.
                        </Alert>
                        <Form.Check id="consent-checkbox" label="I hereby declare that I have read the above instructions." onChange={handleCheckChange}/>
                    </Modal.Body>
                    <Modal.Footer className="justify-content-center">
                        <Button variant="primary" type="submit" disabled={!isConsentChecked}>
                        { cretingIdentityLoading  ? <Spinner animation="border" variant="light" size="sm"/> :"Request credential" }
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </>
    )
}
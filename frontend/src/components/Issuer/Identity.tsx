import { Button, Container, Spinner, Row, Col } from "react-bootstrap";
import { useState } from "react";

import { ContractTransactionResponse, ethers } from "ethers";
import { Credential } from "@iota/identity-wasm/web"
import { extractNumberFromVCid, getIdentitySC } from "@/utils";

import { useMetaMask } from "@/hooks/useMetaMask";
import { useIdentity } from "@/hooks/useIdentity";
import { useError } from "@/hooks/useError";

import issuerAPI from "@/api/issuerAPIs";
import connectorAPI from "@/api/connectorAPIs";

export const Identity = () => {
    const { provider, wallet,  } = useMetaMask();
    const { did, vc, setTriggerTrue, loading, connectorUrl } = useIdentity();

    const [cretingIdentityLoading, setCreatingIdentity] = useState(false);
    const [issuedCredential, setIssuedCredential] = useState(false);
    const { setError } = useError();

    //TODO: why don't use hooks for setting the did and vc and do that call there? 
    const requestCredential = async () => {
        if (did === undefined) {
            setError("DID missing");
            return;
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
            const tx: ContractTransactionResponse = await IDSC_istance.activateVC(ethers.toBigInt(credentialId));
            await tx.wait();
            await connectorAPI.storeCredential(
                connectorUrl,
                wallet.accounts[0],
                credential
            );
            setTriggerTrue();
            setCreatingIdentity(false);
            setIssuedCredential(true);
        } catch (error) {
            console.log(error);
            setCreatingIdentity(false);
            throw error;
        }
    }

    return (
        <>
            <Container fluid className="mt-3 justify-content-center">
            {
                loading || cretingIdentityLoading 
                ? // true
                    <Row className='justify-content-md-center'>
                        <Spinner animation="grow" variant="primary" className="my-auto"/>
                    </Row>                                
                :  // false
                <>
                    <Row className="mt-3">
                        <h1>Issuer</h1>
                    </Row>
                    <Row className="mt-3">
                    {
                        ((vc as Credential) === undefined) 
                        ? // true
                        <>
                            <p>It seems that you don&apos;t own a credential yet. Request one to the Issuer.</p>
                            <Container className="d-flex justify-content-center">
                                    <Button className="mx-auto my-auto" onClick={requestCredential}>Sign up</Button>
                            </Container>                            
                        </>
                        : // false
                            <p>{issuedCredential ? "Credential issued." : "You already have a credential, check you identity."}</p>
                    }
                    </Row>
                </>
            }
            </Container>
        </>
    )
}
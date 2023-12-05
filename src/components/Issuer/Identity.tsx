import { Button, Container, Spinner, Row} from "react-bootstrap";
import { useState } from "react";

import { ContractTransactionResponse, ethers } from "ethers";
import { Credential, EdDSAJwsVerifier, FailFast, IotaDID, IotaDocument, IotaIdentityClient, Jwt, JwtCredentialValidationOptions, JwtCredentialValidator } from "@iota/identity-wasm/web";
import { Client } from "@iota/sdk-wasm/web";
import { extractNumberFromVCid, getIdentitySC } from "@/utils";

import { useMetaMask } from "@/hooks/useMetaMask";
import { useIdentity } from "@/hooks/useIdentity";
import { useError } from "@/hooks/useError";

import issuerAPI from "@/api/issuerAPIs";
import connectorAPI from "@/api/connectorAPIs";

export const iotaApiUrl = import.meta.env.VITE_NODE_API_URL as string;

export const Identity = () => {
    const { provider, wallet,  } = useMetaMask();
    const { id, did, vc, setTriggerTrue, loading, connectorUrl } = useIdentity();

    const [cretingIdentityLoading, setCreatingIdentity] = useState(false);
    const [issuedCredential, setIssuedCredential] = useState(false);
    const { setError } = useError();

    //TODO: why don't use hooks for setting the did and vc and do that call there? 
    const requestCredential = async () => {
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
            console.log("wallet signature: ", walletSignature);
            const credentialResponse = await issuerAPI.requestCredential(
                did!.toString(), 
                nonce, 
                identitySignature,
                walletSignature!
            );
            const credentialJwt = credentialResponse.credentialJwt;
            console.log("Issuer message: ", credentialResponse.message);
            console.log("Credential JWT: ", credentialJwt);
            
            
            // TODO: simplify this process
            const client = new Client({
                primaryNode: iotaApiUrl,
                localPow: true,
            });
            const didClient = new IotaIdentityClient(client);
            
            // Resolve the issuer DID document.
            const issuerDocument: IotaDocument = await didClient.resolveDid(IotaDID.parse(credentialResponse.issuerDid));
            const decoded_credential = new JwtCredentialValidator(new EdDSAJwsVerifier()).validate(
                new Jwt(credentialJwt),
                issuerDocument,
                new JwtCredentialValidationOptions(),
                FailFast.FirstError,
            );

            const credentialId = extractNumberFromVCid(decoded_credential.credential());
            console.log("Credential id:", ethers.toBigInt(credentialId));
            const IDSC_istance = await getIdentitySC(provider!);
            const tx: ContractTransactionResponse = await IDSC_istance.activateVC(ethers.toBigInt(credentialId));
            await tx.wait();
            await connectorAPI.storeCredential(
                connectorUrl,
                wallet.accounts[0],
                credentialJwt
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
            <h1 className="text-center">Issuer</h1>
            {
                loading || cretingIdentityLoading 
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
                            <Button className="mx-auto my-auto" onClick={requestCredential}>Sign up</Button>
                        </Container>                            
                    </>
                    : // false
                        <span className="text-center">{issuedCredential ? "Credential issued." : "You already have a credential, check you identity."}</span>
                }
                </Row>
            }
        </>
    )
}
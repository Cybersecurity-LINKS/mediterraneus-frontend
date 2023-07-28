import { useMetaMask } from "@/hooks/useMetaMask";
import { extractNumberFromVCid, getIdentitySC, privKeytoBytes } from "@/utils";
import { Credential, IotaDID, IotaDocument } from "@iota/identity-wasm/web"
import { ContractTransactionResponse, ethers } from "ethers";
import { useEffect, useState } from "react"
import { Button, Card, Container } from "react-bootstrap";
import { IdentityAccordion } from "./IdentityAccordion";

export const Identity = () => {
    const { provider, wallet } = useMetaMask();

    const [did, setDid] = useState<IotaDID>();
    const [didDoc, setDidDoc] = useState<IotaDocument>();
    const [vc, setVc] = useState<Credential>();
    const [trigger, setTrigger] = useState(true);

    useEffect(() => {
        const getDIDfromBackend = async () => {
            console.log(wallet.accounts[0])
            const response = await fetch('http://localhost:1234/identity', {
                method: 'GET',
                headers: {
                    "Content-type": "application/json"
                    } 
            });
            if(response.status == 200){
                const json_resp = await response.json();
                setDid(json_resp.did);
                setDidDoc(json_resp.did_doc);
                if(json_resp.vc != null)
                    setVc(Credential.fromJSON(json_resp.vc));
            }
        };

        if(trigger){
            getDIDfromBackend();
            setTrigger(false);
        }
    }, [trigger, wallet.accounts]);
 
    const createIdentity_ext = async () => {
        try {
          const response = await fetch('http://localhost:1234/identity', {
            method: 'POST',
            headers: {
              "Content-type": "application/json"
            } 
          });
          await response.json().then(resp => {
            console.log(resp.did)
            setTrigger(true);
          });
        } catch (error) {
            console.log(error)
            throw error;
        }
    }

    const requestVC = async () => {
        try {
            const response = await fetch('http://localhost:3213/requestVC1', {
                method: 'POST',
                headers: {
                    "Content-type": "application/json"
                },
                body: JSON.stringify({did: did!.toString()})   
            });
            const json_resp = await response.json();
            const vcHash = json_resp.vchash;

            const responseSign = await fetch("http://localhost:1234/signdata", {
                method: 'POST',
                headers: {
                    "Content-type": "application/json"
                },
                body: JSON.stringify({vchash: vcHash}) 
            });
            const json_sign = await responseSign.json();
            const ssi_signature = privKeytoBytes(json_sign.ssi_signature)
            if(ssi_signature === undefined || ssi_signature.length != 64) { // hex len = 64 * 2
                console.log("Signature undefined or invalid");
                throw Error("Signature undefined or invalid");
            }
            const signer = await provider?.getSigner();
            const pseudo_sign = await signer?.signMessage(ethers.toBeArray(vcHash))

            const inactiveVC_response = await fetch('http://localhost:3213/requestVC2', {
                method: 'POST',
                headers: {
                    "Content-type": "application/json"
                },
                body: JSON.stringify({
                    vcHash: vcHash,
                    ssi_signature: ssi_signature.toString(),
                    pseudo_sign: pseudo_sign
                })
            }) 
            const inactiveVC_json = await inactiveVC_response.json();
            const vc_cred = Credential.fromJSON(JSON.parse(inactiveVC_json.vc))
            const vc_numId = extractNumberFromVCid(vc_cred);

            const IDSC_istance = await getIdentitySC(provider!);
            let tx: ContractTransactionResponse = await IDSC_istance.activateVC(ethers.toBigInt(vc_numId));
            await tx.wait();
            // store VC in connector's backend.
            const storeVCresp = await fetch("http://localhost:1234/storeVC", {
                method: 'POST',
                headers: {
                    "Content-type": "application/json"
                },
                body: JSON.stringify({
                    vc: vc_cred?.toJSON(),
                })
            });
            if(!storeVCresp.ok || storeVCresp.status != 201)
                throw Error("Cannot store VC");
            setTrigger(true);
        } catch (error) {
            console.log(error);
            throw error;
        }
    }

    return (
        <>
            <Container fluid className="d-flex mt-3 justify-content-center">
                <Card style={{width: '70rem'}} className='d-flex justify-content-center mb-5 mt-3'>
                    <Card.Body className='mb-2 mt-3 ms-auto me-auto'>
                        <Card.Title style={{fontSize: "25px", fontFamily: "serif"}}>Self-Sovereign Identity</Card.Title>
                    </Card.Body>
                    {
                        did === undefined 
                        ? // true
                        <div className='d-flex justify-content-center mb-2 mt-3 ms-auto me-auto '>
                            <Button style={{width: "150px"}} onClick={createIdentity_ext}>Create Identity</Button>
                        </div>
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
        </>
    ) 
    
}
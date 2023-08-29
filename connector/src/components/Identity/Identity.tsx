import { useMetaMask } from "@/hooks/useMetaMask";
import { extractNumberFromVCid, getIdentitySC, privKeytoBytes } from "@/utils";
import { Credential, IotaDID, IotaDocument } from "@iota/identity-wasm/web"
import { ContractTransactionResponse, ethers } from "ethers";
import { useEffect, useState } from "react"
import { Button, Card, Container, Spinner } from "react-bootstrap";
import { IdentityAccordion } from "./IdentityAccordion";

export const Identity = () => {
    const { provider, wallet } = useMetaMask();

    const [did, setDid] = useState<IotaDID>();
    const [didDoc, setDidDoc] = useState<IotaDocument>();
    const [vc, setVc] = useState<Credential>();

    const [trigger, setTrigger] = useState(true);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const getIDfromBackend = async () => {
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            const response = await fetch(`http://localhost:1234/identity/${accounts[0]}`, {
                method: 'GET',
                headers: {
                    "Content-type": "application/json"
                },
            });
            if(response.status == 200){
                const json_resp = await response.json();
                setDid(json_resp.did);
                setDidDoc(json_resp.did_doc);
                if(json_resp.vc != null)
                    setVc(Credential.fromJSON(json_resp.vc));
            } else {
                setDid(undefined);
                setDidDoc(undefined);
                setVc(undefined);
            }
            setLoading(false);
        };

        if(trigger){
            window.ethereum.on('accountsChanged', getIDfromBackend);
            getIDfromBackend();
            setTrigger(false);
        }
    }, [trigger]);
 
    const createIdentity_ext = async () => {
        try {
            console.log(wallet.accounts[0]);
          const response = await fetch('http://localhost:1234/identity', {
            method: 'POST',
            headers: {
              "Content-type": "application/json"
            },
            body: JSON.stringify({eth_address: wallet.accounts[0]}) 
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
            const response = await fetch('http://localhost:3213/api/identity', {
                method: 'POST',
                headers: {
                    "Content-type": "application/json"
                },
                body: JSON.stringify({did: did!.toString()})   
            });
            const json_resp = await response.json();
            const vcHash = `${json_resp.vchash}`;

            const responseSign = await fetch("http://localhost:1234/signdata", {
                method: 'POST',
                headers: {
                    "Content-type": "application/json"
                },
                body: JSON.stringify({eth_address: wallet.accounts[0], vchash: vcHash}) 
            });
            const json_sign = await responseSign.json();
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
            const storeVCresp = await fetch("http://localhost:1234/storeVC", {
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
            setTrigger(true);
        } catch (error) {
            console.log(error);
            throw error;
        }
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
            }
        </>
    )
}
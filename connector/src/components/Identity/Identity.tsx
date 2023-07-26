import { useMetaMask } from "@/hooks/useMetaMask";
import { extractNumberFromVCid, getIdentitySC, privKeytoBytes } from "@/utils";
import { Credential, IotaDID, IotaDocument } from "@iota/identity-wasm/web"
import { ethers } from "ethers";
import { useEffect, useState } from "react"
import { Button, Card, Container } from "react-bootstrap";

export const Identity = () => {

    const { provider } = useMetaMask();


    const [did, setDid] = useState<IotaDID>();
    const [didDoc, setDidDoc] = useState<IotaDocument>();
    const [vc, setVc] = useState<Credential>();
    const [vcLoaded, setVcLoaded] = useState(false);

    useEffect(() => {
        const getDIDfromBackend = async () => {
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
            }
        };
        if(vc !== undefined) setVcLoaded(true)
        getDIDfromBackend();
    }, [did, vc, vcLoaded]);
 
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
            setDid(resp.did);
            setDidDoc(resp.did_doc);
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
            setVc(vc_cred);
            const vc_numId = extractNumberFromVCid(vc_cred);

            const IDSC_istance = await getIdentitySC(provider!);
            await IDSC_istance.activateVC(ethers.toBigInt(vc_numId));
            await IDSC_istance.on("VC_Activated", async (vc_id) => {
                console.log(`VC ${vc_id} activated successfully`);
            });

        } catch (error) {
            console.log(error);
            throw error;
        }
    }

    return (
        <>
            <Container fluid className="mt-3">
                <Card style={{width: '60rem'}} className=' mb-5 mt-3'>
                    <Card.Body className='d-flex justify-content-center mb-2 mt-3 ms-auto me-auto '>
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
                            <Card style={{width: '55rem', backgroundColor: "ThreeDLightShadow"}} className='ms-4 mb-5'>
                                <pre className="ms-2 mt-2" style={{font: "icon", fontFamily: "cursive", color: "white"}}>{did.toString()}</pre>
                                <pre className="ms-2 mb-2" style={{font: "icon", fontFamily: "cursive", color: "white"}}>{JSON.stringify(didDoc, null, 2)}</pre>
                            </Card>
                            {/* <div className='d-flex justify-content-center mb-2 mt-3 ms-auto me-auto '>
                                <Button onClick={requestVC}>Request Verifiable Crential to Issuer</Button>
                            </div> */}
                        </>
                    }
                    {
                        ((vc as unknown as Credential) === undefined) 
                        ? // true
                        <div className='d-flex justify-content-center mb-2 mt-3 ms-auto me-auto '>
                            <Button onClick={requestVC}>Request Verifiable Crential to Issuer</Button>
                        </div>
                        :
                        <div>
                            <Card style={{width: '55rem', backgroundColor: "ThreeDLightShadow"}} className='ms-4 mb-5'>
                                <pre className="ms-2 mb-2" style={{font: "icon", fontFamily: "cursive", color: "white"}}>{JSON.stringify(vc, null, 2)}</pre>
                            </Card>
                        </div>
                    }
                </Card>
            </Container>
        </>
    ) 
    
}
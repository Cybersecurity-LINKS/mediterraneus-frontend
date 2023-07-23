import { useMetaMask } from "@/hooks/useMetaMask";
import { Ed25519, IotaDID, IotaDocument } from "@iota/identity-wasm/web"
import { useEffect, useState } from "react"
import { Button, Card, Container } from "react-bootstrap";

export const Identity = () => {

    const { shimmerProvider, provider } = useMetaMask();


    const [did, setDid] = useState<IotaDID>();
    const [didDoc, setDidDoc] = useState<IotaDocument>();
    const [vcHash, setVcHash] = useState<string>(''); 
    const [vc, setVc] = useState('');

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
        getDIDfromBackend();
    }, [did]);
 
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
            console.log(resp.did_doc)
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
            setVcHash(json_resp.vchash);
            
            const responseSign = await fetch("http://localhost:1234/signdata", {
                method: 'POST',
                headers: {
                    "Content-type": "application/json"
                },
                body: JSON.stringify({vchash: vcHash}) 
            });
            const json_sign = await responseSign.json();
            const ssi_signature: string = json_sign.ssi_signature
            if(ssi_signature === undefined || ssi_signature.length != 128) { // hex len = 64 * 2
                console.log("Signature undefined or invalid");
                throw Error("Signature undefined or invalid");
            }
            const signer = await provider?.getSigner();
            const pseudo_sign = await signer?.signMessage(vcHash)
            console.log(vcHash)
            console.log(ssi_signature)
            console.log(pseudo_sign)
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
                            <div className='d-flex justify-content-center mb-2 mt-3 ms-auto me-auto '>
                                <Button onClick={requestVC}>Request Verifiable Crential to Issuer</Button>
                            </div>
                        </>
                    }
                    {
                        vc === '' 
                        ? // true
                        <div className='d-flex justify-content-center mb-2 mt-3 ms-auto me-auto '>
                            {/* <Button onClick={createIdentity_ext}>Request Verifiable Crential to Issuer</Button> */}
                        </div>
                        :
                        <div>vc</div>
                    }
                </Card>
            </Container>
        </>
    ) 
    
}
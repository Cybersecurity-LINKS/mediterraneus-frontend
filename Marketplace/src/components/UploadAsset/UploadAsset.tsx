import { useMetaMask } from '@/hooks/useMetaMask';
import { MouseEvent, useEffect, useState } from 'react';
import { Card, Button, Form, Col, Row, Alert } from 'react-bootstrap';
import { useIdentity } from "@/hooks/useIdentity";
import isUrl from "is-url";


export const UploadAsset = () => {
    const [assetAlias, setAssetAlias] = useState("");
    const [assetFile, setAssetFile] = useState<HTMLInputElement | null>(null);
    const [offeringFile, setOfferingFile] = useState<HTMLInputElement | null>(null);
    const [OfferingCID, setOfferingCID] = useState("");
    const [error, setError] = useState("");

    const { wallet } = useMetaMask();
    const { did, vc, connectorUrl } = useIdentity();

    useEffect(() => {
        setAssetFile(document.getElementById("uploadAsset") as HTMLInputElement);
        setOfferingFile(document.getElementById("uploadOffering") as HTMLInputElement);
    }, []);

    const submitAssetUpload = async (event: MouseEvent<HTMLButtonElement, globalThis.MouseEvent>) => {
        event.preventDefault();
        try{
            if( wallet.accounts[0] === undefined ) {
                const err = new Error("Please connect your wallet!")
                setError(err.message)
                throw err;
            } 

            if (!isUrl(connectorUrl)) {
                const err = new Error('Connector url error')
                setError(err.message);
                throw err;
            }

            if( did === undefined || vc == undefined ) {
                const err = new Error("You might no have a DID or VC")
                setError(err.message)
                throw err;
            } 

            const formData = new FormData();      
            if(offeringFile != null && assetFile != null && (offeringFile?.files!.length > 1 || offeringFile?.files!.length <= 0) && (assetFile?.files!.length > 1 || assetFile?.files!.length <= 0)) {
                const err = new Error("Asset and Offeirng files must be chosen in order to proceed")
                setError(err.message)
                throw err;
            } else {  
                let asset_file = assetFile!.files?.[0] as Blob
                formData.append("files", asset_file);
                let offering_file = offeringFile!.files?.[0] as Blob
                formData.append("files", offering_file);
                formData.append("additional", JSON.stringify({
                    eth_address: wallet.accounts[0],
                    asset_alias: assetAlias
                }));
                const response = await fetch(`${connectorUrl}/uploadOnLAD`,
                    {
                        body: formData,
                        method: "POST",
                    }
                );

                const result = await response.json()
                console.log(result)
                if(response.status == 200) {
                    setOfferingCID(result["cid"])
                } else if(result.error_code != undefined) {
                    const err = new Error("Given Alias has already been used!")
                    setError(err.message)
                    throw err;
                }
            }
        } catch (e) {
            if (e instanceof Error) console.log(e.message);
        }
    }

    return (
        <>
        <Card style={{width: '60rem'}} className='d-flex mb-5 mt-3'>
            <Card.Body>
                <Card.Title>Upload an Asset with its Offering Message on the Connector</Card.Title>
            </Card.Body>
            <Form className="mt-3 mb-3 ps-5 pe-5">
                <Form.Group as={Row} className="flex-fill align-items-center mb-3" controlId="formNFTname">
                    <Form.Label column sm={4}>Asset Alias</Form.Label>
                    <Col sm={8}>
                        <Form.Control type="input" placeholder="Enter a unique alias for the asset" onChange={(event) => { setAssetAlias(event.target.value) }}/>
                    </Col>
                </Form.Group>

                <Form.Group as={Row} className="flex-fill align-items-center mb-3" controlId="uploadAsset">
                    <Form.Label column sm={4}>Upload Asset File</Form.Label>
                    <Col sm={8}>
                        <Form.Control type="file" accept='.json'/>
                    </Col>
                </Form.Group>

                <Form.Group as={Row} className="flex-fill align-items-center mb-3" controlId="uploadOffering">
                    <Form.Label column sm={4}>Upload Offering Message File</Form.Label>
                    <Col sm={8}>
                        <Form.Control type="file" accept='.json'/>
                    </Col>
                </Form.Group>

                <Form.Group as={Row} className="flex-fill align-items-center mb-3" controlId="formNFTuri">
                    <Form.Label column sm={4}>Offering CID</Form.Label>
                    <Col sm={8}>
                        <Form.Control className="text-truncate"  disabled={true} type="text" placeholder="Upload Offering Message to get CID back" 
                            value={OfferingCID.length == 0 ? "Upload Offering Message to get CID back" : OfferingCID} />
                    </Col>
                </Form.Group>
            
                <Button variant="primary" type="submit" className='mt-3 mb-3' onClick={(event) => { submitAssetUpload(event) }}>
                    Upload
                </Button>
            </Form>
        </Card>
        <Row className="fixed-bottom">
        {
            error 
                &&
            <Alert className="me-5 ms-3" key='danger' variant='danger' onClick={() => { setError('') }}>
                <strong>Error:</strong> { error }
            </Alert>
        }
        </Row>
        </>
    );
}
import { useMetaMask } from '@/hooks/useMetaMask';
import { MouseEvent, useEffect, useState } from 'react';
import { Card, Button, Form, Col, Row, Alert } from 'react-bootstrap';


export const UploadAsset = () => {
    const [assetAlias, setAssetAlias] = useState("");
    const [assetFile, setAssetFile] = useState<HTMLInputElement | null>(null);
    const [offeringFile, setOfferingFile] = useState<HTMLInputElement | null>(null);
    const [OfferingCID, setOfferingCID] = useState("");
    const [error, setError] = useState("");

    const { wallet } = useMetaMask();

    useEffect(() => {
        setAssetFile(document.getElementById("uploadAsset") as HTMLInputElement);
        setOfferingFile(document.getElementById("uploadOffering") as HTMLInputElement);
    }, []);

    const submitAssetUpload = async (event: MouseEvent<HTMLButtonElement, globalThis.MouseEvent>) => {
        const formData = new FormData()
        try{
            event.preventDefault();
            if(offeringFile != null && assetFile != null && (offeringFile?.files!.length > 1 || offeringFile?.files!.length <= 0) && (assetFile?.files!.length > 1 || assetFile?.files!.length <= 0)) {
                const err = new Error("Asset and Offeirng files must be chosen in order to proceed")
                setError(err.message)
                throw err;
            } else {
                if(wallet.accounts[0] === undefined) {
                    const err = new Error("Please connect your wallet!")
                    setError(err.message)
                    throw err;
                }   
                let asset_file = assetFile!.files?.[0] as Blob
                formData.append("files", asset_file);
                let offering_file = offeringFile!.files?.[0] as Blob
                formData.append("files", offering_file);
                formData.append("additional", JSON.stringify({
                    eth_address: wallet.accounts[0],
                    asset_alias: assetAlias
                }));
                const response = await fetch("http://localhost:1234/uploadOnLAD",
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
        } catch (err) {
            console.log(err);
        }
    }

    return (
        <>
        <Card style={{width: '60rem'}} className='d-flex mb-5 mt-3'>
            <Card.Body>
                <Card.Title>Locally upload an Asset with its Offering Message</Card.Title>
            </Card.Body>
            <Form className="mt-3 mb-3 ps-5 pe-5">
            <Form.Group as={Row} className="flex-fill align-items-center mb-3" controlId="formNFTname">
                <Col sm={2}>
                    <Form.Label style={{fontSize: "20px", fontFamily: 'italic'}}>Asset Alias</Form.Label>
                </Col>
                <Col sm={10}>
                    <Form.Control size="lg" type="input" placeholder="Enter a unique alias for the asset" onChange={(event) => { setAssetAlias(event.target.value) }}/>
                </Col>
            </Form.Group>

            <Form.Group as={Row} className="flex-fill align-items-center mb-3" controlId="uploadAsset">
                <Col sm={4}>
                    <Form.Label style={{fontSize: "20px", fontFamily: 'italic'}}>Upload Asset File</Form.Label>
                </Col>
                <Col sm={8}>
                    <div className='d-flex justify-content-center '>
                        <Form.Control type="file" size="lg" accept='.json'/>
                    </div>
                </Col>
            </Form.Group>

            <Form.Group as={Row} className="flex-fill align-items-center mb-3" controlId="uploadOffering">
                <Col sm={4}>
                    <Form.Label style={{fontSize: "20px", fontFamily: 'italic'}}>Upload Offering Message File</Form.Label>
                </Col>
                <Col sm={8}>
                    <div className='d-flex justify-content-center '>
                        <Form.Control type="file" size="lg" accept='.json'/>
                    </div>
                </Col>
            </Form.Group>

            <Form.Group as={Row} className="flex-fill align-items-center mb-3" controlId="formNFTuri">
                <Col sm={3}>
                    <Form.Label style={{fontSize: "20px", fontFamily: 'italic'}}>Offering CID</Form.Label>
                </Col>
                <Col sm={9}>
                    <Form.Control disabled={true} size="lg" type="text" placeholder="Upload Offering Message to get CID back" 
                        value={OfferingCID.length == 0 ? "Upload Offering Message to get CID back" : OfferingCID} />
                </Col>
            </Form.Group>
        
            <Button variant="primary" type="submit" className='mt-3 mb-3' onClick={(event) => { submitAssetUpload(event) }}>
                Submit
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
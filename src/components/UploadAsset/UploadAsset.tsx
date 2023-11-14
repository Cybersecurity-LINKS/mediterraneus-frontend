import { useMetaMask } from '@/hooks/useMetaMask';
import { MouseEvent, useEffect, useState } from 'react';
import { Button, Form, Col, Row, Container, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { useIdentity } from "@/hooks/useIdentity";
import isUrl from "is-url";
import { useError } from '@/hooks/useError';


export const UploadAsset = () => {
    const [assetAlias, setAssetAlias] = useState("");
    const [assetFile, setAssetFile] = useState<HTMLInputElement | null>(null);
    const [offeringFile, setOfferingFile] = useState<HTMLInputElement | null>(null);
    const [OfferingCID, setOfferingCID] = useState("");

    const { wallet } = useMetaMask();
    const { did, vc, connectorUrl } = useIdentity();
    const { setError }  = useError();

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
                const err = new Error("DID undefined")
                setError(err.message)
                throw err;
            } 

            const formData = new FormData();      
            if(offeringFile != null && assetFile != null && (offeringFile?.files!.length > 1 || offeringFile?.files!.length <= 0) && (assetFile?.files!.length > 1 || assetFile?.files!.length <= 0)) {
                const err = new Error("Asset and Offeirng files must be chosen in order to proceed")
                setError(err.message)
                throw err;
            } else {  
                const asset_file = assetFile!.files?.[0] as Blob
                formData.append("files", asset_file);
                const offering_file = offeringFile!.files?.[0] as Blob
                formData.append("files", offering_file);
                formData.append("additional", JSON.stringify({
                    eth_address: wallet.accounts[0],
                    asset_alias: assetAlias
                }));
                const response = await fetch(`${connectorUrl}/assets`, {
                    method: "POST",
                    body: formData,
                });

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
            if (e instanceof Error) {
                console.log(e.message);
                setError(e.message);
            }
        }
    }

    return (<>  
        <h1 className="text-center">Connector - Upload</h1>
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
            <Container className="d-flex justify-content-center">
                <OverlayTrigger placement="bottom" overlay={<Tooltip>Upload an asset with its offering message on the Connector</Tooltip>}>
                    <Button variant="primary" type="submit" className='mt-3 mb-3' onClick={(event) => { submitAssetUpload(event) }}>Upload</Button>
                </OverlayTrigger>
            </Container>
        </Form>
        </>
    );
}
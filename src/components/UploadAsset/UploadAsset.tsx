// SPDX-FileCopyrightText: 2024 Fondazione LINKS
//
// SPDX-License-Identifier: GPL-3.0-or-later

import { useMetaMask } from '@/hooks/useMetaMask';
import { useEffect, useState } from 'react';
import { Button, Form, Col, Row, Container, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { useIdentity } from "@/hooks/useIdentity";
import isUrl from "is-url";
import { useError } from '@/hooks/useError';
import connectorAPI from '@/api/connectorAPIs';


export const UploadAsset = () => {
    const [assetAlias, setAssetAlias] = useState("");
    const [assetFile, setAssetFile] = useState<HTMLInputElement | null>(null);
    const [offeringFile, setOfferingFile] = useState<HTMLInputElement | null>(null);
    const [offeringCID, setOfferingCID] = useState("");

    const { wallet } = useMetaMask();
    const { did, vc, connectorUrl } = useIdentity();
    const { setError }  = useError();

    useEffect(() => {
        setAssetFile(document.getElementById("uploadAsset") as HTMLInputElement);
        setOfferingFile(document.getElementById("uploadOffering") as HTMLInputElement);
    }, []);

    const submitAssetUpload = async (event: React.FormEvent) => {
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

            //TODO: remove this, just use required in the form
            if(offeringFile != null && assetFile != null && (offeringFile?.files!.length > 1 || offeringFile?.files!.length <= 0) && (assetFile?.files!.length > 1 || assetFile?.files!.length <= 0)) {
                const err = new Error("Asset and Offeirng files must be chosen in order to proceed");
                setError(err.message)
                throw err;
            } 

            const assetBlob = assetFile!.files?.[0] as Blob;
            const offeringBlob = offeringFile!.files?.[0] as Blob;

            const cid = await connectorAPI.uploadAsset(connectorUrl, offeringBlob, assetBlob, assetAlias, wallet.accounts[0]);
            setOfferingCID(cid);
        } catch (e) {
            if (e instanceof Error) {
                console.log(e.message);
                setError(e.message);
            }
        }
    }

    return (<>  
        <h1 className="text-center">Connector - Upload</h1>
        <Form className="mt-3 mb-3 ps-5 pe-5" onSubmit={submitAssetUpload}>
            <Form.Group as={Row} className="flex-fill align-items-center mb-3" controlId="formNFTname">
                <Form.Label column sm={4}>Asset Alias</Form.Label>
                <Col sm={8}>
                    <Form.Control type="input" placeholder="Enter a unique alias for the asset" onChange={(event) => { setAssetAlias(event.target.value) }} required/>
                </Col>
            </Form.Group>

            <Form.Group as={Row} className="flex-fill align-items-center mb-3" controlId="uploadAsset">
                <Form.Label column sm={4}>Upload Asset File</Form.Label>
                <Col sm={8}>
                    <Form.Control type="file" accept='.json' required/>
                </Col>
            </Form.Group>

            <Form.Group as={Row} className="flex-fill align-items-center mb-3" controlId="uploadOffering">
                <Form.Label column sm={4}>Upload Offering Message File</Form.Label>
                <Col sm={8}>
                    <Form.Control type="file" accept='.json' required/>
                </Col>
            </Form.Group>

            <Form.Group as={Row} className="flex-fill align-items-center mb-3" controlId="formNFTuri">
                <Form.Label column sm={4}>Offering CID</Form.Label>
                <Col sm={8}>
                    <Form.Control className="text-truncate"  disabled={true} type="text" placeholder="Upload Offering Message to get CID back" 
                        value={offeringCID.length == 0 ? "Upload Offering Message to get CID back" : offeringCID} />
                </Col>
            </Form.Group>
            <Container className="d-flex justify-content-center">
                <OverlayTrigger placement="bottom" overlay={<Tooltip>Upload an asset with its offering message on the Connector</Tooltip>}>
                    <Button variant="primary" type="submit" className='mt-3 mb-3'>Upload</Button>
                </OverlayTrigger>
            </Container>
        </Form>
        </>
    );
}
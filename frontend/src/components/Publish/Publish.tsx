import { MouseEvent, useEffect, useState } from 'react';
import { Card, Button, Form, Col, Row, Alert, OverlayTrigger, Tooltip, Figure, Container, Spinner } from 'react-bootstrap';
import { ethers } from 'ethers';
import { extractNumberFromVCid, getContractABI, getContractAddress, getPermitDigest } from '@/utils';
import { useMetaMask } from '@/hooks/useMetaMask';
import { TbInfoCircle } from 'react-icons/tb';
import { useIdentity } from '@/hooks/useIdentity';
import isUrl from "is-url";

export const Publish = () => {
    const [NFTname, setNFTname] = useState("");
    const [NFTnames, setNFTnames] = useState([]);
    const [NFTsymbol, setNFTsymbol] = useState("");
    const [EncCID, setEncCID] = useState("");

    const [DTname, setDTname] = useState("");
    const [DTsymbol, setDTsymbol] = useState("");
    const [DTmaxSupply, setDTmaxSupply] = useState<BigInt>(BigInt(0));
    const [DownloadURL, setDownloadURL] = useState("");

    const [Assethash, setAssetHash] = useState("");
    const [OfferingHash, setOfferingHash] = useState("");
    const [TrustSign, setTrustSign] = useState("");

    const [error, setError] = useState("");

    const [publishing, setPublishing] = useState(false);

    const { wallet, provider } = useMetaMask()
    const { did, vc, connectorUrl } = useIdentity();

    useEffect(() => {
        const getAssetAliases = async () => {
            try {
                const response = await fetch(`${connectorUrl}/assets?fields=alias`);
                const body = await response.json();
                if(response.status == 200) {
                    console.log("Available asset inside Connector:", body.aliases);
                    setNFTnames(body.aliases);
                } else {
                    const err = new Error(body["error"]);
                    setError(err.message);
                    throw err;
                }
            } catch (error) {
                console.log(error);
            }
        }

        getAssetAliases();
    }, []);

    const handleNFTnameChoice = async (chosen_alias: string) => {
        console.log("Reading NFT info...");
        if(chosen_alias == "Choose an NFT Name") {
            setNFTname("");
            setEncCID("");
            setAssetHash("");
            setOfferingHash("");
            setTrustSign("");
            return;
        }
        try {
            const response = await fetch(`${connectorUrl}/assets/${chosen_alias}?eth_address=${wallet.accounts[0]}`)
            const body = await response.json();

            if(response.status == 200) {
                const lad_entry = body.lad_entry;
                setNFTname(chosen_alias);
                setEncCID(lad_entry.cid);
                setAssetHash(lad_entry.hash_asset);
                setOfferingHash(lad_entry.hash_offering);
                setTrustSign(lad_entry.sign);
            } else {
                setNFTname("");
                setEncCID("");
                setAssetHash("");
                setOfferingHash("");
                setTrustSign("");
                const err = new Error(body["error"]);
                setError(err.message)
                throw err;
            }
        } catch (error) {
            console.log(error)
        }
    }

    const handleSubmit = async (event: MouseEvent<HTMLButtonElement, globalThis.MouseEvent>) => {
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

            setPublishing(true);
            const signer = await provider!.getSigner(wallet.accounts[0]);

            const contractABI = await getContractABI("ERC721Factory");
            const exchangeABI = await getContractABI("FixedRateExchange");
            const contractAddress = getContractAddress("ERC721Factory");
            const exchangeAddress = getContractAddress("FixedRateExchange");

            const contractIstance = new ethers.Contract(contractAddress!, contractABI, signer);
            const exchangeInstance = new ethers.Contract(exchangeAddress!, exchangeABI, signer);
            
            const tx = await contractIstance.publishAllinOne({
                name: NFTname,
                symbol: NFTsymbol,
                tokenURI: EncCID,
                asset_download_URL: DownloadURL,
                asset_hash: Assethash,
                offering_hash: OfferingHash,
                trust_sign: TrustSign,
                dt_name: DTname,
                dt_symbol: DTsymbol,
                maxSupply_: ethers.parseEther(DTmaxSupply.toString()),
                vc_id: extractNumberFromVCid(vc!)
            });
            const rc = await tx.wait(1);
            console.log(rc.logs);
            for(let i = 0; i < rc.logs.length; i++) {
                let event = rc.logs[i];
                if(event.eventName == 'NFTCreated' && event.eventSignature == "NFTCreated(address,address,string,address,string,string)"){
                console.log(`event ${event.eventName}: address ${event.args[0]}`);
                    const resp = await fetch(`${connectorUrl}/assets/${NFTname}`, {
                        method: 'PATCH',
                        headers: {
                            "Content-type": "application/json"
                        },
                        body: JSON.stringify({
                            nft_sc_address: event.args[0],
                        })
                    });
                    if(resp.status != 200)
                        throw "Cannot update LAD"
                }
            }
            setPublishing(false);
        } catch (e) {
            if (e instanceof Error) {
                console.log(e.message);
                setError(e.message);
            }
            setPublishing(false);
        }
    }

    return (
        <>
        {
            publishing ? <Container className="d-flex justify-content-center"><Spinner animation="border" variant="success" style={{
                width: '5rem', 
                height: '5rem', 
                position: 'absolute', 
                justifyContent: 'center',
                flex: 1,
                alignItems: 'center',
                marginTop: 270,
            }}/></Container> 
            : 
            <>
            <Card style={{width: '60rem'}} className='d-flex mb-5 mt-3'>
                <Card.Body>
                    <Card.Title>Publish a new tokenized Asset</Card.Title>
                </Card.Body>
                <Form className="mt-3 mb-3 ps-5 pe-5">
                    <Card.Title className="text-center">Create your NFT</Card.Title>
                    <Card.Body>
                        <Form.Group as={Row} className="flex-fill align-items-center mb-3" controlId="formNFTname">
                            <Form.Label column sm={3}>
                                NFT Name/Asset Alias
                            </Form.Label>
                            <Col sm={1}>
                                <OverlayTrigger overlay={<Tooltip>Unique Alias representing the Asset and takes the "role" of the NFT Name</Tooltip>}>  
                                <Figure><TbInfoCircle /></Figure>
                                </OverlayTrigger>
                            </Col>
                            <Col sm={8}>
                                <Form.Select defaultValue="Choose an NFT Name" onChange={(event) => { handleNFTnameChoice(event.target.value) }}>
                                    <option>Choose an NFT Name</option>
                                    {NFTnames.map(nftname => <option key={nftname} value={nftname}>{nftname}</option>)}
                                </Form.Select>
                            </Col>
                        </Form.Group>

                        <Form.Group as={Row} className="flex-fill align-items-center mb-3" controlId="formNFTsymbol">
                            <Form.Label column sm={4}>NFT Symbol</Form.Label> 
                            <Col sm={8}>
                                <Form.Control type="input" placeholder="Choose an NFT symbol" onChange={(event) => { setNFTsymbol(event.target.value) }} />
                            </Col>
                        </Form.Group>

                        <Form.Group as={Row} className="flex-fill align-items-center mb-3" controlId="assetProviderURL">
                                <Form.Label column sm={4}>Download URL</Form.Label>
                                <Col sm={8}>
                                    <Form.Control type="input" placeholder="Enter the URL of your asset provider" onChange={(event) => { setDownloadURL(event.target.value) }} />
                                </Col>
                            </Form.Group>

                        <Form.Group as={Row} className="flex-fill align-items-center mb-3" controlId="formNFTuri">
                            <Form.Label column sm={4}>Encrypted Offering's CID</Form.Label>
                            <Col sm={8}>
                                <Form.Control className="text-truncate"  disabled={true} type="text" placeholder="Asymmetrically Encrypted CID" 
                                    value={EncCID.length == 0 ? "" : EncCID}/>
                            </Col>
                        </Form.Group>
                    </Card.Body>

                    <Card.Title className="text-center">Create your fungible Data Token</Card.Title>
                    <Card.Body>
                        <Form.Group as={Row} className="flex-fill align-items-center mb-3" controlId="formDTname">
                            <Form.Label column sm={4}>DataToken Name</Form.Label>
                            <Col sm={8}>
                                <Form.Control type="input" placeholder="Enter the DT Name" onChange={(event) => { setDTname(event.target.value) }}/>
                            </Col>
                        </Form.Group>

                        <Form.Group as={Row} className="flex-fill align-items-center mb-3" controlId="formDTsymbol">
                            <Form.Label column sm={4}>DataToken Symbol</Form.Label>
                            <Col sm={8}>
                                <Form.Control type="input" placeholder="Enter the DT symbol" onChange={(event) => { setDTsymbol(event.target.value) }} />
                            </Col>
                        </Form.Group>

                        <Form.Group as={Row} className="flex-fill align-items-center mb-3" controlId="formDTmaxSupply">
                            <Form.Label column sm={4}>Maximum Supply</Form.Label>
                            <Col sm={8}>
                                <Form.Control type="input" placeholder="Enter the DT maximum supply" onChange={(event) => { setDTmaxSupply(BigInt(event.target.value)) }} />
                            </Col>
                        </Form.Group>
                    </Card.Body>

                    <Card.Title className="text-center">Trust Metadata</Card.Title>
                    <Card.Body>
                        <Form.Group as={Row} className="flex-fill align-items-center mb-3" controlId="assetHash">
                            <Form.Label column sm={4}>Asset Hash</Form.Label>
                            <Col sm={8}>
                                <Form.Control className="text-truncate" type="input" placeholder="Hash of the Asset" disabled 
                                value={Assethash.length == 0 ? "" : Assethash}/>
                            </Col>
                        </Form.Group>

                        <Form.Group as={Row} className="flex-fill align-items-center mb-3" controlId="offeringHash">
                            <Form.Label column sm={4}>Offering Hash</Form.Label>
                            <Col sm={8}>
                                <Form.Control className="text-truncate" type="input" placeholder="Hash of the Offering" disabled
                                value={OfferingHash.length == 0 ? "" : OfferingHash}/>
                            </Col>
                        </Form.Group>

                        <Form.Group as={Row} className="flex-fill align-items-center mb-3" controlId="trustSign">
                            <Form.Label column sm={4}>Trust Signature</Form.Label>
                            <Col sm={8}>
                                <Form.Control className="text-truncate" type="input" placeholder="Trust Signature" disabled
                                value={TrustSign.length == 0 ? "" : TrustSign}/>
                            </Col>
                        </Form.Group>

                    </Card.Body>

                    <Button variant="primary" type="submit" className='mt-3 mb-3' onClick={(event) => { handleSubmit(event) }}>
                        Publish
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
        }
        </>
    );
}
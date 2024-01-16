import { useEffect, useState } from 'react';
import { Button, Form, Col, Row, OverlayTrigger, Tooltip, Container, Spinner, Badge } from 'react-bootstrap';
import { ethers } from 'ethers';
import isUrl from "is-url";

import { extractNumberFromVCid, getContractABI, getContractAddress } from '@/utils';

import { useIdentity } from '@/hooks/useIdentity';
import { useMetaMask } from '@/hooks/useMetaMask';
import { useError } from '@/hooks/useError';

import connectorAPI from '@/api/connectorAPIs';


export const Publish = () => {
    const [assetAlias, setAssetAlias] = useState("");
    const [NFTnames, setNFTnames] = useState([]);
    const [NFTsymbol, setNFTsymbol] = useState("");
    const [cid, setCid] = useState("");
    const [encrypt, setEncrypt] = useState(true);

    const [DTname, setDTname] = useState("");
    const [DTsymbol, setDTsymbol] = useState("");
    const [DTmaxSupply, setDTmaxSupply] = useState<bigint>(BigInt(0));
    const [DownloadURL, setDownloadURL] = useState("");

    const [Assethash, setAssetHash] = useState("");
    const [OfferingHash, setOfferingHash] = useState("");
    const [TrustSign, setTrustSign] = useState("");

    const [publishing, setPublishing] = useState(false);

    const { wallet, provider } = useMetaMask()
    const { did, vc, connectorUrl } = useIdentity();
    const { setError } = useError();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const aliases = await connectorAPI.getAssetAliases(connectorUrl,  wallet.accounts[0]);
                setNFTnames(aliases);   
            } catch (e) {
                if (e instanceof Error) {
                    console.log(e.message);
                    setError(e.message);
                }
            }
        }
        fetchData();
    }, [connectorUrl, setError]);

    const handleAssetChoice = async (chosenAssetAlias: string) => {
       
        try {
            
            if ( chosenAssetAlias === "no-selection" ) {
                throw new Error("No asset selected")
            }

            console.log("Reading NFT info...");
            const assetInfo = await connectorAPI.getAssetInfo(connectorUrl, chosenAssetAlias);
            setAssetAlias(chosenAssetAlias);
            setCid(assetInfo.cid);
            setAssetHash(assetInfo.asset_hash);
            setOfferingHash(assetInfo.offering_hash);
            setTrustSign(assetInfo.sign);
        
        } catch (error) {
            setAssetAlias("");
            setCid("");
            setAssetHash("");
            setOfferingHash("");
            setTrustSign("");
            setEncrypt(true);
            if ( chosenAssetAlias != "no-selection" && error instanceof Error ) {
                console.log(error);
                setError(error.message)
            }
        } 
    }

    const handleSubmit = async (event: React.MouseEvent<HTMLElement>) => {
        event.preventDefault();

        if ( wallet.accounts[0] === undefined ) {
            setError("Please connect your wallet!"); 
            return;
        } 

        if (!isUrl(connectorUrl)) {
            setError('Connector url error');
            return;
        }

        if ( did === undefined || vc == undefined ) {
            setError("DID undefined");
            return;
        } 

        if ( assetAlias === "" ) {
            setError("No asset selected");
            return;
        }

        try{
            setPublishing(true);
            let tokenURI = cid;
            if (encrypt) {
                tokenURI = await connectorAPI.encryptCid(connectorUrl, assetAlias, wallet.accounts[0]);
                console.log("Encrypted cid: ",tokenURI);
            }

            const signer = await provider!.getSigner(wallet.accounts[0]);

            const contractABI = await getContractABI("ERC721Factory");
            const contractAddress = getContractAddress("ERC721Factory");
            const contractIstance = new ethers.Contract(contractAddress!, contractABI, signer);
            
            const tx = await contractIstance.publishAllinOne({
                name: assetAlias,
                symbol: NFTsymbol,
                tokenURI: tokenURI,
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
                const contractEvent = rc.logs[i];
                if(contractEvent.eventName == 'NFTCreated' && contractEvent.eventSignature == "NFTCreated(address,address,string,address,string,string)"){
                console.log(`event ${contractEvent.eventName}: address ${contractEvent.args[0]}`);
                    //TODO: move in connector API
                    const resp = await fetch(`${connectorUrl}/assets/${assetAlias}`, {
                        method: 'PATCH',
                        headers: {
                            "Content-type": "application/json"
                        },
                        body: JSON.stringify({
                            nft_sc_address: contractEvent.args[0],
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

    return (<>
        <h1 className="text-center">Connector - Publish</h1>
        {
            publishing ? 
            <Row className='justify-content-center mt-5'>
                <Spinner animation="grow" variant="primary" className="my-auto"/>
            </Row>
            : 
            <>
                <Form className="mt-3 mb-3 ps-3 pe-3">
                    <h4 className='text-primary'><Badge bg="dark">Create your NFT</Badge></h4>
                    <Form.Group as={Row} className="flex-fill align-items-center mb-3" controlId="formNFTname">
                        <OverlayTrigger  placement="left" overlay={<Tooltip>Unique alias representing the asset and it is used as NFT Name</Tooltip>}>  
                            <Form.Label column sm={4}>Asset</Form.Label>
                        </OverlayTrigger>
                        <Col sm={8}>
                            <Form.Select defaultValue="no-selection" onChange={(event) => { handleAssetChoice(event.target.value) }}>
                                <option value="no-selection">Choose an asset to publish</option>
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
                        <Form.Label column sm={4}>Offering&apos;s CID</Form.Label>
                        <Col sm={8}>
                            <Form.Check type="switch" id="custom-switch" label="Encrypt" onChange={() => { setEncrypt(!encrypt) }}/> 
                            <Form.Control className="text-truncate"  disabled type="text" placeholder="CID" value={cid.length == 0 ? "" : cid}/>
                        </Col>
                    </Form.Group>

                    <h4 className='text-primary'><Badge bg="dark">Create your fungible Data Token</Badge></h4>
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

                    <h4 className='text-primary'><Badge bg="dark">Trust Metadata</Badge></h4>
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

                    <Container className="d-flex justify-content-center">
                        <Button variant="primary" type="submit" className='mt-3 mb-3' onClick={(event) => { handleSubmit(event) }}>
                            Publish
                        </Button>
                    </Container>
                </Form>
            </>
        }
        </>
    );
}
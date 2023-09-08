import { MouseEvent, useEffect, useState } from 'react';
import { Card, Button, Form, Col, Row, Alert, OverlayTrigger, Tooltip, Figure } from 'react-bootstrap';
import { ethers } from 'ethers';
import { getContractABI, getContractAddress, getPermitDigest } from '@/utils';
import { useMetaMask } from '@/hooks/useMetaMask';
import { TbInfoCircle } from 'react-icons/tb';

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
    const [published, setPublished] = useState(false);

    const { wallet, provider, shimmerProvider } = useMetaMask()

    useEffect(() => {
        const getAssetAliases = async () => {
            try {
                const response = await fetch("http://localhost:1234/assetAliases", {
                    method: "GET"
                });
                const body = await response.json();
                if(response.status == 200) {
                    console.log(body.aliases)
                    setNFTnames(body.aliases)
                } else {
                    const err = new Error(body["error"]);
                    setError(err.message)
                    throw err;
                }
            } catch (error) {
                console.log(error)
            }
        }

        getAssetAliases();
    }, []);

    const handleNFTnameChoice = async (chosen_alias: string) => {
        if(chosen_alias == "Choose an NFT Name") {
            setNFTname("");
            setEncCID("");
            setAssetHash("");
            setOfferingHash("");
            setTrustSign("");
            return;
        }
        try {
            const response = await fetch(`http://localhost:1234/ladInfo/${wallet.accounts[0]}/${chosen_alias}`, {
                method: "GET",
            })
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
        try{
            event.preventDefault();
            const signer = await provider!.getSigner(wallet.accounts[0]);

            const contractABI = await getContractABI("ERC721Factory");
            const exchangeABI = await getContractABI("FixedRateExchange");
            const contractAddress = getContractAddress("ERC721Factory");
            const exchangeAddress = getContractAddress("FixedRateExchange");

            const contractIstance = new ethers.Contract(contractAddress!, contractABI, signer);
            const exchangeInstance = new ethers.Contract(exchangeAddress!, exchangeABI, signer);
            
            // contractIstance.on("NFTCreated", async (newERC721Contract, ERC721baseAddress, name, owner, symbol, tokenURI, event2) => {
            //     console.log("New ERC721 NFT contract deployed successfully!");
            //     console.log(newERC721Contract, ERC721baseAddress, name, owner, symbol, tokenURI, event2);
            //     /**
            //     * Given the new NFT contract address create also the required DT.
            //     */
            //     const ERC721baseABI = await getContractABI("ERC721Base");
            //     let erc721ContractIstance = new ethers.Contract(newERC721Contract, ERC721baseABI, signer);
                            
            //     await erc721ContractIstance.createDataToken(
            //         DTname,
            //         DTsymbol,
            //         ethers.parseEther(DTmaxSupply.toString())
            //     );
            //     await erc721ContractIstance.once("TokenCreated", async (name_, symbol_, owner_, NFTcontractAddress_, newERC20address_, maxSupply_, initialSupply_, event) => {
            //         console.log(name_, symbol_, owner_, NFTcontractAddress_, newERC20address_, maxSupply_, initialSupply_, event);
            //         /**
            //          * Given the new DT contract address wait for minting.
            //          */
            //         const ERC20baseABI = await getContractABI("ERC20Base");
            //         let erc20ContractIstance = new ethers.Contract(newERC20address_, ERC20baseABI, signer);
                    
            //         /** exchange with no mint permission => so i can test the permit mechnism
            //          *  1. Mint tokens to the owner address
            //          *  2. Approve the exchange to move tokens on behalf of owner
            //          *  3. Try to exchange DT <=> SMR and see if the exchange can actually call the transferFrom()
            //         *  */ 
            //         const ownerAddress = await erc20ContractIstance.getDTowner();
            //         let ownerWallet = new ethers.Wallet("e437c5b63d7514211dc55d47cd380cf002a2f44cb3034b6ebc101027bfb3dbce", provider);  
            //         const nonce = await erc20ContractIstance.nonces(ownerAddress);

            //         await erc20ContractIstance.mint(ownerAddress, ethers.parseEther("10")); // mint 10 DTs
            //         await erc20ContractIstance.createFixedRate(exchangeAddress, BigInt(1e16), 0);
                    
            //         erc20ContractIstance.once("FixedRateCreated", async (exchangeID, _owner, fixedRateAddress_, event) => {
            //             console.log(exchangeID, _owner, fixedRateAddress_, event);
            //             // const approve = {
            //             //     owner: ownerAddress,
            //             //     spender: exchangeAddress!,
            //             //     value: ethers.parseEther("10")
            //             // }
            //             // const digest = getPermitDigest(
            //             //     DTname,
            //             //     newERC20address_,
            //             //     Number((await provider!.getNetwork()).chainId),
            //             //     approve,
            //             //     nonce,
            //             //     MaxUint256
            //             // )
            //             // const signature = ownerWallet.signingKey.sign(digest)
    
            //             // await exchangeInstance.safeDeposit(
            //             //     newERC20address_,
            //             //     signature.v, signature.r, signature.s,
            //             //     ethers.parseEther("10")
            //             // )

            //             await erc20ContractIstance.approve(exchangeAddress, ethers.parseEther("1"))
            //             erc20ContractIstance.once("Approval", async (owner, spender, amount, event) => {
            //                 console.log(owner, spender, amount, event);
            //                 const allowance = await erc20ContractIstance.allowance(owner, spender);
            //                 console.log(`allowance: ${allowance}`);
            //                 // await erc20ContractIstance.transferFrom(ownerAddress, exchangeAddress, ethers.parseEther("1"));
            //                 // erc20ContractIstance.on("Transfer", (from, to, amount, event) => {
            //                 //     console.log(from, to, amount, event)
            //                 // })
            //             })
            //         })
            //     });
            // });

            // const tx = await contractIstance.deployERC721Contract(
            //     NFTname,
            //     NFTsymbol,
            //     EncCID,
            //     DownloadURL,
            //     Assethash,
            //     OfferingHash,
            //     TrustSign,
            // );
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
                maxSupply_: ethers.parseEther(DTmaxSupply.toString())
            },
                exchangeAddress
            );

            const rc = await tx.wait(3);
        } catch (err) {
            console.log(err);
        }
    }

    return (
        <>
        <Card style={{width: '60rem'}} className='d-flex mb-5 mt-3'>
            <Card.Body>
                <Card.Title>Publish a new tokenized Data/Service</Card.Title>
            </Card.Body>
            <Form className="mt-3 mb-3 ps-5 pe-5">

            <Form.Group as={Row} className="flex-fill align-items-center mb-3" controlId="formNFTname">
                <Col sm={4} >
                    <Form.Label style={{fontSize: "20px", fontFamily: 'italic'}}>
                        NFT Name/Asset Alias
                        <OverlayTrigger  
                            placement="top"
                            overlay={<Tooltip>Unique Alias representing the Asset and takes the "role" of the NFT Name</Tooltip>}
                            >  
                        <Figure><TbInfoCircle /></Figure>
                        </OverlayTrigger>
                    </Form.Label>
                </Col>
                <Col sm={8}>
                    <Form.Select size="lg" defaultValue="Choose an NFT Name" onChange={(event) => { handleNFTnameChoice(event.target.value) }}>
                        <option>Choose an NFT Name</option>
                        {NFTnames.map(nftname => <option key={nftname} value={nftname}>{nftname}</option>)}
                    </Form.Select>
                </Col>
            </Form.Group>

            <Form.Group as={Row} className="flex-fill align-items-center mb-3" controlId="formNFTsymbol">
                <Col sm={4}> 
                    <Form.Label style={{fontSize: "20px", fontFamily: 'italic'}}>NFT Symbol</Form.Label> 
                </Col>
                <Col sm={8}>
                    <Form.Control size="lg" type="input" placeholder="Choose an NFT symbol" onChange={(event) => { setNFTsymbol(event.target.value) }} />
                </Col>
            </Form.Group>

            <Form.Group as={Row} className="flex-fill align-items-center mb-3" controlId="assetProviderURL">
                    <Col sm={4}>
                        <Form.Label style={{fontSize: "20px", fontFamily: 'italic'}}>Download URL</Form.Label>
                    </Col>
                    <Col sm={8}>
                        <Form.Control size="lg" type="input" placeholder="Enter the URL of your asset provider" onChange={(event) => { setDownloadURL(event.target.value) }} />
                    </Col>
                </Form.Group>

            <Form.Group as={Row} className="flex-fill align-items-center mb-3" controlId="formNFTuri">
                <Col sm={4}>
                    <Form.Label style={{fontSize: "20px", fontFamily: 'italic'}}>Encrypted Offering's CID</Form.Label>
                </Col>
                <Col sm={8}>
                    <Form.Control disabled={true} size="lg" type="text" placeholder="Asymmetrically Encrypted CID" 
                        value={EncCID.length == 0 ? "" : EncCID} style={{fontSize: "18px", fontFamily: 'italic'}}/>
                </Col>
            </Form.Group>

            <Card.Title>Create your fungible Data Token</Card.Title>
            <Card.Body>
                <Form.Group as={Row} className="flex-fill align-items-center mb-3" controlId="formDTname">
                    <Col sm={3}>
                        <Form.Label style={{fontSize: "20px", fontFamily: 'italic'}}>DataToken Name</Form.Label>
                    </Col>
                    <Col sm={9}>
                        <Form.Control size="lg" type="input" placeholder="Enter the DT Name" onChange={(event) => { setDTname(event.target.value) }}/>
                    </Col>
                </Form.Group>

                <Form.Group as={Row} className="flex-fill align-items-center mb-3" controlId="formDTsymbol">
                    <Col sm={3}>
                        <Form.Label style={{fontSize: "20px", fontFamily: 'italic'}}>DataToken Symbol</Form.Label>
                    </Col>
                    <Col sm={9}>
                        <Form.Control size="lg" type="input" placeholder="Enter the DT symbol" onChange={(event) => { setDTsymbol(event.target.value) }} />
                    </Col>
                </Form.Group>

                <Form.Group as={Row} className="flex-fill align-items-center mb-3" controlId="formDTmaxSupply">
                    <Col sm={3}>
                        <Form.Label style={{fontSize: "20px", fontFamily: 'italic'}}>Maximum Supply</Form.Label>
                    </Col>
                    <Col sm={9}>
                        <Form.Control size="lg" type="input" placeholder="Enter the DT maximum supply" onChange={(event) => { setDTmaxSupply(BigInt(event.target.value)) }} />
                    </Col>
                </Form.Group>
            </Card.Body>

            <Card.Title>Trust Metadata</Card.Title>
            <Card.Body>
                <Form.Group as={Row} className="flex-fill align-items-center mb-3" controlId="assetHash">
                    <Col sm={2}>
                        <Form.Label style={{fontSize: "20px", fontFamily: 'italic'}}>Asset Hash</Form.Label>
                    </Col>
                    <Col sm={10}>
                        <Form.Control size="lg" type="input" placeholder="Hash of the Asset" disabled 
                        value={Assethash.length == 0 ? "" : Assethash} style={{fontSize: "20px", fontFamily: 'italic'}} />
                    </Col>
                </Form.Group>

                <Form.Group as={Row} className="flex-fill align-items-center mb-3" controlId="offeringHash">
                    <Col sm={2}>
                        <Form.Label style={{fontSize: "20px", fontFamily: 'italic'}}>Offering Hash</Form.Label>
                    </Col>
                    <Col sm={10}>
                        <Form.Control size="lg" type="input" placeholder="Hash of the Offering" disabled
                        value={OfferingHash.length == 0 ? "" : OfferingHash} style={{fontSize: "20px", fontFamily: 'italic'}} />
                    </Col>
                </Form.Group>

                <Form.Group as={Row} className="flex-fill align-items-center mb-3" controlId="trustSign">
                    <Col sm={3}>
                        <Form.Label style={{fontSize: "20px", fontFamily: 'italic'}}>Trust Signature</Form.Label>
                    </Col>
                    <Col sm={12}>
                        <Form.Control size="lg" type="input" placeholder="Trust Signature" disabled
                        value={TrustSign.length == 0 ? "" : TrustSign} style={{fontSize: "20px", fontFamily: 'italic'}} />
                    </Col>
                </Form.Group>

            </Card.Body>

            <Button variant="primary" type="submit" className='mt-3 mb-3' onClick={(event) => { handleSubmit(event) }}>
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
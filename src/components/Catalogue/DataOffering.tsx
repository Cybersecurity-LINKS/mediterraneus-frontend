// SPDX-FileCopyrightText: 2024 Fondazione LINKS
//
// SPDX-License-Identifier: GPL-3.0-or-later

import { RefAttributes, MouseEvent, useState, useEffect} from "react";
import { Card, OverlayTrigger, Tooltip, TooltipProps, Button, Spinner, Row } from "react-bootstrap";
import { Link } from 'react-router-dom';

import { IDataOffering } from "./Catalogue";
import { NETWORK_SYMBOL, formatAddress2, formatDid, getContractABI, getContractAddress } from "@/utils";
import { useMetaMask } from "@/hooks/useMetaMask";
import { IotaDID } from "@iota/identity-wasm/web";
import { AbiCoder, ethers, keccak256 } from "ethers";
import { VerticallyCenteredModal } from "../VerticallyCenteredModal/VerticallyCenteredModal";

import catalogueAPI from "@/api/catalogueAPIs";
import connectorAPI from "@/api/connectorAPIs";
import { useIdentity } from "@/hooks/useIdentity";


export const DataOffering = (props: { NFTdataobj: IDataOffering } ) => {
    const baseExplorerURL = import.meta.env.VITE_EVM_EXPLORER;
    const { provider, wallet } = useMetaMask();
    const { id, did, connectorUrl } = useIdentity();

    // const [ownerDID, setOwnerDID] = useState<IotaDID>(); 
    const [offering, setOffering] = useState(""); 
    const [price, setPrice] = useState(0);
    const [native, setNative] = useState("");
    const [loading, setLoading] = useState(true); 
    const [loadingOffering, setLoadingOffering] = useState(true); 
    const [downloadable, setDownloadable] = useState(false); 
    const [modalShow, setModalShow] = useState(false);

    const renderTooltip = (props: JSX.IntrinsicAttributes & TooltipProps & RefAttributes<HTMLDivElement>) => (
        <Tooltip id="button-tooltip" {...props}>
          Open in Block Explorer
        </Tooltip>
    );
    
    useEffect(() => {
    
        const isDownloadable = async () => {
            const signerAddress = (await provider?.getSigner())!.address;
            const accessTokenABI = await getContractABI("AccessTokenBase");
            const accessTokenIstance = new ethers.Contract(props.NFTdataobj.DTcontractAddress, accessTokenABI, await provider?.getSigner());
    
            const currentUserBalance = await accessTokenIstance.balanceOf(signerAddress);
            if(currentUserBalance >= ethers.parseEther("1") && ((wallet.accounts[0] as string).toLowerCase() !== props.NFTdataobj.owner.toLowerCase())) {
                setDownloadable(true);
            }
        }
        setLoading(false);

        // getVCownerDID(props.NFTdataobj.owner);
        if(!loading) { 
            getOfferingFromIPFS(); 
            getTokenPrice();
            isDownloadable();
            setLoadingOffering(false);
        }
    }, [props.NFTdataobj.owner, loading])

    const getOfferingFromIPFS = async () => {

        console.log("todo get offering from ipfs");
        //TODO: handle err
        // 
        // if ( ownerDID !== undefined) {
        //     const offering = await catalogueAPI.getOfferingContent(props.NFTdataobj.NFTmetadataURI, ownerDID.toString());
        //     setOffering(offering);
        // } else {
        //     console.log("DID of the owner not defined");
        // }   
    }

    const getTokenPrice = async () => {
        const accessTokenABI = await getContractABI("AccessTokenBase");
        const accessTokenIstance = new ethers.Contract(
            props.NFTdataobj.DTcontractAddress, 
            accessTokenABI, 
            provider
        );
        // get owner of DT
        const ownerAddress = await accessTokenIstance.getDTowner();
        const ownerBalance = await accessTokenIstance.balanceOf(ownerAddress)

        // get Exchange address and contract instance
        const exchangeABI = await getContractABI("FixedRateExchange");
        const exchangeAddress = getContractAddress("FixedRateExchange");
        const exchangeContractIstance = new ethers.Contract(
            exchangeAddress!, 
            exchangeABI,
            await provider?.getSigner()
        );

        const exchangeID_forthisDT = keccak256(
            new AbiCoder().encode(
                ['address', 'address'],
                [props.NFTdataobj.DTcontractAddress, ownerAddress]
            )
        );
        const res: bigint = await exchangeContractIstance.getSMRcostFor1DT(exchangeID_forthisDT);
        const rate: bigint = await exchangeContractIstance.getExchangeFixedRate(exchangeID_forthisDT);
        setPrice(Number(res)/(1e18));
        console.log(`Data token info:\n -Owner balance: ${ownerBalance}\n -ExchangeID: ${exchangeID_forthisDT}\n -Cost for 1 AT = ${Number(res)/(1e18)} with rate ${Number(rate)/(1e18)}`);  
        setNative(NETWORK_SYMBOL[Number((await provider!.getNetwork()).chainId)])
    }

    // buy asset access
    const handleSubmit = async (event: MouseEvent<HTMLButtonElement, globalThis.MouseEvent>) => {
        try{
            event.preventDefault();
            const signerAddress = (await provider?.getSigner())!.address;
            const accessTokenABI = await getContractABI("AccessTokenBase");
            const accessTokenIstance = new ethers.Contract(props.NFTdataobj.DTcontractAddress, accessTokenABI, await provider?.getSigner());
            
            // get owner of DT
            const ownerAddress = await accessTokenIstance.getDTowner();

            // get Exchange address and contract instance
            const exchangeABI = await getContractABI("FixedRateExchange");
            const exchangeAddress = getContractAddress("FixedRateExchange");
            const exchangeContractIstance = new ethers.Contract(exchangeAddress!, exchangeABI, await provider?.getSigner())

            const exchangeID_forthisDT = keccak256(
                new AbiCoder().encode(
                    ['address', 'address'],
                    [props.NFTdataobj.DTcontractAddress, ownerAddress]
                )
            );
            const res: bigint = await exchangeContractIstance.getSMRcostFor1DT(exchangeID_forthisDT);
            const rate: bigint = await exchangeContractIstance.getExchangeFixedRate(exchangeID_forthisDT);
            console.log(`exchangeID = ${exchangeID_forthisDT}, cost for 1 ST = ${Number(res)/(1e18)} with rate ${rate}`);  
            
            // sell DT since the subject is the smart contract, not the user
            exchangeContractIstance.sellDT(exchangeID_forthisDT, ethers.parseEther("1"), {value: res}); // user buy DT from the exchange SC
            exchangeContractIstance.on("SuccessfulSwap", async (exchangeId, caller, exchangeOwner, dtamount, smrsent, event) => {
                console.log(exchangeId, caller, exchangeOwner, dtamount, smrsent, event);
                const newBalance = await accessTokenIstance.balanceOf(signerAddress);
                setDownloadable(true);
                console.log(newBalance);
            })
        } catch(err) {
            console.log(err);
        }
    }

    const downloadAsset = async (event: MouseEvent<HTMLButtonElement, globalThis.MouseEvent>) => {
        event.preventDefault();

        const NFTname = props.NFTdataobj.NFTname; 
        const providerConnectorUrl = props.NFTdataobj.AssetDownloadURL;
        try {
            const challenge = await connectorAPI.getChallenge(providerConnectorUrl, did!.toString());
            console.log("Download chaallenge: ", challenge);
            // const hashedChallenge = keccak256(Buffer.from(challenge  as string )); //TODO: remove this
            // const signature = await signer?.signMessage(ethers.toBeArray(`${hashedChallenge}`));

            const signer = await provider?.getSigner();
            const walletSignature = await signer?.signMessage(challenge);
            console.log("Eth signature: ", walletSignature);
        
            // ask connector (identity key wallet) to create a verifiable presentation
            const presentationJwt = await connectorAPI.generatePresentation(connectorUrl, challenge, id!, walletSignature!.toString());
            console.log("Presentation JWT: ", presentationJwt);
            
            // authnticated download request to provider
            // await verifierAPI.helloWorld(presentationJwt.presentation)

            const asset = await connectorAPI.downloadAsset(providerConnectorUrl, NFTname, presentationJwt.presentation);
            // anchor link
            const element = document.createElement("a");
            element.href = URL.createObjectURL(asset);
            element.download = `Asset-${NFTname}-` + Date.now() + ".json";

            // simulate link click
            document.body.appendChild(element); // Required for this to work in FireFox
            element.click();
            
        } catch (err) {
            console.log(err);
        }
    }

    return (
        <Card className="m-2">
            <Card.Header>
                <Card.Title>Owner</Card.Title>
                <Card.Subtitle className="mb-2">
                    <OverlayTrigger placement="right" delay={{ show: 250, hide: 400 }} overlay={renderTooltip} >
                        <Link to={baseExplorerURL+"/address/"+props.NFTdataobj.NFTaddress} target="_blank" className="info ms-2" style={{ color: 'gray', textDecoration: 'none' }}>
                            {formatDid(props.NFTdataobj.owner)}
                        </Link>
                    </OverlayTrigger>
                </Card.Subtitle>
            </Card.Header>
            <Card.Body>
                <Card.Text> NFT name<span className="float-end">{props.NFTdataobj.NFTname}</span> </Card.Text>
                <Card.Text> NFT symbol<span className="float-end">{props.NFTdataobj.NFTsymbol}</span> </Card.Text>
                <Card.Text> NFT address
                    <span className="float-end">
                        <OverlayTrigger placement="right" delay={{ show: 250, hide: 400 }} overlay={renderTooltip} >
                            <Card.Link href={baseExplorerURL+"/address/"+props.NFTdataobj.NFTaddress} target="_blank" className="info ms-2" style={{ textDecoration: 'none' }}>{formatAddress2(props.NFTdataobj.NFTaddress)}</Card.Link>
                        </OverlayTrigger>
                    </span>
                </Card.Text>
                <Card.Text>Data Token name<span className="float-end">{props.NFTdataobj.DTname}</span></Card.Text>
                <Card.Text>Data Token symbol<span className="float-end">{props.NFTdataobj.DTsymbol}</span></Card.Text>
                <Card.Text>Data Token address 
                    <span className="float-end">
                    <OverlayTrigger placement="right" delay={{ show: 250, hide: 400 }} overlay={renderTooltip}>
                        <Card.Link href={baseExplorerURL+"/address/"+props.NFTdataobj.DTcontractAddress} target="_blank" className="ms-2" style={{ textDecoration: 'none' }}>{formatAddress2(props.NFTdataobj.DTcontractAddress)}</Card.Link>
                    </OverlayTrigger>
                    </span> 
                </Card.Text>
                <Card.Text>Asset access price
                    <span className="float-end">
                        <OverlayTrigger delay={{ show: 250, hide: 400 }} overlay={<Tooltip><strong>Exchange Rate:</strong><br/>1 {`${props.NFTdataobj.DTsymbol} = ${price} ${native}`}</Tooltip>}>          
                            <a>1 {`${props.NFTdataobj.DTsymbol}`} </a>
                        </OverlayTrigger>
                    </span>  
                </Card.Text>
            </Card.Body>
            <Card.Footer>
                {
                    loadingOffering ? 
                        <Row className='justify-content-center'>
                            <Spinner animation="grow" variant="primary" className="my-auto"/>
                        </Row> 
                    :
                    <>
                        <Button variant="outline-secondary" className="me-2" onClick={() => setModalShow(true)}>
                            Show offering
                        </Button>
                        <VerticallyCenteredModal
                            key={props.NFTdataobj.NFTname}
                            show={modalShow}
                            onHide={() => setModalShow(false)}
                            title={"Offering"}
                            body={JSON.stringify(offering, null, 2)}
                        />
                    </>    
                }
                {
                    downloadable ? 
                    <Button type="submit" variant="warning" onClick={(event) => { downloadAsset(event)}}>
                        Download Asset
                    </Button> 
                    :
                    ((wallet.accounts[0] as string).toString().toLowerCase() !== props.NFTdataobj.owner.toLowerCase()) &&
                    <Button type="submit" onClick={(event) => { handleSubmit(event)}}>
                        Buy Asset access
                    </Button>
                }
                </Card.Footer>
        </Card>
  );
}
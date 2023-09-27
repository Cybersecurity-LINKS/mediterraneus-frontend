import { Card, OverlayTrigger, Tooltip, TooltipProps, Button, Spinner } from "react-bootstrap";
import { IDataOffering } from "./Catalogue";
import { RefAttributes, MouseEvent, useState, useEffect } from "react";
import { NETWORK_SYMBOL, formatAddress2, formatDid, getContractABI, getContractAddress, getIdentitySC } from "@/utils";
import { useMetaMask } from "@/hooks/useMetaMask";
import { AbiCoder, ethers, keccak256 } from "ethers";
import CardHeader from "react-bootstrap/esm/CardHeader";
import { IotaDID } from "@iota/identity-wasm/web";
import { Buffer } from 'buffer';

export const DataOffering = (props: { NFTdataobj: IDataOffering } ) => {
    const baseExplorerURL = "https://explorer.evm.testnet.shimmer.network/address/";
    const { provider, wallet } = useMetaMask();

    const [ownerDID, setOwnerDID] = useState<IotaDID>();
    const [offering, setOffering] = useState("");
    const [price, setPrice] = useState(0);
    const [native, setNative] = useState("");
    const [loading, setLoading] = useState(true);
    const [loadingOffering, setLoadingOffering] = useState(true); 
    const [downloadable, setDownloadable] = useState(false); 

    const renderTooltip = (props: JSX.IntrinsicAttributes & TooltipProps & RefAttributes<HTMLDivElement>) => (
        <Tooltip id="button-tooltip" {...props}>
          Open in Block Explorer
        </Tooltip>
    );
    
    useEffect(() => {
        const getVCownerDID = async (owner: string) => {
            const IDSC_istance = await getIdentitySC(provider!);
            const did: string = await IDSC_istance.getVCownerDID_Addr(owner);
            setOwnerDID(IotaDID.parse(did));
            setLoading(false);
        }
        const isDownloadable = async () => {
            const signerAddress = (await provider?.getSigner())!.address;
            const DTcontractABI = await getContractABI("ERC20Base");
            const DTcontractIstance = new ethers.Contract(props.NFTdataobj.DTcontractAddress, DTcontractABI, await provider?.getSigner());
    
            const currentUserBalance = await DTcontractIstance.balanceOf(signerAddress);
            if(currentUserBalance >= ethers.parseEther("1") && ((wallet.accounts[0] as string).toLowerCase() !== props.NFTdataobj.owner.toLowerCase())) {
                setDownloadable(true);
            }
        }

        getVCownerDID(props.NFTdataobj.owner);
        if(!loading) {
            getOfferingFromIPFS();
            getDT_Price();
            isDownloadable();
            setLoadingOffering(false);
        }
    }, [props.NFTdataobj.owner, loading])

    const getOfferingFromIPFS = async () => {
        // need the owner pub key and the gc priv key to derive the shared key and decrypt the cid
        const response = await fetch("http://localhost:7777/decryptCID", {
            method: 'POST',
            headers: {
                "Content-type": "application/json"
            },
            body: JSON.stringify({
                ciphertext: props.NFTdataobj.NFTmetadataURI,
                asset_owner_did: ownerDID?.toString()
            })  
        })
        const json = await response.json();
        setOffering(json["offering"]);
    }

    const getDT_Price = async () => {
        const DTcontractABI = await getContractABI("ERC20Base");
        const DTcontractIstance = new ethers.Contract(props.NFTdataobj.DTcontractAddress, DTcontractABI, provider);
        // get owner of DT
        const ownerAddress = await DTcontractIstance.getDTowner();
        const ownerBalance = await DTcontractIstance.balanceOf(ownerAddress)

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
        const res: BigInt = await exchangeContractIstance.getSMRcostFor1DT(exchangeID_forthisDT);
        const rate: BigInt = await exchangeContractIstance.getExchangeFixedRate(exchangeID_forthisDT);
        setPrice(Number(res)/(1e18));
        console.log(`owner: ${ownerBalance} exchangeID = ${exchangeID_forthisDT}, cost for 1 DT = ${Number(res)/(1e18)} with rate ${Number(rate)/(1e18)}`);  
        setNative(NETWORK_SYMBOL[Number((await provider!.getNetwork()).chainId)])
    }

    const handleSubmit = async (event: MouseEvent<HTMLButtonElement, globalThis.MouseEvent>) => {
        try{
            event.preventDefault();
            const signerAddress = (await provider?.getSigner())!.address;
            const DTcontractABI = await getContractABI("ERC20Base");
            const DTcontractIstance = new ethers.Contract(props.NFTdataobj.DTcontractAddress, DTcontractABI, await provider?.getSigner());
            
            // get owner of DT
            const ownerAddress = await DTcontractIstance.getDTowner();

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
            const res: BigInt = await exchangeContractIstance.getSMRcostFor1DT(exchangeID_forthisDT);
            const rate: BigInt = await exchangeContractIstance.getExchangeFixedRate(exchangeID_forthisDT);
            console.log(`exchangeID = ${exchangeID_forthisDT}, cost for 1 DT = ${Number(res)/(1e18)} with rate ${rate}`);  
            
            exchangeContractIstance.sellDT(exchangeID_forthisDT, ethers.parseEther("1"), {value: res});
            exchangeContractIstance.on("SuccessfulSwap", async (exchangeId, caller, exchangeOwner, dtamount, smrsent, event) => {
                console.log(exchangeId, caller, exchangeOwner, dtamount, smrsent, event);
                const newBalance = await DTcontractIstance.balanceOf(signerAddress);
                setDownloadable(true);
                console.log(newBalance);
            })
        }catch(err) {
            console.log(err);
        }
    }

    const downloadAsset = async (event: MouseEvent<HTMLButtonElement, globalThis.MouseEvent>) => {
        event.preventDefault();
        try {
            const resp_nonce = await fetch(`${props.NFTdataobj.AssetDownloadURL}/downalod_asset_req`, {
                method: 'POST',
                headers: {
                    "Content-type": "application/json"
                },
                body: JSON.stringify({nft_name: props.NFTdataobj.NFTname})
            });
            const json_nonce_resp = await resp_nonce.json();
            const h_nonce = keccak256(Buffer.from(json_nonce_resp["nonce"]));

            const signer = await provider?.getSigner();
            const eth_signature = await signer?.signMessage(ethers.toBeArray(`${h_nonce}`));

            const asset_req = await fetch(`${props.NFTdataobj.AssetDownloadURL}/downalod_asset_sign`, {
                method: 'POST',
                headers: {
                    "Content-type": "application/json"
                },
                body: JSON.stringify({
                    h_nonce: h_nonce,
                    eth_signature: eth_signature
                })
            })
            const asset_resp = await asset_req.json();
            if(asset_req.status === 200) {
                const asset_json = asset_resp["asset"];
                console.log(asset_json)
                const file = new Blob([JSON.stringify(asset_json)], {type: "text/json;charset=utf-8"})

                // anchor link
                const element = document.createElement("a");
                element.href = URL.createObjectURL(file);
                element.download = `Asset-${props.NFTdataobj.NFTname}-` + Date.now() + ".json";

                // simulate link click
                document.body.appendChild(element); // Required for this to work in FireFox
                element.click();
            }
        } catch (err) {
            console.log(err);
        }
    }

    return (
        <Card className="m-2" style={{ width: '32rem' }}>
            <CardHeader className="">
                <Card.Title className="mb-2">
                    Owner:
                </Card.Title>
                <Card.Subtitle className="mb-2">{props.NFTdataobj.owner}</Card.Subtitle>
                <Card.Title className="mb-2">
                    DID:
                </Card.Title>
                <Card.Subtitle className="mb-2">{formatDid(ownerDID?.toString())}</Card.Subtitle>
            </CardHeader>
            <Card.Body>
                <Card.Title className="mb-2">NFT Name: {props.NFTdataobj.NFTname}</Card.Title>
                <Card.Subtitle className="mb-2 text-muted">NFT Symbol: {props.NFTdataobj.NFTsymbol}</Card.Subtitle>
                <Card.Text>
                    NFT Contract Address: 
                    <OverlayTrigger
                        placement="right"
                        delay={{ show: 250, hide: 400 }}
                        overlay={renderTooltip}
                    >
                        <Card.Link href={baseExplorerURL+props.NFTdataobj.NFTaddress} target="_blank" className="info ms-2">{formatAddress2(props.NFTdataobj.NFTaddress)}</Card.Link>
                    </OverlayTrigger> 
                </Card.Text>

                <Card.Title className="mb-2 mt-3">Data Token Name: {props.NFTdataobj.DTname}</Card.Title>
                <Card.Subtitle className="mb-2 text-muted">Data Token Symbol: {props.NFTdataobj.DTsymbol}</Card.Subtitle>
                <Card.Text>
                    Data Token address: 
                    <OverlayTrigger
                        placement="right"
                        delay={{ show: 250, hide: 400 }}
                        overlay={renderTooltip}
                    >
                        <Card.Link href={baseExplorerURL+props.NFTdataobj.DTcontractAddress} target="_blank" className="ms-2">{formatAddress2(props.NFTdataobj.DTcontractAddress)}</Card.Link>
                    </OverlayTrigger>
                </Card.Text>
                <Card.Title>Asset's Offering</Card.Title>
                {
                    loadingOffering ? <Spinner animation="border" variant="success" style={{
                        width: '3rem', 
                        height: '3rem', 
                        marginLeft: '13rem',
                        position: 'relative',
                        justifyContent: 'center',
                        flex: 1,
                    }}/> :
                    <Card style={{backgroundColor: "ThreeDLightShadow"}} className='mb-3 ms-auto me-auto'>
                        {
                            <pre className="ms-2 mt-2" style={{font: "icon", fontFamily: "cursive", color: "white"}}>
                                {offering}
                            </pre>
                        }
                    </Card>
                }
                
                <Card.Title className="mb-3">Price for Asset Access: 1 {`${props.NFTdataobj.DTsymbol}`}</Card.Title>
                <Card.Title className="mb-3">Exchange Rate: 1 {`${props.NFTdataobj.DTsymbol} = ${price} ${native}`}</Card.Title>
                {
                    downloadable ? 
                    <Button type="submit" onClick={(event) => { downloadAsset(event)}}>
                        Download Asset
                    </Button> 
                    :
                    ((wallet.accounts[0] as string).toString().toLowerCase() !== props.NFTdataobj.owner.toLowerCase()) &&
                    <Button type="submit" onClick={(event) => { handleSubmit(event)}}>
                        Buy Data/Service Access
                    </Button>
                }
            </Card.Body>
        </Card>
  );
}
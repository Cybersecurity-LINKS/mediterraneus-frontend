import { ListGroup, Modal, Card, OverlayTrigger, Tooltip, TooltipProps, Button, Spinner, ModalProps, Row, Col } from "react-bootstrap";
import { IDataOffering } from "./Catalogue";
import { RefAttributes, MouseEvent, useState, useEffect, DetailedHTMLProps, HTMLAttributes, ReactNode, RefObject } from "react";
import { NETWORK_SYMBOL, formatAddress2, formatDid, getContractABI, getContractAddress, getIdentitySC } from "@/utils";
import { useMetaMask } from "@/hooks/useMetaMask";
import { AbiCoder, ethers, keccak256 } from "ethers";
import CardHeader from "react-bootstrap/esm/CardHeader";
import { IotaDID } from "@iota/identity-wasm/web";
import { Buffer } from 'buffer';
import { Omit, BsPrefixProps } from "react-bootstrap/esm/helpers";
import { Link } from 'react-router-dom';

const catalogue_backend = import.meta.env.VITE_CATALOGUE_BACKEND as string;

function VerticallyCenteredModal(props: JSX.IntrinsicAttributes & Omit<Omit<DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement>, "ref"> & { ref?: ((instance: HTMLDivElement | null) => void) | RefObject<HTMLDivElement> | null | undefined; }, BsPrefixProps<"div"> & ModalProps> & BsPrefixProps<"div"> & ModalProps & { children?: ReactNode; }) {
    return (
      <Modal
        {...props}
        size="lg"
        aria-labelledby="contained-modal-title-vcenter"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title id="contained-modal-title-vcenter">
            Offering
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{backgroundColor: "ThreeDLightShadow"}}>
            <pre className="ms-2 mt-2" style={{color: "white"}}>
                {props.offering}
            </pre>
        </Modal.Body>
        <Modal.Footer>
        </Modal.Footer>
      </Modal>
    );
  }

export const DataOffering = (props: { NFTdataobj: IDataOffering } ) => {
    const baseExplorerURL = import.meta.env.VITE_EVM_EXPLORER;
    const { provider, wallet } = useMetaMask();

    const [ownerDID, setOwnerDID] = useState<IotaDID>();
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
        const response = await fetch(`${catalogue_backend}/decryptCID`, {
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
        
        if (response.ok){
            setOffering(json["offering"]);
        } else {
            let err = {status: response.status, errObj: json};
            throw err;  // An object with the error coming from the server
        }
        
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
        console.log(`Data token info:\n -Owner balance: ${ownerBalance}\n -ExchangeID: ${exchangeID_forthisDT}\n -Cost for 1 DT = ${Number(res)/(1e18)} with rate ${Number(rate)/(1e18)}`);  
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
                // TODO: check trust metadata!!!! here is missing
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
        <Card className="m-2" style={{ width: '30rem' }}>
            <CardHeader>
                <Card.Title>Owner</Card.Title>
                <Card.Subtitle className="mb-2">
                    <OverlayTrigger placement="right" delay={{ show: 250, hide: 400 }} overlay={renderTooltip} >
                        <Link to={baseExplorerURL+"/address/"+props.NFTdataobj.NFTaddress} target="_blank" className="info ms-2" style={{ color: 'gray', textDecoration: 'none' }}>
                            {formatDid(props.NFTdataobj.owner)}
                        </Link>
                    </OverlayTrigger>
                </Card.Subtitle>
                <Card.Title>DID Owner</Card.Title>
                <Card.Subtitle className="mb-2 text-muted">
                    <OverlayTrigger placement="right" delay={{ show: 250, hide: 400 }} overlay={renderTooltip} >
                        <Link to={`https://explorer.shimmer.network/testnet/identity-resolver/${ownerDID?.toString()}`} target="_blank" className="info ms-2" style={{ color: 'gray', textDecoration: 'none' }}>
                            {formatDid(ownerDID?.toString())}
                        </Link>
                    </OverlayTrigger>
                </Card.Subtitle>
            </CardHeader>
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
                    loadingOffering ? <Spinner animation="border" variant="info" style={{
                        width: '2rem', 
                        height: '2rem', 
                        marginLeft: '13rem',
                        position: 'relative',
                        justifyContent: 'center',
                        flex: 1,
                    }}/> :
                    <>
                    <Button variant="outline-secondary" className="me-2" onClick={() => setModalShow(true)}>
                        Show offering
                    </Button>
                    <VerticallyCenteredModal
                        show={modalShow}
                        onHide={() => setModalShow(false)}
                        offering={offering}
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
import { Card, OverlayTrigger, Tooltip, TooltipProps, Button } from "react-bootstrap";
import { IDataOffering } from "./Catalogue";
import { RefAttributes, MouseEvent } from "react";
import { formatAddress2, getContractABI } from "@/utils";
import { useMetaMask } from "@/hooks/useMetaMask";
import { ethers } from "ethers";

export const DataOffering = (props: { NFTdataobj: IDataOffering} ) => {
    
    const baseExplorerURL = "https://explorer.evm.testnet.shimmer.network/address/";
    const { shimmerProvider, provider } = useMetaMask();

    const renderTooltip = (props: JSX.IntrinsicAttributes & TooltipProps & RefAttributes<HTMLDivElement>) => (
        <Tooltip id="button-tooltip" {...props}>
          Open in Block Explorer
        </Tooltip>
    );

    const handleSubmit = async (event: MouseEvent<HTMLButtonElement, globalThis.MouseEvent>) => {
        try{
            event.preventDefault();
            const DTcontractABI = await getContractABI("ERC20Base");
            const DTcontractIstance = new ethers.Contract(props.NFTdataobj.DTcontractAddress, DTcontractABI, await provider?.getSigner());
            
            // console.log((ethers.parseEther("0.01") * BigInt("100")))
            // let res = await DTcontractIstance.balanceOf("0xE42AE5417Fd1eeeD1ED1ACd1f535315663758e66"); 
            let res = await DTcontractIstance.buyDT({value: ethers.parseEther("0.01")}); 
            // let res = await DTcontractIstance.getRate(); 
            // let res = await DTcontractIstance.getAllowedMinter(); 
            // console.log(ethers.toBigInt(res));

            DTcontractIstance.on("BuyDT", async (_allowedMinter, sender, value, amountToBuy, event) => {
                console.log(_allowedMinter, sender, value, amountToBuy, event);
            });
        }catch(err) {
            console.log(err);
        }
    }

    return (
        <Card className="m-2" style={{ width: '22rem' }}>
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
                <Card.Text>
                    Some short description
                </Card.Text>
                <Card.Link href={props.NFTdataobj.NFTmetadataURI} target="_blank">NFT Metadata URI</Card.Link>

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
                
                <Button size="sm" type="submit" onClick={(event) => { handleSubmit(event)}}>Buy Data/Service Access</Button>
            </Card.Body>
        </Card>
  );
}
import { Card, OverlayTrigger, Tooltip, TooltipProps, Button } from "react-bootstrap";
import { IDataOffering } from "./Catalogue";
import { RefAttributes, MouseEvent } from "react";
import { formatAddress2, getContractABI, getContractAddress, getDomainSeparator, getPermitDigest, getSemiPermitDigest } from "@/utils";
import { useMetaMask } from "@/hooks/useMetaMask";
import { AbiCoder, MaxUint256, TypedDataDomain, ethers, keccak256, recoverAddress, solidityPacked } from "ethers";

export const DataOffering = (props: { NFTdataobj: IDataOffering} ) => {
    
    const baseExplorerURL = "https://explorer.evm.testnet.shimmer.network/address/";
    const { provider } = useMetaMask();

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
            
            exchangeContractIstance.sellDT(exchangeID_forthisDT, 1, {value: ethers.parseEther((Number(res)/(1e18)).toString())});
            exchangeContractIstance.on("SuccessfulSwap", (exchangeId, caller, exchangeOwner, dtamount, smrsent) => {
                console.log(exchangeId, caller, exchangeOwner, dtamount, smrsent);
            })

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
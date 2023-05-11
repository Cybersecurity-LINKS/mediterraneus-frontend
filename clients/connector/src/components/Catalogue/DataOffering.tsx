import { Card, OverlayTrigger, Tooltip, TooltipProps, Button } from "react-bootstrap";
import { IDataOffering } from "./Catalogue";
import { RefAttributes } from "react";
import { formatAddress2 } from "@/utils";

export const DataOffering = (props: { NFTdataobj: IDataOffering} ) => {
    
    const baseExplorerURL = "https://explorer.evm.testnet.shimmer.network/address/"

    const renderTooltip = (props: JSX.IntrinsicAttributes & TooltipProps & RefAttributes<HTMLDivElement>) => (
        <Tooltip id="button-tooltip" {...props}>
          Open in Block Explorer
        </Tooltip>
    );

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
                
                <Button size="sm">Buy Data/Service Access</Button>
            </Card.Body>
        </Card>
  );
}
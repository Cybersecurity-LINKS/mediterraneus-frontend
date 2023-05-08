import { ReactElement, JSXElementConstructor, ReactFragment, ReactPortal } from "react";
import { Card } from "react-bootstrap";
import { IDataOffering } from "./Catalogue";

export const DataOffering = (props: { NFTdataobj: IDataOffering} ) => {
     console.log(props.NFTdataobj)
    return (
        <Card className="m-2" style={{ width: '18rem' }}>
            <Card.Body>
                <Card.Title>NFT Name: {props.NFTdataobj.NFTname}</Card.Title>
                <Card.Subtitle className="mb-2 text-muted">NFT Symbol: {props.NFTdataobj.NFTsymbol}</Card.Subtitle>
                <Card.Text>
                    {props.NFTdataobj.NFTaddress} Some short description
                </Card.Text>
                <Card.Link href="#" target="_blank">NFT Metadata URI</Card.Link>
            </Card.Body>
        </Card>
  );
}
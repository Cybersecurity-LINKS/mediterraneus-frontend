import { Alert, Col, Container, Row } from "react-bootstrap";
import { DataOffering } from "./DataOffering";
import { useEffect, useState } from "react";
import { getContractABI, getContractAddress } from "@/utils";
import { useMetaMask } from "@/hooks/useMetaMask";
import { ethers } from "ethers";

export interface IDataOffering {
    NFTaddress: string,
    NFTname: string,
    NFTsymbol: string,
    NFTmetadataURI: string,
    DTname: string,
    DTsymbol: string
    DTcontractAddress: string
}

export const Catalogue = () => {

    const [dataOfferings, setDataOfferings] = useState<IDataOffering[]>([]);
    const columnsPerRow = 4;

    const { shimmerProvider } = useMetaMask();

    useEffect(() => {

        const getNFTinfo = async (contractAddress: string): Promise<IDataOffering> => {
            const contractABI = await getContractABI("ERC721Base");
            const contractIstance = new ethers.Contract(contractAddress, contractABI, shimmerProvider);
            
            const DTcontractABI = await getContractABI("ERC20Base");
            const DTcontractAddress =  await contractIstance.getDTaddress();
            const DTcontractIstance = new ethers.Contract(DTcontractAddress, DTcontractABI, shimmerProvider);
            
            let NFTinfo: IDataOffering = {
                NFTaddress: contractAddress,
                NFTname: await contractIstance.name(),
                NFTsymbol: await contractIstance.symbol(),
                NFTmetadataURI: await contractIstance.tokenURI(1),
                DTname: await DTcontractIstance.name(),
                DTsymbol: await DTcontractIstance.symbol(),
                DTcontractAddress: DTcontractAddress
            };
            return NFTinfo;
        }
    
        const getDataOfferings = async () => {
            // call to SC
            try {
                const contractABI = await getContractABI("ERC721Factory");
                const contractAddress = getContractAddress("ERC721Factory");
                let contractIstance = new ethers.Contract(contractAddress!, contractABI, shimmerProvider);
    
                let [...NFTaddresses]: string[] = await contractIstance.getAllNFTCreatedAddress();
    
                let NFTobjs: IDataOffering[] = [];
                for(let i = 0; i < NFTaddresses.length; i++ ) {
                    let l_dataoffering = await getNFTinfo(NFTaddresses[i]);
                    NFTobjs.push(l_dataoffering);
                }
                setDataOfferings(NFTobjs); 
            } catch (error) {
                console.log(error);
            }
        }
            
        getDataOfferings();
        
    }, [dataOfferings.length]);

    return(
        dataOfferings.length == 0 ? 
        <Container className="mt-3">
            <Row><Col md={{ span: 6, offset: 3 }}><Alert variant="primary" className="text-center"> <strong>Nothing published yet!</strong></Alert></Col></Row>
        </Container>
            :
        <Row className="d-flex justify-content-center mt-3" md={columnsPerRow}> 
            {
                dataOfferings.map((NFTdataobj, index) => (
                    <Col key={index}><DataOffering key={index} NFTdataobj={NFTdataobj} /></Col>  
                ))
            }
        </Row>
    )
}

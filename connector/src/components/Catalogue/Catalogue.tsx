import { Alert, Col, Container, Row, Spinner } from "react-bootstrap";
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
    const [loading, setLoading] = useState(true);
    const columnsPerRow = 4;

    const { shimmerProvider } = useMetaMask();

    useEffect(() => {

        const getNFTinfo = async (contractAddress: string): Promise<IDataOffering> => {
            const contractABI = await getContractABI("ERC721Base");
            const contractIstance = new ethers.Contract(contractAddress, contractABI, shimmerProvider);
            
            const DTcontractABI = await getContractABI("ERC20Base");
            const [...DTcontractAddress] =  await contractIstance.getDTaddresses();
            console.log(DTcontractAddress)
            const DTcontractIstance = new ethers.Contract(DTcontractAddress[0], DTcontractABI, shimmerProvider);
            
            let NFTinfo: IDataOffering = {
                NFTaddress: contractAddress,
                NFTname: await contractIstance.name(),
                NFTsymbol: await contractIstance.symbol(),
                NFTmetadataURI: await contractIstance.tokenURI(1),
                DTname: await DTcontractIstance.name(),
                DTsymbol: await DTcontractIstance.symbol(),
                DTcontractAddress: DTcontractAddress[0]
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
                console.log(NFTaddresses)
                let NFTobjs: IDataOffering[] = [];
                for(let i = 0; i < NFTaddresses.length; i++ ) {
                    let l_dataoffering = await getNFTinfo(NFTaddresses[i]);
                    NFTobjs.push(l_dataoffering);
                }
                setDataOfferings(NFTobjs);
                setLoading(false); 
            } catch (error) {
                console.log(error);
            }
        }
            
        getDataOfferings();
        
    }, [dataOfferings.length]);

    return(
        <>
            {
                loading ? 
                <Container className="d-flex justify-content-center"><Spinner animation="grow" variant="warning" style={
                    {width: '5rem', 
                    height: '5rem', 
                    position: 'absolute', 
                    justifyContent: 'center',
                    flex: 1,
                    alignItems:'center',
                    marginTop:270,
                }}/></Container>
                :
                dataOfferings.length == 0 ? 
                <Container className="mt-3">
                    <Row><Alert variant="primary" className="text-center"> <strong>Nothing published yet!</strong></Alert></Row>
                </Container>
                    :
                <Container className="mt-3">
                <Row md={columnsPerRow}> 
                    {
                        dataOfferings.map((NFTdataobj, index) => (
                            <Col key={index}><DataOffering key={index} NFTdataobj={NFTdataobj} /></Col>  
                        ))
                    }
                </Row>
                </Container>
            }
        </>
        
    )
}

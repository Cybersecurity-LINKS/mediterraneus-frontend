import { useIdentity } from '@/hooks/useIdentity'
import { formatDid } from '@/utils';
import { Figure, Toast } from 'react-bootstrap'
import { Link } from 'react-router-dom';

export const IdentityToast = () => {

  const { did, didDoc, vc } = useIdentity()

  return (
    <>
      <Toast className='mt-3 ms-5'>
        <Toast.Header closeButton={false}>
          <Figure className='mt-2 ms-2 rounded me-2 bg-success '>
            <Figure.Image
              width={25}
              height={30}
              src="../shimmerlogo.svg"
              className="ms-3 me-3 mt-3 mb-3"
            />
          </Figure>
          <strong className="mb-auto me-auto mt-auto text-black" style={{ fontSize: 18 }}>Connector's Identity</strong>
        </Toast.Header>
        {
            did == undefined && didDoc == undefined ? 
            <Toast.Body className='ms-2'><strong className="text-black" style={{ fontSize: 16}}>
                <Link style={{color: 'red'}} to="/identity">Please create your Identity</Link>  </strong></Toast.Body>
            :
            <>
                <Toast.Body className='ms-2'><strong className="text-black" style={{ fontSize: 16}}>Decentralized IDentifier </strong>
                <Link target="_blank" to={`https://explorer.shimmer.network/testnet/identity-resolver/${did?.toString()}`}>{formatDid(did?.toString())}</Link>
                </Toast.Body>
                <Toast.Body className='ms-2'><strong className="text-black" style={{ fontSize: 16 }}><Link style={{color: 'black'}} to="/identity">DID Document</Link></strong></Toast.Body>
                {
                    vc == undefined ? 
                    <Toast.Body className='ms-2'><strong className="text-black" style={{ fontSize: 16}}>
                    <Link style={{color: 'red'}} to="/identity">Please request a new Verifiable Credential</Link>  </strong></Toast.Body>: 
                    <Toast.Body className='ms-2'><strong className="text-black" style={{ fontSize: 16 }}><Link to="/identity">Verifiable Credential</Link></strong> </Toast.Body>
                }
            </>
        }
        
      </Toast>
    </>
  );
}
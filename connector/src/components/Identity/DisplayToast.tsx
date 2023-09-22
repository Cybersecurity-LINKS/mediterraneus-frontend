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
          <Figure className='rounded mt-3'>
            <Figure.Image
              width={80}
              height={50}
              src="../fingerprint-seeklogo.com-3.svg"
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
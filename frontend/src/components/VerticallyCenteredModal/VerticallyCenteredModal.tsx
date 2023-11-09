import { Modal } from "react-bootstrap";

export function VerticallyCenteredModal(props: {show: boolean, onHide: () => void, title: string, body: string}) {
    return (
        <Modal size='xl' show={props.show} onHide={props.onHide} centered>
            <Modal.Header closeButton>
                <Modal.Title>
                    {props.title}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body style={{backgroundColor: "ThreeDLightShadow"}}>
                <pre className="ms-2 mt-2" style={{color: "white"}}>
                    {props.body}
                </pre>
            </Modal.Body>
            <Modal.Footer>
            </Modal.Footer>
        </Modal>
    );
}
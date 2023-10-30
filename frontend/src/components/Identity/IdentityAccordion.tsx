import { PropsWithChildren } from "react"
import { Accordion, Card } from "react-bootstrap"

interface IdentityContent {
    title: string
    content: string
}

export const IdentityAccordion = (props: PropsWithChildren<IdentityContent>) => {
    return(
        <>
        <Accordion defaultActiveKey="0">
            <Accordion.Item eventKey="0">
                <Accordion.Header>
                    {props.title}
                </Accordion.Header>
                <Accordion.Body>
                    <Card style={{width: '60rem', backgroundColor: "ThreeDLightShadow"}} className='mb-5 ms-auto me-auto'>
                        <pre className="ms-2 mt-2" style={{color: "white"}}>
                            {props.content}
                        </pre>
                    </Card>
                </Accordion.Body>
            </Accordion.Item>
        </Accordion>
        </>
    )
}
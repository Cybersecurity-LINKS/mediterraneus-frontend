import express from 'express';
import bodyParser from 'body-parser';
import router from './routers/router';
import morgan from 'morgan';

export class Server {
    private app;

    constructor() {
        this.app = express();
        this.config();
        this.routerConfig();
        // this.dbConnect();
    }

    private config() {
        this.app.use(morgan("dev"));
        this.app.use(bodyParser.urlencoded({ extended: false }));
        this.app.use(bodyParser.json({ limit: '1mb' })); // 100kb default
        this.app.use(express.json())
    }

    private routerConfig() {
        this.app.use('/', router);
    }

    public start = (port: number) => {
        return new Promise((resolve, reject) => {
            this.app.listen(port, () => {
                resolve(port);
            }).on('error', (err: Object) => reject(err));
        });
    }
}
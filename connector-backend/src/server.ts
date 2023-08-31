import express from 'express';
import bodyParser from 'body-parser';
import router from './routers/router.js';
import morgan from 'morgan';

class Server {
    private app;

    constructor() {
        this.app = express();
        this.config();
        this.routerConfig();
    }

    private config() {
        this.app.use(morgan("dev"));
        this.app.use(bodyParser.urlencoded({ extended: true }));
        this.app.use(bodyParser.json({ limit: '1mb' })); // 100kb default
        this.app.use(express.json())
        this.app.use((_, res, next) => {
            res.append('Access-Control-Allow-Origin', ['http://localhost']);
            res.append('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
            res.append('Access-Control-Allow-Headers', 'Content-Type');
            next();
        })
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

export { Server };
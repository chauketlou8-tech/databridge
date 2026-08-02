import Driver from "../Driver";
import type { Config } from "../../types/config";
import type { Query } from "../../types/query";
import { ConnectionError, DriverError } from "../../exceptions"

import { MongoClient, Db } from "mongodb";
import MongoQuery from "./MongoQuery";

export class MongoDriver extends Driver {
    private client: MongoClient | null;
    private db: Db | null;

    constructor(config: Config) {
        super(config);
        this.client = null;
        this.db = null;
    }

    // example url: mongodb+srv://username:Password@cluster_name.h6kymkq.mongodb.net/BD_name?retryWrites=true&w=majority

    public async connect(): Promise<void> {
        if (!this.config.url) {
            throw new DriverError("The connection URL is missing or empty", "D024");
        }

        try {
            this.client = new MongoClient(this.config.url);
            await this.client.connect();

            const match = this.config.url.match(/^mongodb(?:\+srv)?:\/\/[^/]+\/([^?]+)/);
            const dbName = match?.[1];

            this.db = this.client.db(dbName);
        }
        catch (error) {
            throw new ConnectionError(`Failed to connect to MongoDB: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    public async disconnect(): Promise<void> {
        await this.client?.close();
        console.log("disconnected...");
    }

    public async query(query: Query): Promise<any> {
        if (!this.db) {
            throw new ConnectionError("Not connected to database", "D015");
        }

        return await new MongoQuery(query, this.db).run();
    }
}
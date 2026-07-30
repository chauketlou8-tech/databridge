import type { Database } from "./Database";
import type { config } from "../types/config"

export interface DataBridge {
    connect(config: config): Promise<Database>
    //will put the rest later
}
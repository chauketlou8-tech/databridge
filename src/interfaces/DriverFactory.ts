import type { Driver } from "./Driver";

export interface DriverFactory {
    connect(): Promise<void>;
}
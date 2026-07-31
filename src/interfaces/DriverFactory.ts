import type { Driver } from "./Driver";

export interface DriverFactory {
    create(): DriverFactory;
    connect(): Promise<null>//: //Promise<Driver>;
}
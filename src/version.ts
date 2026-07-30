// This file contains the current version of DataBridge
import fs from 'fs';
import path from "path"

const version = fs.readFileSync(path.resolve(__dirname,"../DATABRIDGE_version"), "utf8").trim();
export default version;
import { NextRequest } from "next/server";
import { hashSecret } from "./demo-store";
import type { DemoStore, DemoKey } from "./contracts";
export function authenticateKey(req:NextRequest,store:DemoStore):DemoKey|undefined {const value=req.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];return value?store.keys.find(key=>!key.revokedAt&&key.hash===hashSecret(value)):undefined;}

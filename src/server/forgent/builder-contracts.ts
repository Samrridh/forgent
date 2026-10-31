import { z } from "zod";
export const BuilderInputSchema=z.object({name:z.string().trim().min(3).max(80),description:z.string().trim().min(10).max(500),endpointUrl:z.string().url().max(2048),priceMicros:z.number().int().min(0).max(1000000000)});

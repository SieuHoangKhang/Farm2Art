import * as functions from "firebase-functions";
import express, { Request, Response } from "express";
import cors from "cors";

const app = express();

// Enable CORS for all routes
app.use(cors({ origin: true }));

// Health check
app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "ok" });
});

// API endpoints
app.post("/api/orders/create", (req: Request, res: Response) => {
  // TODO: Implement create order
  res.json({ message: "Create order endpoint" });
});

// Export functions
export const api = functions.https.onRequest(app);

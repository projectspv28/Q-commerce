import axios from "axios";

const BASE_URL = "http://localhost:8000";

export type DemandPayload = {
  productId: string;
  zone: string;
  historicalOrders: number[];
  stockLevel: number;
};

export type PpiPayload = {
  packagingType: string;
  reuseScore: number;
  vendorRating: number;
  carbonScore: number;
};

export async function callDemandML(payload: DemandPayload) {
  const { data } = await axios.post(`${BASE_URL}/ml/demand`, payload, { timeout: 4000 });
  return data as {
    predictedVelocity: number;
    riskLevel: string;
    forecastRunout: number;
  };
}

export async function callPpiML(payload: PpiPayload) {
  const { data } = await axios.post(`${BASE_URL}/ml/ppi`, payload, { timeout: 4000 });
  return data as {
    ppiScore: number;
    ecoLevel: string;
    impactWeight: number;
  };
}

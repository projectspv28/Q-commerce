export type Milestone =
  | "order.accepted"
  | "preparing"
  | "packed"
  | "picked"
  | "delivered";

export type OrderContext = {
  orderId: string;
  userId: string;
  campusZone: string;
  vendorId: string;
  totalAmount: number;
  paymentMethod: "cod" | "online";
  address: {
    latitude: number;
    longitude: number;
    city?: string;
    pincode?: string;
  };
  items: {
    groceryId: string;
    name: string;
    unit: string;
    price: number;
    quantity: number;
    category?: string;
    image?: string;
  }[];
  ppiScore?: number;
};

export type BatchMetadata = {
  batchId: string;
  closesAt: Date;
  closesInMinutes: number;
  priority: number;
};

export type TrackingSnapshot = {
  orderId: string;
  timeline: {
    milestone: Milestone;
    at: Date;
    positionHint?: { latitude: number; longitude: number };
  }[];
};

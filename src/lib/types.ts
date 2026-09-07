export type RequestStatus =
  | "new"
  | "contacted"
  | "quote_sent"
  | "won"
  | "lost";

export type RequestUrgency = "low" | "normal" | "urgent";

export type Artisan = {
  id: string;
  businessName: string;
  trade: string;
  phone?: string | null;
  email?: string | null;
  serviceArea?: string | null;
  slug: string;
  logoUrl?: string | null;
};

export type CustomerRequest = {
  id: string;
  artisanId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  city: string;
  category: string;
  description: string;
  urgency: RequestUrgency;
  availability?: string | null;
  status: RequestStatus;
  createdAt: string;
  updatedAt: string;
  photoUrls?: string[];
};

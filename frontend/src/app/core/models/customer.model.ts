export interface Customer {
  id: number;
  fullName: string;
  email: string | null;
  phoneNo: string;
  address: string | null;
  birthdate: string | null;
  registeredBy: string;
  createdAt: string;
}

export interface CustomerPayload {
  fullName: string;
  phoneNo: string;
  email?: string | null;
  address?: string | null;
  birthdate?: string | null;
}

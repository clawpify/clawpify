export type ConsignorId = string;

export type ConsignorDto = {
  id: ConsignorId;
  org_id: string;
  display_name: string;
  email: string | null;
  phone_e164: string | null;
  notes: string | null;
  default_payout_method: string | null;
  created_at: string;
  updated_at: string;
};

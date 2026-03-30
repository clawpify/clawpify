-- Consignors, contracts, payouts, intake batches; consignment_listing links

CREATE TABLE IF NOT EXISTS consignors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  email TEXT,
  phone_e164 TEXT,
  notes TEXT,
  default_payout_method TEXT CHECK (
    default_payout_method IS NULL
    OR default_payout_method IN ('cash', 'e_transfer', 'cheque', 'store_credit')
  ),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_consignors_org ON consignors(org_id);

CREATE TABLE IF NOT EXISTS contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  consignor_id UUID NOT NULL REFERENCES consignors(id) ON DELETE RESTRICT,
  contract_type TEXT NOT NULL CHECK (contract_type IN ('pick_up', 'donate_on')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed', 'expired')),
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  consignor_split_bps INT NOT NULL DEFAULT 4000 CHECK (consignor_split_bps >= 0 AND consignor_split_bps <= 10000),
  store_split_bps INT NOT NULL DEFAULT 6000 CHECK (store_split_bps >= 0 AND store_split_bps <= 10000),
  donation_price_cutoff_cents BIGINT NOT NULL DEFAULT 5000 CHECK (donation_price_cutoff_cents >= 0),
  opt_out_under_threshold_donation BOOLEAN NOT NULL DEFAULT FALSE,
  terms_version TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT contracts_date_order CHECK (start_at < end_at),
  CONSTRAINT contracts_splits_sum CHECK (consignor_split_bps + store_split_bps = 10000)
);

CREATE INDEX IF NOT EXISTS idx_contracts_org ON contracts(org_id);
CREATE INDEX IF NOT EXISTS idx_contracts_consignor ON contracts(consignor_id);
CREATE INDEX IF NOT EXISTS idx_contracts_org_status ON contracts(org_id, status);

CREATE TABLE IF NOT EXISTS contract_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  amount_cents BIGINT NOT NULL CHECK (amount_cents > 0),
  method TEXT NOT NULL CHECK (method IN ('cash', 'e_transfer', 'cheque', 'store_credit')),
  payout_index SMALLINT NOT NULL CHECK (payout_index IN (1, 2)),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_contract_payout_index UNIQUE (contract_id, payout_index)
);

CREATE INDEX IF NOT EXISTS idx_contract_payouts_org ON contract_payouts(org_id);
CREATE INDEX IF NOT EXISTS idx_contract_payouts_contract ON contract_payouts(contract_id);

CREATE TABLE IF NOT EXISTS intake_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  consignor_id UUID REFERENCES consignors(id) ON DELETE SET NULL,
  box_count INT NOT NULL CHECK (box_count >= 0 AND box_count <= 20),
  notes TEXT,
  arrived_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_intake_batches_org ON intake_batches(org_id);

ALTER TABLE consignment_listings
  ADD COLUMN IF NOT EXISTS consignor_id UUID REFERENCES consignors(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS acceptance_status TEXT,
  ADD COLUMN IF NOT EXISTS decline_reason TEXT,
  ADD COLUMN IF NOT EXISTS post_contract_disposition TEXT;

-- App enforces acceptance_status / post_contract_disposition enums; DB allows NULL.

CREATE INDEX IF NOT EXISTS idx_consignment_listings_consignor
  ON consignment_listings(consignor_id) WHERE consignor_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_consignment_listings_contract
  ON consignment_listings(contract_id) WHERE contract_id IS NOT NULL;

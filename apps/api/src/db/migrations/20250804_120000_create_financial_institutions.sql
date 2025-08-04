-- Create Financial Institutions table
-- Migration: 20250804_120000_create_financial_institutions.sql

-- Financial Institutions table
CREATE TABLE financial_institutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  institution_type VARCHAR(50) NOT NULL CHECK (institution_type IN ('bank', 'credit_union', 'investment', 'insurance', 'fintech', 'other')),
  routing_number VARCHAR(20),
  swift_code VARCHAR(20),
  website VARCHAR(255),
  logo_url VARCHAR(500),
  country VARCHAR(3) NOT NULL DEFAULT 'USA',
  is_active BOOLEAN DEFAULT TRUE,
  default_interest_rates JSONB DEFAULT '{}'::jsonb,
  supported_account_types JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  synced_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_financial_institutions_name ON financial_institutions USING gin(to_tsvector('english', name));
CREATE INDEX idx_financial_institutions_type ON financial_institutions(institution_type);
CREATE INDEX idx_financial_institutions_country ON financial_institutions(country);
CREATE INDEX idx_financial_institutions_active ON financial_institutions(is_active);
CREATE INDEX idx_financial_institutions_routing ON financial_institutions(routing_number) WHERE routing_number IS NOT NULL;

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_financial_institutions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_financial_institutions_updated_at
  BEFORE UPDATE ON financial_institutions
  FOR EACH ROW
  EXECUTE FUNCTION update_financial_institutions_updated_at();

-- Update financial_accounts table to include institution_id reference
ALTER TABLE financial_accounts 
ADD COLUMN institution_id UUID REFERENCES financial_institutions(id) ON DELETE SET NULL,
ADD COLUMN tax_treatment VARCHAR(50) CHECK (tax_treatment IN ('taxable', 'traditional_ira', 'roth_ira', 'traditional_401k', 'roth_401k', 'hsa', 'sep_ira', 'simple_ira', 'other_tax_advantaged')),
ADD COLUMN account_number_encrypted TEXT,
ADD COLUMN routing_number VARCHAR(20),
ADD COLUMN tags JSONB DEFAULT '[]'::jsonb,
ADD COLUMN color VARCHAR(7),
ADD COLUMN linked_account_ids JSONB DEFAULT '[]'::jsonb;

-- Create indexes for new financial_accounts columns
CREATE INDEX idx_financial_accounts_institution ON financial_accounts(institution_id);
CREATE INDEX idx_financial_accounts_tax_treatment ON financial_accounts(tax_treatment);
CREATE INDEX idx_financial_accounts_tags ON financial_accounts USING gin(tags);
CREATE INDEX idx_financial_accounts_color ON financial_accounts(color) WHERE color IS NOT NULL;

-- Insert sample financial institutions (top US banks and credit unions)
INSERT INTO financial_institutions (name, institution_type, routing_number, website, country, default_interest_rates, supported_account_types) VALUES
-- Major Banks
('JPMorgan Chase Bank', 'bank', '021000021', 'https://www.chase.com', 'USA', 
 '{"checking": 0.0001, "savings": 0.0001, "investment": 0.07, "retirement": 0.07}', 
 '["checking", "savings", "investment", "retirement", "credit"]'),
('Bank of America', 'bank', '026009593', 'https://www.bankofamerica.com', 'USA',
 '{"checking": 0.0001, "savings": 0.0001, "investment": 0.07, "retirement": 0.07}',
 '["checking", "savings", "investment", "retirement", "credit"]'),
('Wells Fargo Bank', 'bank', '121000248', 'https://www.wellsfargo.com', 'USA',
 '{"checking": 0.0001, "savings": 0.0001, "investment": 0.07, "retirement": 0.07}',
 '["checking", "savings", "investment", "retirement", "credit"]'),
('Citibank', 'bank', '021000089', 'https://www.citibank.com', 'USA',
 '{"checking": 0.0001, "savings": 0.0001, "investment": 0.07, "retirement": 0.07}',
 '["checking", "savings", "investment", "retirement", "credit"]'),
('U.S. Bank', 'bank', '091000022', 'https://www.usbank.com', 'USA',
 '{"checking": 0.0001, "savings": 0.0001, "investment": 0.07, "retirement": 0.07}',
 '["checking", "savings", "investment", "retirement", "credit"]'),

-- Online Banks
('Ally Bank', 'bank', '124003116', 'https://www.ally.com', 'USA',
 '{"checking": 0.0025, "savings": 0.04, "investment": 0.07, "retirement": 0.07}',
 '["checking", "savings", "investment", "retirement"]'),
('Marcus by Goldman Sachs', 'bank', '124085244', 'https://www.marcus.com', 'USA',
 '{"savings": 0.045, "investment": 0.07, "retirement": 0.07}',
 '["savings", "investment", "retirement"]'),
('Capital One Bank', 'bank', '031176110', 'https://www.capitalone.com', 'USA',
 '{"checking": 0.002, "savings": 0.04, "investment": 0.07, "retirement": 0.07}',
 '["checking", "savings", "investment", "retirement", "credit"]'),

-- Credit Unions
('Navy Federal Credit Union', 'credit_union', '256074974', 'https://www.navyfederal.org', 'USA',
 '{"checking": 0.001, "savings": 0.005, "investment": 0.07, "retirement": 0.07}',
 '["checking", "savings", "investment", "retirement", "credit"]'),
('State Employees Credit Union', 'credit_union', '253177049', 'https://www.ncsecu.org', 'USA',
 '{"checking": 0.001, "savings": 0.005, "investment": 0.07, "retirement": 0.07}',
 '["checking", "savings", "investment", "retirement", "credit"]'),

-- Investment Firms
('Fidelity Investments', 'investment', NULL, 'https://www.fidelity.com', 'USA',
 '{"investment": 0.07, "retirement": 0.07, "checking": 0.001, "savings": 0.02}',
 '["investment", "retirement", "checking", "savings"]'),
('Charles Schwab', 'investment', '121202211', 'https://www.schwab.com', 'USA',
 '{"investment": 0.07, "retirement": 0.07, "checking": 0.001, "savings": 0.02}',
 '["investment", "retirement", "checking", "savings"]'),
('Vanguard', 'investment', NULL, 'https://www.vanguard.com', 'USA',
 '{"investment": 0.07, "retirement": 0.07, "savings": 0.02}',
 '["investment", "retirement", "savings"]'),
('TD Ameritrade', 'investment', NULL, 'https://www.tdameritrade.com', 'USA',
 '{"investment": 0.07, "retirement": 0.07, "checking": 0.001, "savings": 0.02}',
 '["investment", "retirement", "checking", "savings"]'),

-- Fintech
('Chime', 'fintech', '103100195', 'https://www.chime.com', 'USA',
 '{"checking": 0.001, "savings": 0.02}',
 '["checking", "savings"]'),
('SoFi', 'fintech', '121140399', 'https://www.sofi.com', 'USA',
 '{"checking": 0.0025, "savings": 0.025, "investment": 0.07, "retirement": 0.07}',
 '["checking", "savings", "investment", "retirement"]);

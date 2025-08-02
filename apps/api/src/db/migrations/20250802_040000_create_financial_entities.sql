-- Migration: Create Financial Entities Tables
-- Date: 2025-01-02
-- Description: Create core financial entities for Epic 3

-- Financial Accounts table
CREATE TABLE financial_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  account_type VARCHAR(50) NOT NULL CHECK (account_type IN ('checking', 'savings', 'investment', 'retirement', 'credit', 'loan', 'other')),
  institution VARCHAR(255),
  balance DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  interest_rate DECIMAL(5,4) DEFAULT 0.0000,
  is_active BOOLEAN DEFAULT TRUE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  synced_at TIMESTAMP DEFAULT NOW()
);

-- Financial Accounts indexes
CREATE INDEX idx_financial_accounts_user_id ON financial_accounts(user_id);
CREATE INDEX idx_financial_accounts_type ON financial_accounts(account_type);
CREATE INDEX idx_financial_accounts_active ON financial_accounts(is_active);
CREATE INDEX idx_financial_accounts_synced ON financial_accounts(synced_at);

-- Financial Goals table
CREATE TABLE financial_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  goal_type VARCHAR(50) NOT NULL CHECK (goal_type IN ('savings', 'retirement', 'debt_payoff', 'emergency_fund', 'investment', 'other')),
  target_amount DECIMAL(15,2) NOT NULL,
  current_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  target_date DATE,
  priority INTEGER DEFAULT 1 CHECK (priority >= 1 AND priority <= 5),
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  synced_at TIMESTAMP DEFAULT NOW()
);

-- Financial Goals indexes
CREATE INDEX idx_financial_goals_user_id ON financial_goals(user_id);
CREATE INDEX idx_financial_goals_type ON financial_goals(goal_type);
CREATE INDEX idx_financial_goals_active ON financial_goals(is_active);
CREATE INDEX idx_financial_goals_target_date ON financial_goals(target_date);
CREATE INDEX idx_financial_goals_synced ON financial_goals(synced_at);

-- Scenarios table for financial planning
CREATE TABLE scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  assumptions JSONB NOT NULL DEFAULT '{
    "inflation_rate": 0.03,
    "market_return": 0.07,
    "savings_rate": 0.20,
    "retirement_age": 65,
    "life_expectancy": 85
  }'::jsonb,
  projections JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT TRUE,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  synced_at TIMESTAMP DEFAULT NOW()
);

-- Scenarios indexes
CREATE INDEX idx_scenarios_user_id ON scenarios(user_id);
CREATE INDEX idx_scenarios_active ON scenarios(is_active);
CREATE INDEX idx_scenarios_default ON scenarios(is_default);
CREATE INDEX idx_scenarios_synced ON scenarios(synced_at);

-- Scenario Goals junction table (many-to-many relationship)
CREATE TABLE scenario_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id UUID NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
  goal_id UUID NOT NULL REFERENCES financial_goals(id) ON DELETE CASCADE,
  allocation_percentage DECIMAL(5,2) DEFAULT 100.00 CHECK (allocation_percentage >= 0 AND allocation_percentage <= 100),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(scenario_id, goal_id)
);

-- Scenario Goals indexes
CREATE INDEX idx_scenario_goals_scenario_id ON scenario_goals(scenario_id);
CREATE INDEX idx_scenario_goals_goal_id ON scenario_goals(goal_id);

-- Account Transactions table for tracking balance changes
CREATE TABLE account_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES financial_accounts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(15,2) NOT NULL,
  transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN ('deposit', 'withdrawal', 'transfer', 'interest', 'fee', 'adjustment')),
  description TEXT,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  synced_at TIMESTAMP DEFAULT NOW()
);

-- Account Transactions indexes
CREATE INDEX idx_account_transactions_account_id ON account_transactions(account_id);
CREATE INDEX idx_account_transactions_user_id ON account_transactions(user_id);
CREATE INDEX idx_account_transactions_date ON account_transactions(transaction_date);
CREATE INDEX idx_account_transactions_type ON account_transactions(transaction_type);
CREATE INDEX idx_account_transactions_synced ON account_transactions(synced_at);

-- Goal Progress table for tracking goal progress over time
CREATE TABLE goal_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL REFERENCES financial_goals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(15,2) NOT NULL,
  progress_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  synced_at TIMESTAMP DEFAULT NOW()
);

-- Goal Progress indexes
CREATE INDEX idx_goal_progress_goal_id ON goal_progress(goal_id);
CREATE INDEX idx_goal_progress_user_id ON goal_progress(user_id);
CREATE INDEX idx_goal_progress_date ON goal_progress(progress_date);
CREATE INDEX idx_goal_progress_synced ON goal_progress(synced_at);

-- Add triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_financial_accounts_updated_at BEFORE UPDATE ON financial_accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_financial_goals_updated_at BEFORE UPDATE ON financial_goals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_scenarios_updated_at BEFORE UPDATE ON scenarios FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_scenario_goals_updated_at BEFORE UPDATE ON scenario_goals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_account_transactions_updated_at BEFORE UPDATE ON account_transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_goal_progress_updated_at BEFORE UPDATE ON goal_progress FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE financial_accounts IS 'User financial accounts (checking, savings, investment, etc.)';
COMMENT ON TABLE financial_goals IS 'User financial goals and targets';
COMMENT ON TABLE scenarios IS 'Financial planning scenarios with different assumptions';
COMMENT ON TABLE scenario_goals IS 'Many-to-many relationship between scenarios and goals';
COMMENT ON TABLE account_transactions IS 'Transaction history for financial accounts';
COMMENT ON TABLE goal_progress IS 'Historical progress tracking for financial goals';

COMMENT ON COLUMN financial_accounts.balance IS 'Current account balance in the specified currency';
COMMENT ON COLUMN financial_accounts.interest_rate IS 'Annual interest rate as decimal (e.g., 0.0325 for 3.25%)';
COMMENT ON COLUMN financial_accounts.metadata IS 'Additional account-specific data (account number, routing, etc.)';

COMMENT ON COLUMN financial_goals.target_amount IS 'Target amount to achieve for this goal';
COMMENT ON COLUMN financial_goals.current_amount IS 'Current progress toward the goal';
COMMENT ON COLUMN financial_goals.priority IS 'Goal priority from 1 (highest) to 5 (lowest)';

COMMENT ON COLUMN scenarios.assumptions IS 'Financial assumptions (inflation, returns, etc.) as JSON';
COMMENT ON COLUMN scenarios.projections IS 'Calculated projections and results as JSON';
COMMENT ON COLUMN scenarios.is_default IS 'Whether this is the user default scenario';

COMMENT ON COLUMN scenario_goals.allocation_percentage IS 'Percentage of scenario allocated to this goal';

COMMENT ON COLUMN account_transactions.amount IS 'Transaction amount (positive for credits, negative for debits)';
COMMENT ON COLUMN account_transactions.transaction_date IS 'Date when the transaction occurred';

COMMENT ON COLUMN goal_progress.amount IS 'Goal amount at this point in time';
COMMENT ON COLUMN goal_progress.progress_date IS 'Date when this progress was recorded';

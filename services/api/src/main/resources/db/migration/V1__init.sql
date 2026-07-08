CREATE TABLE users (
    id UUID PRIMARY KEY,
    display_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT,
    timezone TEXT NOT NULL DEFAULT 'Asia/Ho_Chi_Minh',
    locale TEXT NOT NULL DEFAULT 'vi-VN',
    prefer_no_onion_garlic BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE TABLE auth_identities (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL,
    provider_subject TEXT NOT NULL,
    UNIQUE (provider, provider_subject)
);

CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ
);

CREATE TABLE fasting_profiles (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    preset TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE fasting_rules (
    id UUID PRIMARY KEY,
    profile_id UUID NOT NULL REFERENCES fasting_profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    lunar_day INT,
    weekday INT
);

CREATE TABLE reminder_preferences (
    id UUID PRIMARY KEY,
    profile_id UUID NOT NULL REFERENCES fasting_profiles(id) ON DELETE CASCADE,
    slot_key TEXT NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    offset_days INT NOT NULL,
    local_time TIME NOT NULL,
    UNIQUE (profile_id, slot_key)
);

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX idx_fasting_rules_profile ON fasting_rules(profile_id);

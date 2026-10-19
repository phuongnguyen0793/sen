CREATE TABLE recipes (
    id UUID PRIMARY KEY,
    title TEXT NOT NULL,
    title_en TEXT NOT NULL,
    summary TEXT NOT NULL,
    summary_en TEXT NOT NULL,
    ingredients TEXT NOT NULL,
    steps TEXT NOT NULL,
    cook_minutes INT NOT NULL,
    servings INT NOT NULL,
    tags TEXT NOT NULL,
    no_onion_garlic BOOLEAN NOT NULL DEFAULT FALSE,
    source TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE bookmarks (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, recipe_id)
);

CREATE TABLE ai_generations (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    prompt_meta TEXT NOT NULL,
    result_recipe_id UUID NULL REFERENCES recipes(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_generations_user_created ON ai_generations (user_id, created_at);
CREATE INDEX idx_recipes_source ON recipes (source);

INSERT INTO recipes (id, title, title_en, summary, summary_en, ingredients, steps, cook_minutes, servings, tags, no_onion_garlic, source) VALUES
(
    '11111111-1111-1111-1111-111111111111',
    'Đậu hũ sốt cà',
    'Tofu in tomato sauce',
    'Món chay nhanh, không hành tỏi.',
    'A quick fasting dish without onion or garlic.',
    '[{"vi":"Đậu hũ 300g","en":"300g tofu"},{"vi":"Cà chua 2 quả","en":"2 tomatoes"},{"vi":"Hành lá","en":"Scallion greens"}]',
    '[{"vi":"Cắt đậu hũ và áp chảo.","en":"Slice the tofu and pan-fry it."},{"vi":"Xào cà chua rồi đổ đậu hũ vào, rim 5 phút.","en":"Cook the tomatoes, add the tofu, and simmer for 5 minutes."}]',
    20, 2, 'easy,niem,no-onion', TRUE, 'curated'
),
(
    '22222222-2222-2222-2222-222222222222',
    'Canh bí đỏ',
    'Pumpkin soup',
    'Canh ngọt thanh cho ngày chay.',
    'A light soup for a fasting day.',
    '[{"vi":"Bí đỏ 400g","en":"400g pumpkin"},{"vi":"Nước 500ml","en":"500ml water"},{"vi":"Muối, tiêu","en":"Salt and pepper"}]',
    '[{"vi":"Nấu bí đến mềm rồi nêm.","en":"Simmer the pumpkin until soft, then season."}]',
    25, 3, 'easy,soup,no-onion', TRUE, 'curated'
),
(
    '33333333-3333-3333-3333-333333333333',
    'Nấm kho tiêu',
    'Braised mushrooms',
    'Nấm kho đậm, có hành.',
    'Braised mushrooms. Contains onion.',
    '[{"vi":"Nấm đùi gà 200g","en":"200g king oyster mushrooms"},{"vi":"Hành tím 1 củ","en":"1 shallot"}]',
    '[{"vi":"Phi hành, kho nấm với nước tương.","en":"Fry the shallot, then braise the mushrooms with soy sauce."}]',
    30, 2, 'niem', FALSE, 'curated'
);

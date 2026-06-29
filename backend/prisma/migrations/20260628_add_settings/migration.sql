CREATE TABLE "settings" (
  "key"       TEXT NOT NULL,
  "value"     TEXT NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "settings_pkey" PRIMARY KEY ("key")
);

INSERT INTO "settings" ("key", "value", "updatedAt") VALUES (
  'reactivation_template',
  'Oi [primeiro_nome]! Já faz [dias] dias que o seu [carro] não aparece aqui. Que tal dar um pulinho? 🦸',
  NOW()
) ON CONFLICT DO NOTHING;

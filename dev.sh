#!/bin/bash
echo "🦸 Iniciando Superman Lava-Jato CRM em modo desenvolvimento..."

if [ "$1" = "seed" ]; then
  echo "🌱 Populando banco de dados..."
  docker-compose -f docker-compose.dev.yml exec backend npm run db:seed
else
  docker-compose -f docker-compose.dev.yml up --build "$@"
fi

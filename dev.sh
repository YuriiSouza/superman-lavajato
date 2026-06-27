#!/bin/bash
echo "🦸 Iniciando Superman Lava-Jato CRM em modo desenvolvimento..."
docker-compose -f docker-compose.dev.yml up --build "$@"

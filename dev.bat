@echo off
setlocal

set CMD=%1

if "%CMD%"=="init" (
  echo Copiando arquivos de ambiente...
  if not exist backend\.env copy backend\.env.exemplo backend\.env >nul
  if not exist frontend\.env (
    echo NEXT_PUBLIC_API_URL=http://localhost:3001 > frontend\.env
    echo API_INTERNAL_URL=http://backend:3001 >> frontend\.env
    echo NEXTAUTH_SECRET=change_me_nextauth >> frontend\.env
    echo NEXTAUTH_URL=http://localhost:3000 >> frontend\.env
  )
  if not exist .env copy .env.exemplo .env >nul
  echo Ambiente pronto. Rode dev.bat para iniciar.
  goto :eof
)

if "%CMD%"=="down" (
  docker compose -f docker-compose.dev.yml down
  goto :eof
)

if "%CMD%"=="logs" (
  docker compose -f docker-compose.dev.yml logs -f %2
  goto :eof
)

if "%CMD%"=="migrate" (
  docker compose -f docker-compose.dev.yml exec backend npx prisma migrate dev
  goto :eof
)

if "%CMD%"=="seed" (
  docker compose -f docker-compose.dev.yml exec backend npx ts-node prisma/seed.ts
  goto :eof
)

echo Iniciando Superman Lava-Jato CRM em modo desenvolvimento...
docker compose -f docker-compose.dev.yml up --build

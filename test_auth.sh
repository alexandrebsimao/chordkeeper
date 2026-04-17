#!/bin/bash

# Script para testar autenticação da API

echo "🧪 Testando Autenticação da API ChordKeeper"
echo ""

# Configurações
API_URL="http://localhost:3000"
EMAIL="user@example.com"
PASSWORD="password123"

echo "📍 API URL: $API_URL"
echo "👤 Email: $EMAIL"
echo ""

# Testar Login
echo "1️⃣ Testando Login..."
LOGIN_RESPONSE=$(curl -s -i -X POST "$API_URL/users/sign_in" \
  -H "Content-Type: application/json" \
  -d "{\"user\":{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}}")

# Extrair token do header
TOKEN=$(echo "$LOGIN_RESPONSE" | grep -i "^authorization:" | cut -d' ' -f2- | tr -d '\r')

if [ -z "$TOKEN" ]; then
  echo "❌ Login falhou - Token não encontrado"
  echo ""
  echo "Response:"
  echo "$LOGIN_RESPONSE"
  exit 1
fi

echo "✅ Login bem sucedido!"
echo "🔑 Token: ${TOKEN:0:50}..."
echo ""

# Testar busca de músicas
echo "2️⃣ Testando busca de músicas..."
SONGS_RESPONSE=$(curl -s -i -X GET "$API_URL/api/songs" \
  -H "Authorization: $TOKEN" \
  -H "Content-Type: application/json")

STATUS=$(echo "$SONGS_RESPONSE" | grep "^HTTP" | cut -d' ' -f2)

if [ "$STATUS" == "200" ]; then
  echo "✅ Busca de músicas bem sucedida! (Status: $STATUS)"
  echo ""
  echo "Primeiras linhas da resposta:"
  echo "$SONGS_RESPONSE" | tail -n +20 | head -n 10
else
  echo "❌ Busca de músicas falhou! (Status: $STATUS)"
  echo ""
  echo "Response:"
  echo "$SONGS_RESPONSE"
fi

echo ""
echo "3️⃣ Testando busca de bibliotecas..."
LIBS_RESPONSE=$(curl -s -i -X GET "$API_URL/api/libraries" \
  -H "Authorization: $TOKEN" \
  -H "Content-Type: application/json")

STATUS=$(echo "$LIBS_RESPONSE" | grep "^HTTP" | cut -d' ' -f2)

if [ "$STATUS" == "200" ]; then
  echo "✅ Busca de bibliotecas bem sucedida! (Status: $STATUS)"
else
  echo "❌ Busca de bibliotecas falhou! (Status: $STATUS)"
  echo "$LIBS_RESPONSE"
fi

echo ""
echo "✅ Testes concluídos!"

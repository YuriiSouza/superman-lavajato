# Superman Lava a Jato 🦸‍♂️

Website moderno e responsivo para o **Superman Lava a Jato**, construído com **Next.js**, **TypeScript** e **Tailwind CSS**. Tema automotivo escuro com destaque na cor **verde Kawasaki** (`#6BBF23`).

## ✨ Funcionalidades

- **2 páginas**: Home (landing page) e Serviços/Agendamento (preços).
- **Hero impactante** com imagem de fundo e CTAs.
- **Seção de serviços, sobre, depoimentos (4,9★) e localização** com mapa do Google.
- **Tabela de preços** com 4 pacotes + serviços opcionais.
- **Formulário de agendamento** que gera uma mensagem pronta no WhatsApp.
- **Botão flutuante de WhatsApp** (canto inferior direito, com animação de pulso) em todas as páginas.
- **Header fixo (sticky)** com menu responsivo (hambúrguer no mobile).
- **Acessibilidade**: foco visível por teclado, skip-link, contraste adequado, `prefers-reduced-motion`.
- **SEO**: metadados, Open Graph e páginas estáticas (SSG).

## 🚀 Como rodar

```bash
npm install
npm run dev      # desenvolvimento → http://localhost:3000
npm run build    # build de produção
npm start        # servir build de produção
```

## ⚙️ Personalização

Quase tudo está centralizado — não é preciso caçar pelo código:

| O que mudar | Onde |
|---|---|
| **Número do WhatsApp** e mensagem padrão | `src/lib/site.ts` → `WHATSAPP_NUMBER` |
| Endereço, telefone, e-mail, horários, redes sociais | `src/lib/site.ts` → `SITE` |
| Mapa do Google (embed + "Como chegar") | `src/lib/site.ts` → `mapsEmbed` / `mapsDirections` |
| Pacotes, preços e opcionais | `src/lib/services.ts` |
| Cor de destaque (tons do verde) | `src/app/globals.css` → bloco `@theme` (`--color-kawasaki-*`) |
| Imagens (hero / sobre) | URLs do Unsplash em `Hero.tsx` e `About.tsx` |

> ⚠️ **Importante:** o número de WhatsApp atual (`5511999999999`) é um **placeholder**. Troque pelo número real em `src/lib/site.ts` antes de publicar.

## 🗂️ Estrutura

```
src/
├── app/
│   ├── layout.tsx          # Header, Footer, botão WhatsApp, SEO
│   ├── page.tsx            # Home
│   ├── servicos/page.tsx   # Serviços, preços e agendamento
│   └── globals.css         # Tema (verde Kawasaki) e tokens
├── components/             # Hero, Header, Footer, BookingForm, etc.
└── lib/
    ├── site.ts             # Configuração do negócio + WhatsApp
    └── services.ts         # Pacotes e opcionais
```

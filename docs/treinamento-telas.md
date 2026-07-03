# Treinamento — Superman CRM (Lava-Jato)
### Roteiro de slides, tela por tela

> Material de apoio para apresentação de treinamento. Cada bloco abaixo corresponde a **um slide** (ou grupo de slides). A ordem segue o menu lateral do sistema.

---

## SLIDE 0 — Visão geral do sistema

**O que é:** um sistema de gestão completo para lava-jato, dividido em duas partes:

1. **Site público** (landing page + agendamento online) — o que o cliente final vê.
2. **CRM / Painel administrativo** (`/admin`) — onde a equipe opera o negócio.

**Perfis de acesso (roles):** o que cada pessoa enxerga muda conforme o perfil.

| Perfil | Enxerga | Tela inicial após login |
|--------|---------|--------------------------|
| **Administrador (ADMIN)** | Tudo | Dashboard |
| **Caixa (CAIXA)** | Clientes, Ordens, Agenda, Caixa do dia, Usuários, Configurações | Caixa do dia |
| **Operador (OPERADOR)** | Clientes, Ordens, Agenda, Configurações | Ordens de serviço |

**Menu lateral** — organizado em 4 grupos:
- **Principal:** Dashboard, Clientes, Ordens de serviço, Agenda
- **Retenção:** Reativação, Segmentação
- **Financeiro:** Caixa do dia, Resultado (DRE), Contas a pagar, Estoque
- **Sistema:** Serviços, Usuários, Configurações

**Rodapé do menu:** nome do usuário logado + perfil, botão de **modo claro/escuro** e botão **Sair**. O menu pode ser **recolhido** (ícone de seta) para ganhar espaço na tela.

---

## SLIDE 1 — Login

**Rota:** `/login`

**Para que serve:** porta de entrada do painel. Acesso restrito à equipe.

**Elementos:**
- Campo **Email**
- Campo **Senha**
- Botão **Entrar**
- Mensagem de erro em vermelho se email/senha estiverem incorretos.

**Comportamento inteligente:** após logar, o sistema **leva cada perfil para sua tela mais útil** — admin vai para o Dashboard, caixa para o Caixa do dia, operador para as Ordens.

---

# GRUPO: PRINCIPAL

---

## SLIDE 2 — Dashboard (só Administrador)

**Rota:** `/admin/dashboard`

**Para que serve:** visão executiva do negócio. É o "raio-x" do lava-jato em uma tela. **Atualiza sozinho a cada 30 segundos.**

### Barra de filtros (topo)
Muda **todos** os números e gráficos da tela de uma vez:
- **Períodos:** Hoje · 7 dias · 30 dias · Mês · Ano · **Período** (datas personalizadas)
- **Filtro por serviço:** mostra os dados só de um serviço específico
- **Exportar CSV:** baixa o faturamento do período em planilha
- **Nova OS / Ver OS:** atalhos para criar e acompanhar ordens

> Os filtros ficam **salvos** — ao voltar, o sistema lembra o que você tinha selecionado.

### Alerta de estoque crítico (faixa vermelha)
Aparece automaticamente quando algum produto tem **menos de 7 dias** de estoque restante. Clicável — leva direto ao Estoque.

### 4 cartões principais (KPIs)
1. **Faturamento** no período + nº de OS pagas
2. **Ticket médio** (valor médio por atendimento)
3. **Pendentes agora** (OS aguardando) — clicável, leva às Ordens
4. **Clientes sumidos** (que não voltam) de um total de X

### Gráficos
- **Tendência de faturamento** (linha) — com botão **"Comparar serviços"** que separa a linha por serviço. Passe o mouse para ver o valor de cada dia.
- **Serviços mais procurados** (rosca/donut) — clique numa fatia para filtrar as ordens daquele serviço.
- **Horários de pico** (mapa de calor / heatmap) — mostra dia da semana × hora com mais movimento (últimos 90 dias). Ajuda a planejar equipe.

### Resumo financeiro (3 cartões)
- **Lucro líquido real** do período (com margem % e CMV)
- **Reservas ativas** (dinheiro separado para contas) — leva ao Caixa
- **Vence nos próximos 5 dias** (contas a pagar) — leva a Contas

### Blocos inferiores
- **Ordens de hoje** — últimas ordens com status e valor
- **Reativação urgente** — clientes sumidos com botão de WhatsApp direto
- **Formas de pagamento hoje**
- **Histórico de caixas** — tabela por dia: receita, espécie, digital, sangrias, diferença e status (Aberto/Fechado). O dia de **hoje** é clicável e leva ao Caixa.

---

## SLIDE 3 — Clientes

**Rota:** `/admin/clientes` · **Acesso:** todos os perfis

**Para que serve:** cadastro central de clientes e seus veículos.

**Elementos:**
- **Busca** por nome, telefone **ou placa** (busca em tempo real)
- Botão **Novo cliente**
- **Nova OS / Ver OS** (atalho no canto)
- **Lista de clientes**, cada linha com:
  - Avatar com iniciais (cor automática)
  - Nome + **selo de segmento**: `Novo` (0 atendimentos), `Regular`, ou `VIP` (4+ atendimentos)
  - Telefone · nº de atendimentos · nº de veículos
  - Ícone de **WhatsApp** para conversar direto

**Cadastrar cliente (modal):** Nome*, Telefone (WhatsApp)*, Observações.

**Detalhe do cliente (clicar na linha):**
- Dados + link de WhatsApp + botão **Editar dados**
- **Veículos:** lista com placa, modelo, cor, tipo — pode **adicionar** e **remover** veículo
- **Últimos atendimentos:** histórico com serviço, data e valor

---

## SLIDE 4 — Ordens de serviço (OS)

**Rota:** `/admin/ordens` · **Acesso:** todos os perfis

**Para que serve:** o coração operacional — cria e acompanha cada serviço prestado.

**Filtros:**
- Abas de status: Todas · Aguardando · Em andamento · Concluídas · Pagas · Canceladas
- Seletor de **data** (com atalho "hoje")
- Filtros ficam salvos entre visitas

**Lista (desktop = tabela / celular = cartões):** Veículo · Cliente · Serviço · Pagamento · Valor · Status.
- Quando a OS **não tem veículo** (ex.: lavagem de tapete), mostra a **descrição do item** no lugar da placa.
- O **status é editável direto na lista** (dropdown). Ao mudar para **Pago**, abre o modal de recebimento.

### Criar Nova OS (novo fluxo em 3 passos)
1. **Passo 1 — Serviço:** escolhe o serviço, **agrupado por categoria**. Categorias marcadas "sem veículo" não pedem carro.
2. **Passo 2 — depende da categoria:**
   - Se **requer veículo:** busca/cadastra o cliente e seleciona/cadastra o veículo.
   - Se **não requer veículo:** só descreve o item (ex.: "Moto Honda CG", "Tapete 3m²").
3. **Passo 3 — Detalhes:** data e hora, valor total (já vem preenchido com o preço do serviço), observações → **Criar OS**.

> Botão **Voltar** entre os passos. Isso permite atender coisas além de carros.

---

## SLIDE 5 — Agenda

**Rota:** `/admin/agenda` · **Acesso:** todos os perfis

**Para que serve:** gerenciar os **agendamentos online** feitos pelos clientes no site.

**Elementos:**
- **Navegação por dia** (setas ‹ ›) com destaque para "Hoje"
- **Pílulas de resumo:** total de agendamentos, pendentes, confirmados
- **Cartões de agendamento**, cada um com:
  - Horário início/fim
  - Cliente, veículo, serviço, duração
  - Telefone clicável (WhatsApp)
  - Status colorido: Pendente / Confirmado / Concluído / Cancelado
  - Observações do cliente

**Ações por agendamento:**
- **Avançar status:** Pendente → Confirmado → Concluído
- **Cancelar**

---

# GRUPO: RETENÇÃO

---

## SLIDE 6 — Reativação (só Administrador)

**Rota:** `/admin/reativacao`

**Para que serve:** trazer de volta clientes que **sumiram**. O sistema monta a fila e a mensagem prontas.

**Duas abas:**
- **Fila:** clientes sem visita há mais de X dias
- **Histórico:** todas as mensagens já enviadas

**Fila — filtros:**
- Janela de tempo: **15d / 30d / 45d** sem visita
- Contato: Todos / Não contatados / Já contatados

**Cada cliente na fila mostra:**
- Nome + badge "X dias sem visita" (vermelho se > 60 dias)
- Telefone e veículo
- **Mensagem de WhatsApp já montada** (personalizada com nome, carro, dias)
- Botão **Enviar** — abre o WhatsApp e **registra automaticamente** o contato
- Se já contatado: badge verde "Contatado há Xd" e botão vira **Reenviar**

> A mensagem é configurável em **Configurações** (template com campos como `[primeiro_nome]`, `[carro]`, `[dias]`).

---

## SLIDE 7 — Segmentação (só Administrador)

**Rota:** `/admin/segmentos`

**Para que serve:** enxergar a base de clientes dividida em grupos estratégicos + **gerenciar categorias de serviço**.

**Categorias de serviço (topo):**
- Criar, editar e remover **categorias** (ex.: Carro, Moto, Tapetes)
- Marcar se a categoria **requer veículo** — é o que muda o fluxo de criação de OS

**4 segmentos de clientes (cartões expansíveis):**
- **VIP** — melhores clientes
- **Regular** — recorrentes
- **Churn** — em risco de sumir (com atalho "Reativar")
- **Premium** — ticket alto

Ao clicar num segmento, abre a lista de clientes daquele grupo, cada um com WhatsApp direto.

---

# GRUPO: FINANCEIRO

---

## SLIDE 8 — Caixa do dia (Administrador e Caixa)

**Rota:** `/admin/financeiro` · É a tela do dia a dia do operador de caixa.

**Para que serve:** controlar todo o dinheiro que entra e sai no dia — espécie e digital.

### Estados do caixa
- **Não aberto:** tela pede para **Abrir caixa**.
- **Aberto:** operação normal.
- **Fechado:** somente leitura, com opção de **Reabrir**.

### Abrir caixa
- **Dinheiro na gaveta (espécie)**
- **Saldo digital (banco/Pix)**
- Ambos **já vêm pré-preenchidos** com o saldo do dia anterior (o dinheiro não some de um dia pro outro) — é só ajustar.

### 6 cartões (cada um com legenda explicando o cálculo)
1. **Receita total** — nº de OS + Dinheiro + Digital
2. **Espécie na gaveta** — Abertura + recebido − sangrias
3. **Digital (Pix + Cartão)** — Inicial + recebido − saídas
4. **Sangrias** — total de saídas (espécie + digital)
5. **Lucro líquido** — Receita − sangrias
6. **Ticket médio** — Receita ÷ nº de OS

### Ações (caixa aberto)
- **Nova OS / Ver OS**
- **Sangria** (ver slide 9)
- **Fechar caixa**

### Blocos de detalhe
- **OS por tipo de veículo** (gráfico)
- **Formas de pagamento** (barras com %)
- **Transações do dia** (cada OS paga, com horário e formas)
- **Sangrias/Saídas** (cada saída, marcada como Espécie ou Digital)

### Fechar caixa
- Mostra o **esperado na gaveta** e o **saldo digital estimado**
- Você digita **quanto contou** fisicamente → o sistema mostra na hora se **bateu, faltou ou sobrou**.

> Se um caixa de dia anterior ficou **sem fechar**, aparece um aviso pedindo para fechá-lo.

---

## SLIDE 9 — Sangria (4 tipos de saída)

**Onde:** botão **Sangria** dentro do Caixa do dia.

Ao abrir, você escolhe **como** registrar a saída:

1. **Pagar conta** — quita uma conta cadastrada em *Contas a pagar* (marca como PAGO).
2. **Reservar para conta** — separa dinheiro para pagar uma conta depois (não paga ainda).
3. **Compra de produto** — registra a compra **e dá entrada no estoque**; calcula o custo unitário automaticamente.
4. **Gasto avulso** — despesa solta (vale, gorjeta etc.).

**Comum a todos:** escolher a **origem do valor** — **Espécie (gaveta)** ou **Digital (banco)**. Isso garante que cada saída seja descontada do lugar certo.

---

## SLIDE 10 — Resultado / DRE (só Administrador)

**Rota:** `/admin/resultado`

**Para que serve:** demonstrativo de resultado (lucro real) ao longo dos meses.

**Filtro:** 3 / 6 / 12 meses.

**4 cartões de totais:** Receita total · Despesas + CMV · CMV (produtos) · **Lucro líquido** (com margem %).

**Gráfico de barras:** por mês, compara Receita × Despesas × Lucro líquido. Passe o mouse para ver o detalhamento (Receita, Opex, Contas, CMV, Lucro).

**Tabela mensal detalhada:** Mês · Receita · Sangrias · Contas pagas · CMV · Total despesas · Lucro líquido · Margem.

**Conceitos-chave:**
- **Receita** = OS pagas no período
- **Sangrias** = saídas do caixa
- **Contas** = contas marcadas como pagas
- **CMV** = custo dos produtos/insumos consumidos (calculado pela contagem de estoque)

---

## SLIDE 11 — Contas a pagar (só Administrador)

**Rota:** `/admin/contas`

**Para que serve:** organizar todas as contas do negócio.

**3 cartões de resumo:** Pendente · Vencido · Pago (no mês).

**Filtros:** Todas · Pendentes · Vencidas · Pagas.

**Cada conta mostra:** nome, categoria, vencimento, valor e status (Pendente/Pago/Vencido). Marcação de **recorrente** (mensal).

**Ações por conta:**
- **Reservar** — separar dinheiro aos poucos (mostra barra de progresso "X% reservado, falta Y")
- **Pagar** — marca como paga
- **Remover**

**Nova conta:** descrição, categoria, valor, vencimento, observação e opção **recorrente**.

> As contas cadastradas aqui aparecem na Sangria (Pagar conta / Reservar) e no Dashboard (vencimentos próximos).

---

## SLIDE 12 — Estoque (só Administrador)

**Rota:** `/admin/estoque`

**Para que serve:** controlar insumos e calcular o custo real (CMV) por **contagem periódica**.

**Como funciona a lógica:** em vez de medir "quantos ml usei por carro" (irreal), o operador **conta o estoque** de tempos em tempos. O sistema calcula o consumo: *estoque inicial + compras − estoque final*.

**Ações:**
- **Registrar contagem** — lista todos os produtos com os valores **já pré-preenchidos**; você altera só o que mudou e salva.
- **Novo produto** — nome, unidade, quantidade mínima, custo unitário.

**Alertas:** faixa amarela lista produtos **abaixo do mínimo**.

**Cada produto mostra:**
- Quantidade atual + unidade + mínimo + custo
- Há quanto tempo foi a **última contagem** (fica âmbar se > 2 dias)
- **Previsão de esgotamento** ("Xd" ou "Esgotado") — vermelho se ≤ 7 dias
- Ao expandir: histórico de compras, consumo médio/dia e data estimada de esgotamento

> As compras entram no estoque pela Sangria → "Compra de produto".

---

# GRUPO: SISTEMA

---

## SLIDE 13 — Serviços (só Administrador)

**Rota:** `/admin/servicos`

**Para que serve:** catálogo de serviços oferecidos, agora **organizados por categoria**.

**Categorias de serviço (seção no topo, expansível):**
- Criar / editar / remover categorias
- Definir se a categoria **requer veículo** (carro, moto) ou não (tapete, sofá)

**Lista de serviços — agrupada por categoria.** Cada serviço mostra: nome, duração, descrição, preço, selo de **Destaque** e status **Inativo**.

**Ações por serviço:** ativar/desativar, editar, remover. Botão **Ver inativos**.

**Criar/editar serviço:**
- **Categoria*** (obrigatória)
- Nome, descrição curta, preço, duração
- Itens inclusos (um por linha)
- Marcar como **"Mais escolhido"** (destaque na landing page)

---

## SLIDE 14 — Usuários (Administrador e Caixa)

**Rota:** `/admin/usuarios`

**Para que serve:** gerenciar quem acessa o sistema e com qual permissão.

**Cartões de permissões:** mostram o que cada perfil (ADMIN / CAIXA / OPERADOR) pode acessar.

**Lista de usuários:** nome, email, perfil (com selo colorido), marcação "(você)".

**Ações:** criar, editar, remover (não é possível remover a si mesmo).

**Criar/editar usuário:** nome, email, senha (mín. 6), perfil de acesso.
> Um **Caixa** não pode criar Administradores — só o Admin cria outros Admins.

---

## SLIDE 15 — Configurações (todos os perfis)

**Rota:** `/admin/configuracoes`

**Para que serve:** conta pessoal + dados da empresa + mensagem de reativação.

**Coluna esquerda — Conta:**
- Avatar, nome e email
- **Alterar senha** (atual, nova, confirmar)
- **Encerrar sessão**

**Coluna direita — Empresa** (aparece na landing page):
- Identidade: nome, slogan, descrição (SEO)
- Contato: WhatsApp, telefone, email, endereço
- Redes sociais: Instagram, Facebook
- Localização: link do Google Maps e "Como chegar"
- Horário de funcionamento

**Mensagem de reativação (WhatsApp):**
- Template editável com **campos clicáveis** (`[primeiro_nome]`, `[nome]`, `[carro]`, `[placa]`, `[dias]`)
- **Pré-visualização** em tempo real
- Botão restaurar padrão

---

# GRUPO: SITE PÚBLICO (o que o cliente vê)

---

## SLIDE 16 — Landing page

**Rota:** `/`

**Para que serve:** apresentar o lava-jato para novos clientes. Seções: **Hero** (destaque), **Prévia de serviços**, **Sobre**, **Depoimentos** e **Localização**. Os dados vêm das Configurações.

---

## SLIDE 17 — Agendamento online

**Rota:** `/agendar`

**Para que serve:** o cliente marca horário sozinho, em 3 passos:
1. **Serviço** — escolhe o serviço desejado
2. **Data e hora** — datas disponíveis (exceto domingo) e horários livres
3. **Seus dados** — nome, telefone, veículo, observação → confirma

O agendamento cai automaticamente na **Agenda** do painel (slide 5).

---

## SLIDE 18 — Encerramento

**Fluxo do dia a dia (resumo para a equipe):**
1. Abrir o **Caixa do dia** (conferir espécie e digital)
2. Criar **OS** conforme os clientes chegam
3. Receber pagamento (status → **Pago**)
4. Registrar **Sangrias** (contas, compras, gastos)
5. **Contar estoque** periodicamente
6. **Fechar o caixa** e conferir a diferença

**Para o gestor (Admin):** Dashboard, Resultado (DRE), Contas a pagar, Reativação e Segmentação dão a visão estratégica.

**Dica final:** o botão de **WhatsApp** está presente em quase todas as telas — use para agilizar o contato com o cliente.

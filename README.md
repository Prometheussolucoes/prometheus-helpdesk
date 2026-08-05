# PROMETHEUS — Central de Helpdesk & Gestão de Incidentes

[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Online-brightgreen?logo=github)](https://seu-usuario.github.io/nome-do-repositorio/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Stack](https://img.shields.io/badge/Stack-HTML5%20%7C%20JS%20(ES6+)%20%7C%20SQLiteMini-orange)](#-tecnologias-utilizadas)

Uma solução leve, completa e sem dependências externas de servidor para centralização, acompanhamento e análise de chamados de TI. Projetada para substituir formulários genéricos, garantindo padronização nos registros, governança em gestão de serviços e geração automática de indicadores (KPIs).

---

## Contexto & Motivação

Com a necessidade de organizar os fluxos de atendimento do time de TI e sem *budget* imediato para a contratação de plataformas proprietárias de Service Desk, o sistema **PROMETHEUS** foi desenvolvido sob medida para prover:

- **Visibilidade Operacional:** Acompanhamento em tempo real da fila de trabalho e envelhecimento dos chamados (*aging*).
- **Rastreabilidade de Dados:** Padronização dos registros e associação com patrimônios e polos de atendimento.
- **Métricas de Performance:** Cálculo automático do **MTTR** (*Mean Time to Resolve*) e rankings dos equipamentos/locais com maior demanda de manutenção.

---

## Principais Funcionalidades

- **Geração Única de Incidentes:** Padrão `INC-YYYYMMDD-XXXX` gerado automaticamente no ato da abertura.
- **Polos Pré-cadastrados:** Suporte nativo aos endereços das unidades (Ponta Negra, Inoã, Itaipuaçu, Centro e IDS - Bairro Flamengo).
- **Fluxo de Abertura & Conclusão:** Validação estrita de campos obrigatórios no registro e na baixa do chamado (solução aplicada, novos patrimônios em casos de troca e diagnósticos).
- **Tratamento para Demandas Internas:** Suporte ao patrimônio especial (`20261000`) para catalogação de manutenções preventivas e ações da equipe.
- **Dashboard de Indicadores (KPIs):**
  - Média de Tempo de Atendimento (MTTR).
  - Rankings dos Solicitantes mais frequentes, Patrimônios críticos e Polos mais demandantes.
  - Distribuição da fila por tempo de espera.
- **Importação & Exportação Flexível:**
  - **Importador Inteligente (CSV):** Depara interativo de colunas para migração de histórico com identificação automática de duplicidades.
  - **Exportador CSV Corporativo:** Formatação em UTF-8 com BOM (compatível com Excel/Power BI sem erros de acentuação).
  - **Gerador & Leitor SQLite:** Leitura e gravação de banco de dados `.sqlite` / `.db` diretamente no navegador, além de suporte a exportação em `.sql` e backup em `.json`.
- **Alertas de Pendência:** Notificações visuais e sonoras periódicas a cada 60 minutos para chamados abertos.

---

## Tecnologias Utilizadas

- **Front-end:** HTML5 semântico, CSS3 (com arquitetura de Design System baseada no conceito *Forge/Dark Mode*), JavaScript Puro (ES6+).
- **Banco de Dados Local & Portabilidade:**
  - `LocalStorage` / `Storage API` para persistência em sessão e navegador.
  - **SQLiteMini Engine:** Módulo próprio em JS para leitura, parsing e escrita nativa de arquivos `.sqlite` sem bibliotecas externas pesadas.
- **Hospedagem:** GitHub Pages (100% Client-side, rodando sem necessidade de Node.js ou backend estático).

---

## Como Executar ou Hospedar

### Opção 1: Execução Local
1. Faça o clone do repositório ou baixe o arquivo `index.html`.
2. Abra o arquivo `index.html` em qualquer navegador moderno (Chrome, Edge, Firefox, Safari).

### Opção 2: Publicação no GitHub Pages
1. Suba o código do projeto para o seu repositório no GitHub.
2. Certifique-se de que o arquivo principal está nomeado como **`index.html`** na raiz do projeto.
3. No GitHub, acesse **Settings** (Configurações do repositório) > **Pages** (no menu lateral esquerdo).
4. Em **Build and deployment** > **Source**, selecione `Deploy from a branch`.
5. Escolha a branch `main` (ou `master`) e a pasta `/ (root)`. Clique em **Save**.
6. Em alguns minutos, sua URL pública estará disponível no formato:
   `https://seu-usuario.github.io/nome-do-repositorio/`

---

## Estrutura de Dados (Schema SQLite)

Quando exportado ou conectado a um banco SQLite, a tabela segue a seguinte estrutura:

```sql
CREATE TABLE chamados (
  id TEXT PRIMARY KEY,
  solicitante TEXT NOT NULL,
  local TEXT NOT NULL,
  patrimonio TEXT NOT NULL,
  patrimonio_novo TEXT,
  tipo TEXT,
  abertura TEXT NOT NULL,
  conclusao TEXT,
  tempo_minutos INTEGER,
  defeito TEXT,
  solucao TEXT,
  anotacoes TEXT,
  status TEXT NOT NULL,
  origem TEXT,
  criado_em TEXT,
  atualizado_em TEXT
);
```

## Estrutura de pastas (MVC)


```text
prometheus-helpdesk-mvc/
├── index.html
├── assets/
│   └── css/
│       ├── base.css
│       ├── layout.css
│       └── components.css
└── src/
    ├── app.js
    ├── config/
    │   └── helpdesk.config.js
    ├── utils/
    │   └── core.js
    ├── models/
    │   ├── ticket.model.js
    │   └── sqlite.mapper.js
    ├── services/
    │   ├── storage.service.js
    │   ├── csv.service.js
    │   └── sqlite.service.js
    ├── views/
    │   ├── ui.view.js
    │   └── ticket.view.js
    └── controllers/
        ├── ticket.controller.js
        ├── export.controller.js
        ├── sqlite.controller.js
        ├── import.controller.js
        └── alert.controller.js
```

## Organização MVC

- `models`: estado, regras e transformação dos chamados.
- `views`: renderização da interface, fila, histórico e indicadores.
- `controllers`: eventos de tela e coordenação dos casos de uso.
- `services`: persistência, CSV e SQLite.
- `config`: constantes do domínio.
- `utils`: funções genéricas de DOM, texto e datas.
- `app.js`: inicialização da aplicação.
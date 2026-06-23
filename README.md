# Trail Making Test B (TMT-B) — Versão 4.0.0

Implementação digital do **Trail Making Test — Parte B (TMT-B)**, voltada à avaliação de **atenção alternada** e **flexibilidade cognitiva**, com registro detalhado de desempenho, categorização de erros e exportação de resultados em múltiplos formatos.

Este projeto foi desenvolvido pelo **Laboratório de Neurociência Cognitiva**, respeitando as boas práticas metodológicas descritas na literatura neuropsicológica internacional.

---

## 📖 Contexto Científico

O TMT-B é um dos instrumentos mais utilizados em neuropsicologia para mensurar **funções executivas**, sobretudo a capacidade de alternar entre conjuntos mentais (set-shifting) e manter desempenho sob demanda temporal. A versão digital aqui apresentada reproduz a lógica do teste clássico em papel, acrescentando métricas adicionais:

* **Tempo total de execução**
* **Taxa de erros e precisão global**
* **Custo de alternância** (switch cost)
* **Eficiência espacial** (trajetória percorrida vs. ótima)
* **Classificação heurística de desempenho**
* **Tipificação de erros** (sequência, categoria, regressão, perseveração)

A digitalização do teste permite padronização, maior sensibilidade métrica e exportação automatizada para análise estatística.

---

## ⚙️ Funcionalidades

* **Interface interativa** com suporte a teclado, mouse e dispositivos de toque.
* **Módulo de aquecimento** (fase de treino) antes do teste principal.
* **Registro temporal contínuo** em milissegundos.
* **Detecção automática de erros** e feedback imediato.
* **Classificação de desempenho** baseada em heurísticas derivadas da literatura clínica.
* **Exportação de dados** em três formatos:

  * **CSV (resumo estatístico)**
  * **CSV (log bruto de eventos)**
  * **JSON (dados completos, incluindo metadados)**
* **Compatibilidade multiplataforma** (desktop, tablet e dispositivos móveis).
* **Reprodutibilidade experimental** com opção de semente aleatória (`seed`).

---

## 🖥️ Instruções de Uso

1. Abra o arquivo `index.html` em qualquer navegador moderno.
2. Leia as **instruções iniciais**.
3. Clique em **“Começar Aquecimento”** para realizar a fase de treino (1–A até 4–D).
4. Após o aquecimento, inicie o **teste principal** (1–A até 12–L → 13).
5. Execute o teste **o mais rápido possível e com precisão**, clicando/tocando nos nós em ordem crescente.
6. Ao término, visualize o relatório detalhado e **exporte os resultados** para posterior análise.

---

## 📊 Estrutura dos Resultados

### Resumo principal

* **Tempo total (ms e s)**
* **Total de erros e taxa de precisão (%)**
* **Classificação heurística** (Superior, Médio, Médio Baixo, Limítrofe, Comprometido)
* **Custo de alternância** (ms)
* **Eficiência espacial (%)**

### Análise de erros

* **Erros de categoria** (número vs. letra incorreta)
* **Erros de sequência** (ordem adiantada)
* **Erros de regressão** (retorno a item anterior)
* **Índice de perseveração (%)**

### Arquivos exportados

* `TMTB_summary_[timestamp].csv`
* `TMTB_log_[timestamp].csv`
* `TMTB_[timestamp].json`

---

## 📑 Requisitos Técnicos

* Navegador moderno compatível com **HTML5**, **CSS3** e **JavaScript ES6+**.
* Resolução mínima recomendada: **900×600 px**.
* Para melhor experiência, recomenda-se utilizar **modo paisagem** em tablets e smartphones.

---

## 🧪 Considerações Metodológicas

* O tempo máximo de execução é limitado a **5 minutos**, em conformidade com protocolos clínicos usuais.
* A classificação de desempenho implementada é **heurística** e **não substitui normas estratificadas** por idade e escolaridade.
* O uso deve sempre ser acompanhado de interpretação clínica por profissional capacitado.

---

## 🧬 Gerador de Formas Paralelas (v4.0)

A partir da v4.0 o posicionamento dos itens deixou de ser **aleatório ingênuo**
(que só respeitava distância mínima) e passa a usar um **banco de formas paralelas
geometricamente equivalentes** ao TMT-B original, produzido por
[`layoutGenerator.js`](./layoutGenerator.js). O objetivo clínico é permitir
**reteste longitudinal** com instâncias intercambiáveis, sem efeito de prática
por memorização do layout e mantendo a dificuldade constante entre formas.

### Por que isso importa

Duas formas só são estatisticamente equivalentes se compartilharem os
**invariantes geométricos** que carregam a dificuldade do teste. O gerador
controla todos eles via **amostragem-com-rejeição** sobre uma grade fina, com
**RNG determinístico por seed** (mesma seed ⇒ mesma forma):

1. **Não-cruzamento** — a trilha-solução (1→A→2→B→…→13) não se autointercepta.
2. **Não-sobreposição** — distância mínima entre centros (`minDist = 0.11`,
   normalizada), garantindo que nenhum par de círculos colida (inclusive em
   telas pequenas, onde o tamanho do nó é reduzido dinamicamente).
3. **Cobertura espacial (convex hull)** — área do hull do caminho dentro de uma
   janela-alvo que **casa o original do TMT-B (~74%)**.
4. **Deslocamento controlado** — passo entre itens consecutivos amostrado de
   **Poisson(μ≈6.4)** em unidades de grade grosseira (μ·unidade ≈ 0.40 = passo
   médio do original), com piso e teto.
5. **Near-distractors** — densidade de itens não-alvo dentro de um raio crítico
   (R∈{0.15, 0.20, 0.25}); R=0.20 é o raio-chave casado entre formas.
6. **Distribuição angular** — as mudanças de direção do caminho são amostradas
   do histograma empírico do original (virada média ≈ 75°).

> **Rotulagem B (atenção alternada):** o esqueleto geométrico é gerado de forma
> agnóstica ao rótulo; em seguida aplica-se a alternância número↔letra
> (1, A, 2, B, …, 12, L, 13). Assim, a diferença A–B reflete carga cognitiva e
> não diferença de comprimento de trilha ou nº de distratores.

### Referência (TMT-B original digitalizado)

As coordenadas da figura original fornecida foram digitalizadas (aproximadas) e
normalizadas em `[0,1]`, virando `REFERENCE_TMT_B` — o **alvo de equivalência**.
Métricas medidas: comprimento ≈ 9.64 · passo 0.40 ± 0.17 · virada ≈ 75° ·
hull ≈ 74% · near(R.20) ≈ 2.48 · 0 cruzamentos. Se houver coordenadas oficiais,
basta substituí-las em `REFERENCE_TMT_B` — a lógica não muda.

### Métricas e validação

`computeMetrics(points)` expõe (requisito de validação): comprimento total;
passo médio e desvio; nº de cruzamentos (= 0); área do hull (absoluta e % do
campo); near-distractors por raio; histograma das viradas (faixas de 30°);
menor distância par-a-par. `isEquivalent(A, B, tolerances)` retorna
`{equivalent, deltas}`, aceitando uma forma só se cair nas janelas de tolerância
em **todos** os invariantes relativos à referência.

### QA visual

Abra [`qa.html`](./qa.html) no navegador (offline): renderiza a referência + N
formas lado a lado (SVG), com tabela de métricas, selo **pass/fail** por
tolerância e export CSV/JSON.

### Como gerar / casar um conjunto de formas

```bash
# Sonda de viabilidade e métricas da referência:
node layoutGenerator.js --probe --probe-n 400

# Gerar um banco de K formas equivalentes a partir de uma seed inicial:
node layoutGenerator.js --count 6 --seedStart 1 --out forms.generated.json
```

O banco congelado (`forms.generated.json`) é embutido em `index.html` como
`FORM_BANK` (+ `FORM_META` com seed e métricas de cada forma, para
rastreabilidade) e `PRACTICE_FORM` (aquecimento). A cada teste principal o app
**cicla** as formas; com `?seed=N` na URL, a forma é escolhida de modo
**determinístico** (`N mod nFormas`) e o seed aparece no relatório/exportação.

### Testes

```bash
node genTest.js   # gerador: determinismo, equivalência, 0 cruzamentos, minPair, assinatura do original
node appTest.js   # app (jsdom): formas do banco, não-cruzamento/sobreposição até 294px, ciclagem,
                  # execução completa com seed no relatório, detecção de erro, reset
```

### Parâmetros (em `DEFAULT_PARAMS` / `DEFAULT_TOLERANCES`)

`gridFine`, `gridCoarse`, `circleDiameter`, `margin`, `minDist`, `poissonMu`,
`floorDist`/`ceilDist`, `nearRadii`/`nearRadiusKey`/`nearMaxPerStep`,
`hullMin`/`hullMax`, e as tolerâncias de equivalência (`pathLengthPct`,
`meanStepPct`, `sdStepPct`, `hullPctAbs`, `nearKeyAbs`, `meanTurnAbs`,
`crossings`). Todos comentados no topo do módulo e ajustáveis via `qa.html`.

> **Nota sobre o hull:** o requisito metodológico genérico sugere 40–50%, mas a
> figura original do TMT-B mede ~74%; optou-se por **casar o original** (janela
> 66–82%) para preservar a equivalência com a forma de papel.

---

## 📚 Referências

1. Reitan RM. *Validity of the Trail Making Test as an indicator of organic brain damage*. Percept Mot Skills. 1958;8:271–276.
2. Bowie CR, Harvey PD. *Administration and interpretation of the Trail Making Test*. Nat Protoc. 2006;1(5):2277–2281.
3. Sánchez-Cubillo I, et al. *Construct validity of the Trail Making Test: Role of task-switching, working memory, inhibition/interference control, and visuomotor abilities*. J Int Neuropsychol Soc. 2009;15(3):438–450.

---

## 📜 Licença

Este projeto é disponibilizado para fins acadêmicos e de pesquisa. O uso clínico deve respeitar regulamentações locais e diretrizes éticas aplicáveis.

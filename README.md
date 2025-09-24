# TMT-B Eletrônico — Versão 3.2.0

## Visão geral

Este repositório disponibiliza uma implementação **de página única (HTML/JS/CSS)** do *Trail Making Test – Parte B (TMT-B)* com registro completo de desempenho, exportação de dados e opções de reprodutibilidade. O objetivo é oferecer uma ferramenta utilizável em pesquisa clínica e cognitiva, mantendo **boas práticas neuropsicológicas**: o cronômetro não é interrompido por erros, o avanço só ocorre no acerto, e o participante realiza **aquecimento obrigatório** antes do teste principal.

> **Aviso** — Este software é destinado a **ensino e pesquisa**. A interpretação clínica requer **normas estratificadas por idade, escolaridade e contexto sociocultural**, além de julgamento profissional. Os limiares de “classificação” exibidos são **heurísticos para *feedback* imediato** e **não substituem** normas validadas localmente.

---

## Fundamentos e racional clínico

O TMT-B avalia predominantemente **atenção alternada**, **flexibilidade cognitiva** e **controle executivo**, exigindo conexão sequencial alternada de **números** e **letras** em ordem crescente (1-A-2-B-…-13-L). Erros e hesitações traduzem custos executivos acrescidos, o que, quando analisado em conjunto com **tempo total**, **taxa de erro** e **padrões de alternância**, contribui para uma caracterização mais fina do perfil cognitivo.

A versão eletrônica aqui proposta replica a lógica do teste em papel, adicionando **telemetria de eventos** (tempos inter-clique, tipologia do erro, métricas espaciais), **contagem regressiva pré-início** e **aquecimento padronizado** (1-A a 4-D), garantindo maior padronização do ambiente de aplicação e **reprodutibilidade** opcional via *seed*.

---

## Principais características da implementação

* **Sequência canônica TMT-B**: 1-A-2-B-…-12-L e término em **13** (número).
* **Aquecimento obrigatório**: 1-A a 4-D, sem exportação de resultados interpretativos.
* **Erros contam sem pausar o tempo**; avanço somente em **acertos**.
* **Métrica de custo de alternância**: diferença entre tempos médios de passos *switch* e *non-switch*.
* **Eficiência espacial**: razão entre percurso ótimo e observado (em %).
* **Análise de erros**: categoria (troca número/letra), sequência (adiantamento), regressão (retorno; índice de perseveração).
* **Reprodutibilidade**: uso opcional de *seed* na URL (`?seed=1234` ou `#seed=1234`).
* **Exportação**: resumo CSV, JSON completo e **log bruto CSV** (evento a evento).
* **Acessibilidade e UX**: *aria-live* para mensagens, foco visível, *touch-friendly*, responsivo.
* **Limite de tempo**: padrão 5 minutos (configurável no código).

---

## Como usar

1. **Abrir o arquivo** `index.html` (o único arquivo desta aplicação) diretamente no navegador moderno (Chrome, Edge, Safari, Firefox).
2. **Permitir tela ampla**: se possível, utilizar em **paisagem** e com **mouse/trackpad** para melhor precisão.
3. **Executar o aquecimento** (“Começar Aquecimento”). Ao término, o botão “Começar Teste Principal” será liberado.
4. **Iniciar o teste**. O cronômetro inicia após contagem regressiva.
5. **Exportar** os resultados ao final (CSV/JSON/Log CSV) pelo botão **“Ver Resultados”**.

### Reprodutibilidade (semente)

* Adicione `?seed=NUMERO` à URL, por exemplo:

  ```
  file:///…/index.html?seed=1234
  ```

  ou

  ```
  file:///…/index.html#seed=1234
  ```
* A semente fixa a **disposição espacial** dos nós, favorecendo comparações entre sessões.

---

## Estrutura dos dados exportados

### 1) Resumo (CSV)

Exemplo de colunas:

```
Métrica,Valor
Tempo_total_ms,73542
Erros_totais,3
Precisao_pct,91.667
Classificacao,Medio
Custo_alternancia_ms,214
Tempo_medio_switch_ms,912
Tempo_medio_nao_switch_ms,698
Eficiencia_espacial_pct,72.345
Erros_categoria,1
Erros_sequencia,1
Erros_regressao,1
Indice_perseveracao_pct,33.333
Pratica,0
Seed,1234
Versao,3.2.0
```

### 2) JSON completo

Estrutura geral:

```json
{
  "metadata": {
    "isoDate": "2025-09-24T12:34:56.789Z",
    "version": "3.2.0",
    "practice": false,
    "seed": 1234,
    "devicePixelRatio": 1,
    "ua": "Mozilla/5.0 ...",
    "screen": {"w": 1366, "h": 768}
  },
  "summary": {
    "totalTimeMs": 73542,
    "totalErrors": 3,
    "accuracyPct": 91.667,
    "classification": "Medio",
    "switchCostMs": 214,
    "avgSwitchMs": 912,
    "avgNonSwitchMs": 698,
    "spatialEfficiencyPct": 72.345,
    "errorTypes": {"category":1,"sequence":1,"regression":1},
    "perseverationPct": 33.333
  },
  "clicks": [
    {"ts": 0,    "item": "1-number", "expected": "1-number", "correct": 1},
    {"ts": 820,  "item": "A-letter", "expected": "A-letter", "correct": 1},
    {"ts": 1480, "item": "C-letter", "expected": "2-number", "correct": 0}
    // …
  ],
  "positions": [
    {"index":1,"x":123,"y":210,"label":"1-number"},
    {"index":2,"x":455,"y":180,"label":"A-letter"}
    // …
  ]
}
```

**Definições essenciais**

* `totalTimeMs`: tempo total (ms) do teste principal.
* `accuracyPct`: acertos/(acertos+erros) × 100.
* `switchCostMs`: Δ entre tempos médios de passos com alternância (número→letra, letra→número) e sem alternância.
* `spatialEfficiencyPct`: (trajeto ótimo / trajeto observado) × 100.
* `perseverationPct`: regressões/erros × 100.
* `clicks.ts`: tempo relativo (ms) ao início do teste.
* `positions`: grade de nós (para reconstituição espacial).

### 3) Log bruto (CSV)

Formato:

```
t_ms,item,expected,correct
0,1-number,1-number,1
820,A-letter,A-letter,1
1480,C-letter,2-number,0
…
```

---

## Interpretação e relatório

A interpretação robusta exige **normas locais** (idade/escolaridade) e, idealmente, comparação com **Parte A do TMT** (para cálculo de razões TMT-B/TMT-A e isolamento de componentes visuo-motores). As seguintes saídas são úteis para discussão:

* **Tempo total** e **erros totais**: desfechos canônicos.
* **Custo de alternância**: sensível a controle executivo; aumentos sugerem maior carga de *set-shifting*.
* **Padrão de erros**:

  * *Categoria*: alternância falha (número↔letra).
  * *Sequência*: adiantamento dentro da mesma categoria.
  * *Regressão/perseveração*: retorno a itens anteriores.

> **Nota** — A “classificação” exibida é **heurística**. Adapte limiares no código à sua base normativa caso deseje disponibilizar ao público clínico.

---

## Qualidade, padronização e segurança

* **Ambiente**: silencioso, iluminação adequada, instruções padronizadas.
* **Display**: preferir monitores ≥ 13", modo paisagem.
* **Dispositivos apontadores**: mouse/trackpad; *touch* é suportado, porém menos preciso.
* **Treino**: aquecimento obrigatório para reduzir efeito de aprendizagem imediato.
* **Privacidade**: o aplicativo **não envia dados**; exportação é local (download).
* **Ética**: em estudos, seguir orientações do comitê de ética/IRB, com TCLE quando aplicável.

---

## Acessibilidade

* Mensagens com `aria-live` para leitores de tela.
* Estados de foco visíveis nos elementos interativos.
* Área de teste com rótulos (`role="application"`, *aria-label* nos nós).
* Controles utilizáveis por ponteiros; (intencionalmente) não há mapeamento de atalhos de teclado para não distorcer a tarefa.

---

## Configurações (no código)

No construtor da classe `TMTB`, os parâmetros podem ser ajustados:

* `PRACTICE_PAIRS`: default 4 (1-A a 4-D).
* `FULL_PAIRS`: default 12 (1-A a 12-L; final 13).
* `MAX_TIME_MS`: default 300000 (5 min).
* Distância mínima entre nós em CSS: `--minDist` (por padrão, \~84 px em *desktop*).

A **semente** pode ser passada pela URL (`?seed=1234` ou `#seed=1234`).

---

## Validação sugerida

Para estudos de validação, recomenda-se:

1. **Concordância teste-reteste** (ICC) e **convergência** com TMT em papel.
2. **Validade conhecida**: comparação de grupos clínicos vs. controles.
3. **Equivalência de formatos**: *Bland–Altman* entre versões papel e digital.
4. **Curvas de aprendizagem**: efeito do aquecimento e da repetição.
5. **Normatização local**: amostras amplas estratificadas por idade/escolaridade.

---

## Limitações conhecidas

* Ausência de normas embutidas; **não** apresenta *z-scores* ou percentis.
* Interação *touch* pode incrementar variabilidade motora em comparação ao papel.
* Disposição espacial aleatória (ainda que reprodutível com *seed*) pode diferir do arranjo tradicional de estímulos; recomenda-se fixar *seed* em protocolos repetidos.

---

## Solução de problemas

* **Navegador bloqueia interação**: teste em janela sem extensões que interfiram.
* **Tela pequena**: ative modo paisagem; reduza `--circle` em CSS se necessário.
* **Exportação não dispara**: verifique permissões de *download automático* do navegador.

---

## Publicação (GitHub Pages)

1. Faça *fork* ou *clone* do repositório.
2. Garanta que o arquivo se chame `index.html`.
3. Ative **GitHub Pages** (branch `main`, pasta `/root`).
4. Acesse: `https://SEU-USUARIO.github.io/NOME-DO-REPO/`.

---

## Citação sugerida

> **Laboratório de Neurociência Cognitiva.** TMT-B Eletrônico (versão 3.2.0). Página única HTML para avaliação de atenção alternada e flexibilidade cognitiva, com exportação de dados e reprodutibilidade por *seed*. 2025. Disponível em: repositório do autor.

Se publicar resultados com esta ferramenta, inclua no *Methods* uma descrição sucinta do procedimento, dispositivos, *seed* utilizada (se houver), formato e métricas exportadas.

---

## Licença

Defina a licença de sua preferência (recomenda-se **MIT** para uso amplo em pesquisa). Inclua o arquivo `LICENSE` na raiz do repositório.

---

## Contribuição

*Pull requests* são bem-vindos. Favor descrever a alteração proposta, impacto nas métricas e, quando pertinente, anexar **testes de validação** (p. ex., comparações com dados de referência).

---

## Changelog

**v3.2.0**

* Acessibilidade aprimorada (*aria-live*, foco visível).
* Exportação adicional de **log bruto** (CSV).
* Reprodutibilidade via *seed* em URL.
* Métricas: custo de alternância, eficiência espacial e tipologia de erros.
* Geração espacial com distância mínima adaptativa e recuperação automática.

---

### Contato

Para dúvidas ou sugestões metodológicas, abra uma **Issue** descrevendo o contexto de aplicação (população, dispositivo, protocolo) e a versão utilizada.

# Trail Making Test B (TMT-B) — Versão 3.3.1

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

## 📚 Referências

1. Reitan RM. *Validity of the Trail Making Test as an indicator of organic brain damage*. Percept Mot Skills. 1958;8:271–276.
2. Bowie CR, Harvey PD. *Administration and interpretation of the Trail Making Test*. Nat Protoc. 2006;1(5):2277–2281.
3. Sánchez-Cubillo I, et al. *Construct validity of the Trail Making Test: Role of task-switching, working memory, inhibition/interference control, and visuomotor abilities*. J Int Neuropsychol Soc. 2009;15(3):438–450.

---

## 📜 Licença

Este projeto é disponibilizado para fins acadêmicos e de pesquisa. O uso clínico deve respeitar regulamentações locais e diretrizes éticas aplicáveis.

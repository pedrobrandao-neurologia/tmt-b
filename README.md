# Teste de Trilhas - Parte B (TMT-B) - Versão Aprimorada 🧠⚙️

![Versão](https://img.shields.io/badge/versão-3.0.0-purple.svg)
![Licença](https://img.shields.io/badge/licença-MIT-green.svg)
![Tecnologia](https://img.shields.io/badge/tecnologia-HTML%2CSS%2CJS-orange.svg)

Uma implementação digital interativa e aprimorada do **Trail Making Test Parte B (TMT-B)**. Esta é uma ferramenta neuropsicológica avançada, projetada para avaliar funções executivas superiores, com foco principal na **flexibilidade cognitiva**, atenção dividida e controle inibitório.

Diferente da Parte A, o TMT-B exige que o participante alterne entre duas sequências mentais (números e letras), seguindo o padrão **1 → A → 2 → B → 3 → C...**. Esta tarefa de alternância é um indicador sensível da capacidade do cérebro de gerenciar e trocar entre diferentes conjuntos de regras.

## ✨ Recursos Principais

Este projeto transforma o TMT-B clássico em uma poderosa ferramenta de análise digital, incorporando funcionalidades robustas para uma avaliação neurocognitiva detalhada.

* **Análise de Flexibilidade Cognitiva (Métrica Chave):**
    * **Custo de Alternância (Switch Cost):** Calcula automaticamente a diferença de tempo entre cliques que exigem uma mudança de categoria (ex: de número para letra) e cliques que não exigem. Este é um indicador direto da eficiência do controle executivo.
    * **Tempo Médio de Alternância vs. Não Alternância:** Fornece os tempos de reação médios para cada tipo de tarefa, permitindo uma análise mais granular da performance.

* **Métricas Avançadas de Desempenho:**
    * **Eficiência Espacial:** Mede a precisão do controle motor calculando a razão entre a distância ideal (linha reta) e a distância real percorrida pelo usuário.
    * **Precisão (Accuracy):** Percentual de cliques corretos em relação ao total de cliques.

* **Análise Detalhada de Erros:**
    * **Classificação de Erros:** Categoriza os erros em tipos específicos para um diagnóstico mais preciso:
        * `Erro de Categoria`: Clicar em um número quando se esperava uma letra, e vice-versa.
        * `Erro de Sequência`: Clicar no tipo correto, mas no valor errado (ex: clicar no "4" em vez do "3").
        * `Erro de Regressão`: Clicar em um item que já foi completado na sequência.
    * **Índice de Perseveração:** Calcula a porcentagem de erros que são de natureza regressiva, um possível indicador de dificuldades de inibição.

* **Classificação Normativa:** Compara o tempo de conclusão e o número de erros com dados da literatura para fornecer uma classificação de desempenho (ex: "Médio", "Limítrofe", "Comprometido").

* **Fluxo de Teste Estruturado:**
    * Segue um fluxo claro: **Instruções → Aquecimento → Teste Principal → Resultados**.
    * Inclui um **aquecimento** mais curto para garantir que o usuário compreenda a regra de alternância antes do teste principal.

* **Relatório de Resultados Completo:**
    * Um modal interativo apresenta um resumo claro do desempenho, incluindo as métricas primárias, a análise de flexibilidade cognitiva e a análise de erros.

* **Exportação de Dados:**
    * Permite a exportação dos resultados completos em formatos amigáveis para análise de dados: **JSON** (dados brutos e calculados) e **CSV** (resumo das métricas).

* **Feedback Interativo e Design Responsivo:**
    * Animações e feedback visual imediato para acertos e erros.
    * Interface limpa e adaptável a diferentes dispositivos, como desktops e tablets.

***

## 🚀 Como Usar

A aplicação é um único arquivo HTML e não necessita de nenhuma instalação.

1.  **Abra o arquivo:** Abra o arquivo `index.html` em qualquer navegador web moderno.
2.  **Leia as Instruções:** A tela inicial explicará a tarefa de alternância.
3.  **Faça o Aquecimento:** Clique em **"Começar Aquecimento"** para praticar a sequência 1-A-2-B... em uma versão mais curta.
4.  **Inicie o Teste:** Após o aquecimento, clique em **"Começar Teste Principal"**. Uma contagem regressiva preparará você para o início.
5.  **Execute a Tarefa:** Clique nos círculos **alternando entre números e letras em ordem crescente (1 → A → 2 → B...)** o mais rápido e precisamente que puder.
6.  **Veja os Resultados:** Ao final do teste, um relatório detalhado será exibido automaticamente em um modal. Você poderá exportar seus dados a partir deste ponto.

***

## 🛠️ Tecnologias Utilizadas

Este projeto foi construído sem dependências externas para máxima portabilidade.

* **HTML5:** Estrutura semântica do conteúdo.
* **CSS3:** Estilização moderna com variáveis CSS, animações e layout responsivo.
* **JavaScript (ES6+):** Toda a lógica do teste, manipulação do DOM, cálculos de métricas avançadas e interatividade são implementados em JavaScript puro e organizados em uma estrutura de classe (`TMTBTest`).

***

## 📂 Estrutura do Projeto

Tudo o que você precisa está contido em um único arquivo para simplicidade e facilidade de distribuição:

* `index.html`: Contém a estrutura HTML, todos os estilos CSS e o código JavaScript completo da aplicação.

***

## 📄 Licença

Este projeto está licenciado sob a Licença MIT.

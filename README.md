# Variáveis Latentes Discretas, K-Means e Modelos de Mistura

Material didático interativo e apresentação acadêmica em **47 slides HTML** sobre modelos de variáveis latentes discretas, K-Means, Misturas de Bernoulli, algoritmo EM e Gaussian Mixture Models.

**Disciplina:** Aprendizado de Máquina Não Supervisionado — Bacharelado em IA  
**Formato:** Deck único linear com 47 slides em três blocos (29 de Núcleo + 18 Laboratórios/Aprofundamentos)  
**Rota de 60 minutos:** Marcada com a insígnia `[NÚCLEO]` para a banca avaliadora  
**Integrantes:**
- **Bloco 1 · Henrique Matheus e Lucas Nogueira:** Variáveis latentes, 1-de-K, responsabilidades, K-Means e algoritmo de Lloyd (slides 02–14)
- **Bloco 2 · Antonio Carlos:** Misturas de Bernoulli, gargalo do log e algoritmo EM (slides 15–32)
- **Bloco 3 · Bianca Visco:** Gaussian Mixture Models, covariâncias e comparação (slides 33–47)

---

## Como abrir

### Opção 1 — arquivo único (recomendada para apresentar)

Abra **`apresentacao.html`** diretamente no navegador com dois cliques. É um arquivo único independente com todo o CSS, KaTeX embutido, visualizações matemáticas e laboratórios. Funciona offline em qualquer pasta, pen drive ou anexo.

### Opção 2 — ambiente de desenvolvimento

Ao editar os arquivos-fonte (`index.html`, `styles.css`, `viz.js`, `figures.js`, `labs.js`, `script.js`), regenere a versão de arquivo único:

```bash
node build.js      # lê os fontes e regera apresentacao.html
```

---

## Como navegar e apresentar

| Ação | Atalho |
| :--- | :--- |
| **Próximo passo / Próximo slide** | `Espaço` · `→` · `PageDown` · `↓` |
| **Slide anterior** | `←` · `PageUp` |
| **Primeiro / último slide** | `Home` / `End` |
| **Ir para um slide direto** | digite o **número** e `Enter` (ex.: `2` `2` `Enter`) |
| **Notas do apresentador** | `N` |
| **Visão geral dos 47 slides** | `O` (com filtros: Todos / Núcleo / Aprofundamento) |
| **Glossário de símbolos e termos** | `G` |
| **Tela cheia** | `F` |
| **Ocultar barra de controles** | `C` |
| **Tela de ajuda** | `?` ou `H` |
| **Fechar painel / sobreposição** | `Esc` |

### O Caminho de 60 Minutos (29 Slides de Núcleo)

Para apresentar estritamente no tempo regulamentar de 60 minutos sem os laboratórios extensos:
- **Capa:** Slide 01
- **Bloco 1 (Henrique e Lucas):** 02 a 14 — o bloco inteiro é de núcleo (00:00–29:30)
- **Bloco 2 (Antonio):** 15, 16, 19, 21, 22, 26, 27, 32 (29:30–46:30)
- **Bloco 3 (Bianca):** 33, 34, 39, 42, 44, 46, 47 (46:30–61:30)

Os 18 slides de aprofundamento e laboratórios, todos nos Blocos 2 e 3, trazem a insígnia `[APROFUNDAMENTO]` e servem para fixação individual, estudo autodidático e respostas aprofundadas a perguntas da banca.

---

## Os 10 Laboratórios Interativos (`labs.js`)

Todos rodam no próprio navegador com semente reproduzível, controles reativos e renderização KaTeX. Após o enxugamento do deck, os laboratórios remanescentes estão todos nos Blocos 2 e 3:

| # | Laboratório | Slide |
| :--- | :--- | :--- |
| 1 | **Pinte um Dígito** — grade 8×8 desenhável com classificação instantânea por Bernoulli | 18 |
| 2 | **Por que o Log Atrapalha** — comparação numérica entre \(\ln(a+b)\) e \(\ln a + \ln b\) | 20 |
| 3 | **EM em 6 Amostras** — ciclo de matrizes \(\gamma\) e protótipos \(\boldsymbol\mu\) | 23 |
| 4 | **Decomposição ELBO + KL** — por que \(\ln p(X)\) nunca diminui | 25 |
| 5 | **Underflow ao Vivo** — subfluxo de float64 vs espaço logarítmico | 30 |
| 6 | **Laboratório da Covariância** — sliders de \(\sigma_1, \sigma_2, \rho\) girando elipses 2-D | 36 |
| 7 | **Mahalanobis vs Euclidiana** — distâncias considerando a dispersão estatística | 38 |
| 8 | **EM-GMM Animado** — convergência contínua das gaussianas com curva de \(\ln L\) | 40 |
| 9 | **Varredura BIC** — curvas de BIC para os 4 tipos de covariância | 43 |
| 10 | **Detecção de Anomalias** — limiar de densidade \(p(\mathbf{x}) < \tau\) | 45 |

> Os 14 laboratórios do antigo Bloco 0 e dos blocos de fundamentos/K-Means (decodificador de notação, álgebra linear, Bayes, 1-de-K, inércia na mão, Lloyd meio-passo, k-means++, quantização de imagens, entre outros) continuam implementados em `labs.js` e podem ser reativados criando um slide com o `data-lab` correspondente.

## Implementações em Python (NumPy e scikit-learn)

- **Slide 31:** Mistura de Bernoulli com algoritmo EM e estabilidade *Log-Sum-Exp* do zero em NumPy.
- **Slide 44:** GMM e K-Means comparados com `scikit-learn` (`fit`, `predict_proba`, `score_samples`).

## Arquivos do Projeto

| Arquivo | Descrição |
| :--- | :--- |
| **`apresentacao.html`** | **Versão de arquivo único independente (gerada por `build.js`).** |
| `index.html` | Código-fonte dos 47 slides, notas, modais e estrutura semântica. |
| `styles.css` | Design system: variáveis de cor, tipografia IBM Plex, layouts de labs e temas. |
| `viz.js` | Motor de machine learning (`MLCore`): K-Means, EM-Bernoulli, EM-GMM, Mahalanobis, Silhueta, BIC. |
| `figures.js` | Camada de renderização gráfica em Canvas 2D (`FigCore`, `VIZ`). |
| `labs.js` | Controladores dos 24 laboratórios interativos com ciclo de vida e KaTeX integrado. |
| `script.js` | Controle de navegação, micro-passos, checagens rápidas, glossário e atalhos. |
| `build.js` | Compilador que embute estilos e scripts em `apresentacao.html`. |

---

## Referências Bibliográficas

1. **Bishop, C. M.** *Pattern Recognition and Machine Learning*. Springer, 2006 (Cap. 15).
2. **Murphy, K. P.** *Probabilistic Machine Learning: An Introduction*. MIT Press, 2022 (Cap. 21).
3. **scikit-learn Developers.** *Clustering and Gaussian Mixture Models User Guide* (§2.1 e §2.3).
4. **Arthur, D.; Vassilvitskii, S.** *k-means++: The Advantages of Careful Seeding*. SODA, 2007.
5. **Dempster, A. P.; Laird, N. M.; Rubin, D. B.** *Maximum Likelihood from Incomplete Data via the EM Algorithm*. JRSS-B, 1977.

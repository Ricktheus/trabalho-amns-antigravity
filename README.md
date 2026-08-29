# Variáveis Latentes Discretas, K-Means e Modelos de Mistura

Material didático interativo e apresentação acadêmica em **73 slides HTML** sobre modelos de variáveis latentes discretas, K-Means, Misturas de Bernoulli, algoritmo EM e Gaussian Mixture Models.

**Disciplina:** Aprendizado de Máquina Não Supervisionado — Bacharelado em IA  
**Formato:** deck único linear com 73 slides (28 de núcleo + 45 laboratórios/aprofundamentos), com tema claro e escuro alternáveis  
**Rota de 60 minutos:** Marcada com a insígnia `[NÚCLEO]` para a banca avaliadora  
**Percurso:**
- **Bloco 0 · Nivelamento e fundamentos:** álgebra linear, decodificador de notação e Bayes (slides 01–07)
- **Bloco 1 · Fundamentos:** variáveis latentes e codificação 1-de-K (slides 08–21)
- **Bloco 2 · K-Means:** algoritmo de Lloyd, escolha de K e limitações (slides 22–40)
- **Bloco 3 · Misturas de Bernoulli:** gargalo do log e algoritmo EM (slides 41–58)
- **Bloco 4 · Gaussian Mixture Models:** covariâncias, BIC e comparação (slides 59–73)

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

## Temas

A apresentação abre em **tema claro**. O botão **Tema** na barra inferior — ou a tecla `T` — alterna para o tema escuro e de volta; a escolha fica guardada no navegador e vale para as próximas sessões. Os gráficos em Canvas relêem as cores dos tokens CSS a cada troca, então figuras e laboratórios acompanham o tema.

---

## Como navegar e apresentar

| Ação | Atalho |
| :--- | :--- |
| **Próximo passo / Próximo slide** | `Espaço` · `→` · `PageDown` · `↓` |
| **Slide anterior** | `←` · `PageUp` |
| **Primeiro / último slide** | `Home` / `End` |
| **Ir para um slide direto** | digite o **número** e `Enter` (ex.: `2` `2` `Enter`) |
| **Notas do apresentador** | `N` |
| **Visão geral dos 73 slides** | `O` (com filtros: Todos / Núcleo / Aprofundamento) |
| **Glossário de símbolos e termos** | `G` |
| **Alternar tema claro / escuro** | `T` (ou o botão **Tema** na barra) |
| **Tela cheia** | `F` |
| **Ocultar barra de controles** | `C` |
| **Tela de ajuda** | `?` ou `H` |
| **Fechar painel / sobreposição** | `Esc` |

### O Caminho de 60 Minutos (28 Slides de Núcleo)

Para apresentar estritamente no tempo regulamentar de 60 minutos sem os laboratórios extensos:
- **Capa:** Slide 01
- **Bloco 1:** 08, 10, 13, 15, 17, 21
- **Bloco 2:** 22, 23, 25, 29, 30, 33, 39, 40
- **Bloco 3:** 41, 42, 45, 47, 48, 52, 53, 58
- **Bloco 4:** 59, 60, 65, 68, 70, 72, 73

Os 45 slides de aprofundamento e laboratórios trazem a insígnia `[APROFUNDAMENTO]` e servem para fixação individual, estudo autodidático e respostas aprofundadas a perguntas da banca.

---

## Os 24 Laboratórios Interativos e Simuladores (`labs.js`)

Todos os laboratórios rodam no próprio navegador com semente reproduzível, controles reativos e renderização KaTeX:

1. **Decodificador de Notação (Slide 02):** tradução interativa em KaTeX de \(\Sigma, \Pi, \mathbf{z}, \gamma, \boldsymbol\Sigma, \ln, \arg\min, \mathbf{x}^\top\).
2. **Álgebra Linear 101 (Slide 03):** vetores 2-D, transposta \(\mathbf{x}^\top\), produto interno \(\mathbf{x}^\top\mathbf{y}\), normas euclidianas e ângulo \(\theta\).
3. **Revisão Relâmpago (Slide 04):** média, variância e curva normal reativa com arraste de pontos.
4. **Probabilidade Condicional & Bayes (Slide 05):** cálculo visual da probabilidade total e inversão de Bayes.
5. **Bayes com Números (Slides 06 e 18):** tabela do cálculo de \(\gamma_{nk}\) com prior e verossimilhança, ao lado do gráfico das duas densidades ponderadas e da barra de normalização.
6. **Máquina Geradora (Slide 07):** sorteio generativo acumulando na densidade marginal teórica.
7. **1-de-K na Prática (Slide 14):** colapso mecânico do produto \(\prod \pi_k^{z_k}\).
8. **\(J\) na Mão (Slide 24):** cálculo da inércia com arraste de centróides.
9. **Por que a Média? (Slide 27):** parábola do erro quadrático e derivada nula no vértice.
10. **Lloyd Meio-Passo (Slide 28):** execução isolada dos botões *Atribuir* e *Atualizar*.
11. **Laboratório do \(K\) (Slide 32):** varredura de \(K=1\ldots8\) com silhueta e inércia simultâneas.
12. **Roleta do k-means++ (Slide 35):** semeadura probabilística com peso proporcional a \(D^2\).
13. **Quantização de Imagens (Slide 38):** compressão de cores 24-bits em RGB com K-Means para paleta de \(K\) cores.
14. **Pinte um Dígito (Slide 44):** grade 8×8 desenhável com classificação instantânea por Bernoulli.
15. **Por que o Log Atrapalha (Slide 46):** comparação numérica entre \(\ln(a+b)\) e \(\ln a + \ln b\).
16. **EM em 6 Amostras (Slide 49):** ciclo de matrizes \(\gamma\) e protótipos \(\boldsymbol\mu\).
17. **Decomposição ELBO + KL (Slide 51):** visualização de por que \(\ln p(X)\) nunca diminui.
18. **Underflow ao Vivo (Slide 56):** subfluxo de float64 colapsando a zero vs espaço logarítmico.
19. **Laboratório da Covariância (Slide 62):** sliders de \(\sigma_1, \sigma_2, \rho\) girando elipses 2-D ao vivo.
20. **Mahalanobis vs Euclidiana (Slide 64):** comparação de distâncias considerando a dispersão estatística.
21. **EM-GMM Animado (Slide 66):** translação e rotação contínua das gaussianas com curva de \(\ln L\).
22. **Colapso da Gaussiana (Slide 67):** \(\sigma_1 \to 0\) sobre um único ponto, a curva de \(\ln L\) divergindo e o efeito do piso `reg_covar`.
23. **Varredura BIC (Slide 69):** curvas de BIC para os 4 tipos de covariância.
24. **Detecção de Anomalias (Slide 71):** limiar de densidade \(p(\mathbf{x}) < \tau\), com a região de anomalia e a curva de nível \(p(\mathbf{x}) = \tau\) desenhadas no plano.

O **slide 70** traz a demonstração lado a lado de K-Means e GMM sobre os mesmos dados anisotrópicos, em abas com o gráfico e o script `scikit-learn` correspondente.

---

## Implementações em Python (NumPy e scikit-learn)

Os slides 19, 37 e 57 mostram, ao lado da listagem, a **saída real do console** obtida ao executar o próprio código.

- **Slide 19:** cálculo de responsabilidades \(\gamma_{nk}\) e Teorema de Bayes do zero em NumPy.
- **Slide 37:** K-Means completo com descida alternada de Lloyd em 25 linhas de NumPy.
- **Slide 57:** mistura de Bernoulli com algoritmo EM e estabilidade *Log-Sum-Exp* do zero em NumPy.
- **Slide 70:** GMM e K-Means comparados com `scikit-learn` (`fit`, `predict_proba`, `score_samples`).

---

## Arquivos do Projeto

| Arquivo | Descrição |
| :--- | :--- |
| **`apresentacao.html`** | **Versão de arquivo único independente (gerada por `build.js`).** |
| `index.html` | Código-fonte dos 73 slides, notas, modais e estrutura semântica. |
| `styles.css` | Design system: tokens dos temas claro e escuro, tipografia IBM Plex e layouts de labs. |
| `viz.js` | Motor de machine learning (`MLCore`): K-Means, EM-Bernoulli, EM-GMM, Mahalanobis, Silhueta, BIC. |
| `figures.js` | Camada de renderização gráfica em Canvas 2D (`FigCore`, `VIZ`); lê as cores dos tokens CSS. |
| `labs.js` | Controladores dos 24 laboratórios interativos com ciclo de vida e KaTeX integrado. |
| `script.js` | Controle de navegação, micro-passos reveláveis, glossário e atalhos de teclado. |
| `build.js` | Compilador que embute estilos e scripts em `apresentacao.html`. |

---

## Referências Bibliográficas

1. **Bishop, C. M.** *Pattern Recognition and Machine Learning*. Springer, 2006 (Cap. 15).
2. **Murphy, K. P.** *Probabilistic Machine Learning: An Introduction*. MIT Press, 2022 (Cap. 21).
3. **scikit-learn Developers.** *Clustering and Gaussian Mixture Models User Guide* (§2.1 e §2.3).
4. **Arthur, D.; Vassilvitskii, S.** *k-means++: The Advantages of Careful Seeding*. SODA, 2007.
5. **Dempster, A. P.; Laird, N. M.; Rubin, D. B.** *Maximum Likelihood from Incomplete Data via the EM Algorithm*. JRSS-B, 1977.

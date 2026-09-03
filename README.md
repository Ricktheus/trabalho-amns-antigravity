# Variáveis Latentes Discretas, K-Means e Modelos de Mistura

Material didático interativo e apresentação acadêmica em **67 slides HTML** sobre modelos de variáveis latentes discretas, K-Means, Misturas de Bernoulli, algoritmo EM e Gaussian Mixture Models.

**Disciplina:** Aprendizado de Máquina Não Supervisionado (2026.2) — Bacharelado em IA  
**Professor:** Lucas Araújo Pereira  
**Formato:** deck único linear com 67 slides (30 de núcleo + 37 laboratórios/aprofundamentos), com tema claro e escuro alternáveis  
**Rota de 60 minutos:** Marcada com a insígnia `[NÚCLEO]` para a banca avaliadora  
**Percurso:**
- **Bloco 1 · Fundamentos** — *Henrique Matheus Mendonça de Miranda*: variáveis latentes e codificação 1-de-K (slides 01–15)
- **Bloco 2 · K-Means** — *Luiany Gonçalves Carvalho*: algoritmo de Lloyd, escolha de K e limitações (slides 16–34)
- **Bloco 3 · Misturas de Bernoulli** — *Antonio Carlos de Barcelos Fernandes*: gargalo do log e algoritmo EM (slides 35–52)
- **Bloco 4 · Gaussian Mixture Models** — *Bianca Fernandes Visco*: covariâncias, BIC e comparação (slides 53–67)

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
| **Visão geral dos 67 slides** | `O` (com filtros: Todos / Núcleo / Aprofundamento) |
| **Glossário de símbolos e termos** | `G` |
| **Alternar tema claro / escuro** | `T` (ou o botão **Tema** na barra) |
| **Tela cheia** | `F` |
| **Ocultar barra de controles** | `C` |
| **Tela de ajuda** | `?` ou `H` |
| **Fechar painel / sobreposição** | `Esc` |

### O Caminho de 60 Minutos (30 Slides de Núcleo)

Para apresentar estritamente no tempo regulamentar de 60 minutos sem os laboratórios extensos:
- **Capa:** Slide 01
- **Bloco 1 · Henrique:** 02, 04, 07, 09, 11, 15
- **Bloco 2 · Luiany:** 16, 17, 19, 23, 24, 27, 33, 34
- **Bloco 3 · Antonio:** 35, 36, 39, 41, 42, 46, 47, 52
- **Bloco 4 · Bianca:** 53, 54, 59, 62, 64, 66, 67

Os 37 slides de aprofundamento e laboratórios trazem a insígnia `[APROFUNDAMENTO]` e servem para fixação individual, estudo autodidático e respostas aprofundadas a perguntas da banca.

### Roteiro de fala (`roteiro-apresentacao.pdf`)

O PDF traz, para cada um dos 67 slides, o texto falado completo em linguagem coloquial de apresentação — não um resumo, e sim o que a pessoa diz em cima do slide. Cada bloco apresentado soma entre 12 e 15 minutos de fala (≈ 14,5 min, estimados a 135 palavras por minuto).

Para regenerar depois de editar os textos em `roteiro/b1.py`–`b4.py` (os títulos e blocos são lidos direto do `index.html`, então nunca saem de sincronia):

```bash
python3 roteiro/gerar_roteiro.py   # escreve roteiro/roteiro.html
node    roteiro/gerar_pdf.js       # imprime roteiro-apresentacao.pdf (requer playwright)
```

---

## Os 19 Laboratórios Interativos e Simuladores (`labs.js`)

Todos os laboratórios rodam no próprio navegador com semente reproduzível, controles reativos e renderização KaTeX:

1. **1-de-K na Prática (Slide 08):** colapso mecânico do produto \(\prod \pi_k^{z_k}\).
2. **Bayes com Números (Slide 12):** tabela do cálculo de \(\gamma_{nk}\) com prior e verossimilhança, ao lado do gráfico das duas densidades ponderadas e da barra de normalização.
3. **\(J\) na Mão (Slide 18):** cálculo da inércia com arraste de centróides.
4. **Por que a Média? (Slide 21):** parábola do erro quadrático e derivada nula no vértice.
5. **Lloyd Meio-Passo (Slide 22):** execução isolada dos botões *Atribuir* e *Atualizar*.
6. **Laboratório do \(K\) (Slide 26):** varredura de \(K=1\ldots8\) com silhueta e inércia simultâneas.
7. **Roleta do k-means++ (Slide 29):** semeadura probabilística com peso proporcional a \(D^2\).
8. **Quantização de Imagens (Slide 32):** compressão de cores 24-bits em RGB com K-Means para paleta de \(K\) cores.
9. **Pinte um Dígito (Slide 38):** grade 8×8 desenhável com classificação instantânea por Bernoulli.
10. **Por que o Log Atrapalha (Slide 40):** comparação numérica entre \(\ln(a+b)\) e \(\ln a + \ln b\).
11. **EM em 6 Amostras (Slide 43):** ciclo de matrizes \(\gamma\) e protótipos \(\boldsymbol\mu\).
12. **Decomposição ELBO + KL (Slide 45):** visualização de por que \(\ln p(X)\) nunca diminui.
13. **Underflow ao Vivo (Slide 50):** subfluxo de float64 colapsando a zero vs espaço logarítmico.
14. **Laboratório da Covariância (Slide 56):** sliders de \(\sigma_1, \sigma_2, \rho\) girando elipses 2-D ao vivo.
15. **Mahalanobis vs Euclidiana (Slide 58):** comparação de distâncias considerando a dispersão estatística.
16. **EM-GMM Animado (Slide 60):** translação e rotação contínua das gaussianas com curva de \(\ln L\).
17. **Colapso da Gaussiana (Slide 61):** \(\sigma_1 \to 0\) sobre um único ponto, a curva de \(\ln L\) divergindo e o efeito do piso `reg_covar`.
18. **Varredura BIC (Slide 63):** curvas de BIC para os 4 tipos de covariância.
19. **Detecção de Anomalias (Slide 65):** limiar de densidade \(p(\mathbf{x}) < \tau\), com a região de anomalia e a curva de nível \(p(\mathbf{x}) = \tau\) desenhadas no plano.

O **slide 64** traz a demonstração lado a lado de K-Means e GMM sobre os mesmos dados anisotrópicos, em abas com o gráfico e o script `scikit-learn` correspondente.

---

## Implementações em Python (NumPy e scikit-learn)

Os slides 13, 31 e 51 mostram, ao lado da listagem, a **saída real do console** obtida ao executar o próprio código.

- **Slide 13:** cálculo de responsabilidades \(\gamma_{nk}\) e Teorema de Bayes do zero em NumPy.
- **Slide 31:** K-Means completo com descida alternada de Lloyd em 25 linhas de NumPy.
- **Slide 51:** mistura de Bernoulli com algoritmo EM e estabilidade *Log-Sum-Exp* do zero em NumPy.
- **Slide 64:** GMM e K-Means comparados com `scikit-learn` (`fit`, `predict_proba`, `score_samples`).

---

## Arquivos do Projeto

| Arquivo | Descrição |
| :--- | :--- |
| **`apresentacao.html`** | **Versão de arquivo único independente (gerada por `build.js`).** |
| `index.html` | Código-fonte dos 67 slides, notas, modais e estrutura semântica. |
| `styles.css` | Design system: tokens dos temas claro e escuro, tipografia IBM Plex e layouts de labs. |
| `viz.js` | Motor de machine learning (`MLCore`): K-Means, EM-Bernoulli, EM-GMM, Mahalanobis, Silhueta, BIC. |
| `figures.js` | Camada de renderização gráfica em Canvas 2D (`FigCore`, `VIZ`); lê as cores dos tokens CSS. |
| `labs.js` | Controladores dos 19 laboratórios interativos com ciclo de vida e KaTeX integrado. |
| `script.js` | Controle de navegação, micro-passos reveláveis, glossário e atalhos de teclado. |
| `build.js` | Compilador que embute estilos e scripts em `apresentacao.html`. |
| **`roteiro-apresentacao.pdf`** | **Roteiro de fala: o texto falado de cada um dos 67 slides, bloco a bloco.** |
| `roteiro/` | Fonte do roteiro: `b1.py`–`b4.py` (falas por bloco) e os geradores de HTML e PDF. |

---

## Referências Bibliográficas

1. **Bishop, C. M.** *Pattern Recognition and Machine Learning*. Springer, 2006 (Cap. 15).
2. **Murphy, K. P.** *Probabilistic Machine Learning: An Introduction*. MIT Press, 2022 (Cap. 21).
3. **scikit-learn Developers.** *Clustering and Gaussian Mixture Models User Guide* (§2.1 e §2.3).
4. **Arthur, D.; Vassilvitskii, S.** *k-means++: The Advantages of Careful Seeding*. SODA, 2007.
5. **Dempster, A. P.; Laird, N. M.; Rubin, D. B.** *Maximum Likelihood from Incomplete Data via the EM Algorithm*. JRSS-B, 1977.

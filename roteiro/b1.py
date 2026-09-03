# -*- coding: utf-8 -*-
# Bloco 1 · Henrique Matheus Mendonça de Miranda · slides 01 a 15 · Fundamentos e variáveis latentes
FALAS = {

1: """Bom dia a todos, professores, membros da banca e colegas. Meu nome é Henrique Miranda e,
junto com a Luiany, o Antonio e a Bianca, eu vou apresentar nosso trabalho sobre variáveis
latentes discretas, K-Means, misturas de Bernoulli e Gaussian Mixture Models. A ideia
central que atravessa a apresentação inteira é esta: esses três métodos, que normalmente são
ensinados em capítulos separados, são na verdade o mesmo modelo com hipóteses diferentes.
Nosso material tem setenta e três slides, mas a rota que vamos apresentar hoje são os vinte
e oito slides de núcleo; o resto são laboratórios interativos e aprofundamentos que ficam
pra consulta. A divisão é a seguinte: eu abro com os fundamentos e as variáveis latentes, a
Luiany apresenta o K-Means, o Antonio as misturas de Bernoulli e o algoritmo EM, e a Bianca
fecha com os modelos gaussianos e a comparação final.""",

2: """Vamos começar pela diferença que define tudo. No aprendizado supervisionado, o conjunto de
dados vem em pares: uma entrada x e um rótulo y. Existe um gabarito externo, e o modelo
ajusta suas fronteiras de decisão tentando errar o mínimo possível contra esse gabarito. No
não supervisionado, esse gabarito simplesmente não existe. A gente só tem as medições
brutas. E isso muda a pergunta: não é mais ‘qual é o rótulo desta amostra’, e sim ‘que
estrutura existe aqui dentro’. Olhem os dois gráficos: são exatamente os mesmos duzentos e
setenta pontos. À esquerda, as cores vêm dos rótulos verdadeiros. À direita, elas não
existem — só os contornos tracejados marcam os fatores geradores que a gente precisa
inferir. O objetivo passa a ser descobrir, não prever.""",

3: """E descobrir o quê, exatamente? A literatura organiza isso em três objetivos. O primeiro é
agrupamento: particionar as observações em subpopulações homogêneas e disjuntas — é
segmentação de clientes, taxonomia de espécies, descoberta de subtipos celulares. O segundo
é estimação de densidade: modelar a função de probabilidade que rege os dados, quantificando
onde eles são densos e onde são raros — isso é o que sustenta detecção de anomalia e de
fraude, e a Bianca vai mostrar isso na prática no final. O terceiro é aprender
representações latentes: descrever cada amostra por poucos fatores interpretáveis, em vez
das centenas de medidas originais. O bonito é que os modelos de mistura que a gente vai ver
entregam os três de uma vez só — é o mesmo objeto matemático resolvendo as três tarefas.""",

4: """Aqui está o conceito que dá nome ao trabalho. A gente separa o mundo em duas variáveis. A
observada, x, é o que o instrumento mediu: os pixels de uma foto, os sinais vitais de um
paciente, as compras de um cliente. A latente, z, é o fator causal que a gente não mediu: o
dígito que a pessoa pretendia escrever, a patologia de base, o perfil de consumo. Ela
existe, ela gerou o dado, mas ela não aparece na tabela. E a ponte formal entre as duas é a
marginalização: a probabilidade de observar x é a soma, sobre todos os estados possíveis de
z, do prior de z vezes a densidade condicional de x dado z. Olhem o diagrama: o nó cinza é o
único observado, o branco permanece oculto, e a caixa retangular indica que isso se repete
para as N amostras.""",

5: """Pra isso não ficar abstrato, quatro casos concretos. Em visão computacional, o observado é
uma grade de sessenta e quatro ou setecentos e oitenta e quatro pixels em preto e branco; o
latente é o dígito que o escritor pretendia. Em medicina, o observado é um painel de
cinquenta sintomas e biomarcadores; o latente é o subtipo da doença ou a mutação causadora.
Em processamento de texto, o observado é o vetor binário de presença de palavras; o latente
é o tema editorial do artigo. E em finanças, o observado é valor, horário, geolocalização e
velocidade da compra; o latente é o regime da transação — legítima ou fraudulenta. Reparem
no padrão: em todos, o latente é justamente aquilo que a gente gostaria de saber e não
consegue medir direto.""",

6: """Este slide formaliza a estrutura com um modelo gráfico: é o mesmo desenho do slide quatro,
agora com a placa em destaque. A placa é a caixa tracejada com o N no canto inferior
direito, e ela quer dizer: tudo que está dentro se repete N vezes, uma cópia por amostra; o
que está fora, pi e teta, é global. E a topologia do grafo não é decoração: ela define
exatamente como a distribuição conjunta se fatora. A conjunta de todos os X e todos os Z é o
produto, sobre as N amostras, do prior de z vezes a condicional de x dado z. Daí saem duas
consequências. A primeira é a independência amostral, que é o que permite escrever a
verossimilhança como um produtório. A segunda é o acoplamento observado: ao marginalizar z,
as observações deixam de ser independentes, porque passam a compartilhar pi e teta. Essa
tensão é exatamente o que vai tornar a otimização difícil e motivar o algoritmo EM lá no
Bloco 3.""",

7: """Agora um detalhe de notação que parece burocrático e não é. A latente é categórica: ela diz
de qual dos K componentes a amostra veio. A gente poderia representar isso com um número de
um a K, mas em vez disso usa um vetor binário de tamanho K com exatamente um elemento igual
a um — é a codificação um-de-K, ou one-hot. O prior de pertencimento é pi_k, a probabilidade
de o componente k estar ativo, com todos os pi somando um. E aí vem o truque: escrevendo o
prior como o produtório de pi_k elevado a z_k, como todos os z_k são zero exceto um, o
produto colapsa automaticamente no pi do componente ativo. Isso parece um detalhe estético,
mas é o que vai deixar o logaritmo tratável quando a gente derivar as equações do EM.""",

8: """Esse laboratório é só pra fixar a mecânica do slide anterior, porque na primeira vez que a
gente vê aquilo parece mágica. Cliquem em qualquer um dos quatro componentes: o vetor z
muda, ficando um no componente escolhido e zero em todos os outros. E embaixo vocês veem o
produtório sendo montado termo a termo. Qualquer número elevado a zero dá um, então todos os
fatores inativos viram um e somem do produto por multiplicação. Sobra um único fator: o pi
do componente que está ligado. É só isso que a fórmula faz. A notação um-de-K é basicamente
um interruptor algébrico que liga e desliga termos dentro de um produto, e é por isso que
ela aparece em toda a literatura de modelos de mistura.""",

9: """Este é o slide que amarra a apresentação inteira, então eu peço atenção especial aqui.
Existe um tronco comum: a probabilidade de x é a soma ponderada, sobre os K componentes, de
pi_k vezes a densidade condicional daquele componente. Essa fórmula não muda. O que muda de
um método pro outro é uma única escolha: qual densidade condicional eu coloco ali dentro. Se
eu assumo variância desprezível e distância euclidiana, cai no K-Means, com atribuição
rígida. Se o espaço é binário, eu coloco uma Bernoulli, e tenho as misturas de Bernoulli. Se
o espaço é contínuo, eu coloco uma gaussiana, e tenho o GMM. À direita, os dois painéis
mostram a mesma fronteira em duas linguagens: à esquerda o plano só admite duas cores
chapadas; à direita a cor varia continuamente.""",

10: """Aqui a mesma ideia como árvore genealógica, pra registrar que isso não para nos três casos
de hoje. O tronco é sempre o mesmo, a latente um-de-K. Os ramos diferem só no domínio e na
condicional escolhida. K-Means vive no espaço real contínuo, com uma Dirac ou o limite
gaussiano quando a covariância vai a zero, atribuição rígida e custo de distorção. Bernoulli
vive no hipercubo binário, com atribuição suave e custo de log-verossimilhança. GMM vive no
contínuo com elipsóides. E o quarto ramo mostra que qualquer distribuição da família
exponencial serve: Poisson pra contagens, exponencial pra tempos entre eventos. A latente, o
Passo E por Bayes e o Passo M por máxima verossimilhança ponderada continuam idênticos em
todos eles.""",

11: """E chegamos ao conceito central do meu bloco: a responsabilidade. A pergunta é: dado que eu
observei a amostra x_n, qual a probabilidade de ela ter vindo do componente k? A resposta é
Bayes puro: no numerador, o prior pi_k vezes a verossimilhança daquele componente; no
denominador, a soma dos mesmos termos sobre todos os K componentes, que é a evidência. Esse
número, que a gente chama gama_nk, é o Passo E de todo algoritmo EM que vocês vão ver nos
próximos blocos — é literalmente a mesma fórmula, muda só a densidade que entra dentro dela.
No gráfico, arrastem o controle e vejam: quando o ponto está bem no meio de um componente, a
responsabilidade dele vai perto de um; quando cai na fronteira, as duas barras ficam
próximas de cinquenta por cento.""",

12: """Este laboratório é a mesma conta do slide anterior, mas com os números todos abertos na
tela, porque na hora da prova é assim que a gente confere. A tabela tem uma linha por
componente. Primeira coluna, o prior. Segunda, a verossimilhança daquele componente na
posição da amostra. Terceira, o produto dos dois, que é o numerador. E a quarta é a
responsabilidade, que é o numerador dividido pela soma dos numeradores. Movam o controle da
posição da amostra e acompanhem: quando ela caminha pra esquerda, a responsabilidade do
componente um sobe; quando caminha pra direita, sobe a do dois. E, aconteça o que acontecer,
a soma das duas dá exatamente um ponto zero zero zero, porque a normalização garante isso
por construção.""",

13: """Pra quem quiser reproduzir, aqui está a implementação em NumPy puro, sem biblioteca de
machine learning. São três etapas, marcadas nos comentários. Primeiro, para cada componente,
a gente avalia a densidade gaussiana multivariada — inverte a covariância, calcula o
determinante e a distância de Mahalanobis ao quadrado. Depois multiplica pelo prior, o que o
NumPy faz por broadcasting numa linha só. E por fim divide pela evidência, que é a soma
sobre os componentes com keepdims igual a True, pra manter a forma da matriz. Ao lado está a
saída real da execução: reparem na segunda amostra, que caiu na fronteira e deu quarenta por
cento contra cinquenta e nove. E na última linha, a soma de cada linha dando exatamente um.
Isso não é sorte, é a normalização.""",

14: """E aí chegamos na diferença conceitual que vai separar o bloco da Luiany dos blocos do
Antonio e da Bianca. Na atribuição suave, cada ponto distribui seu pertencimento entre todos
os clusters através de um vetor de probabilidades que soma um. A vantagem é preservar a
incerteza real nas regiões de sobreposição, e dar gradientes contínuos pra otimização. Na
atribuição rígida, o ponto pertence integralmente a um único cluster: o vencedor leva um, os
demais levam zero. A vantagem é a simplicidade e a velocidade. A desvantagem é que a
incerteza na fronteira é descartada — um ponto que estava cinquenta e um a quarenta e nove é
tratado exatamente como um ponto que estava noventa e nove a um. Essa informação some, e não
volta.""",

15: """Fechando o meu bloco, três conquistas. Primeira: o aprendizado não supervisionado busca
densidades e regularidades latentes, não rótulos. Segunda: a codificação um-de-K expressa a
incerteza de pertencimento numa notação que o logaritmo consegue tratar. Terceira: o Teorema
de Bayes converte prior vezes verossimilhança em responsabilidades, e essa é a engrenagem
que vai reaparecer em todos os métodos daqui pra frente. E fica a pergunta que abre o
próximo bloco: e se a gente eliminar as probabilidades por completo, e resolver o
agrupamento de forma puramente geométrica e determinística no espaço euclidiano? O que a
gente ganha em velocidade e o que a gente perde? Pra responder isso, eu passo a palavra pra
Luiany, que vai apresentar o K-Means. Obrigado.""",

}

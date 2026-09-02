# -*- coding: utf-8 -*-
# Bloco 3 · Antonio Carlos de Barcelos Fernandes · slides 41 a 58 · Misturas de Bernoulli e EM
FALAS = {

41: """Obrigado, Luiany. Eu sou o Antonio Fernandes e no Bloco 3 a gente ataca a dívida que ela
deixou. Olhem o tipo de dado da tabela: cada coluna é um bit, zero ou um. Isso aparece em
todo lugar: imagem preto e branco, onde o pixel acende ou não; texto, onde a palavra aparece
ou não; ficha clínica, com o sintoma marcado sim ou não. Esses dados não vivem num plano:
vivem nos vértices de um hipercubo. E o K-Means quebra de um jeito concreto: a média de um
monte de bits dá, por exemplo, zero vírgula quarenta e três. Esse número não é vértice
nenhum do cubo: não é um documento possível, nem uma imagem possível. O protótipo que o
algoritmo devolve não existe no mundo dos meus dados.""",

42: """A saída é trocar distância por probabilidade. Se cada dimensão é um bit, a distribuição
natural dela é a Bernoulli, uma moeda viciada. Então eu modelo cada grupo como D moedas
independentes, uma por dimensão — é a fórmula do slide. O mu_kd é a probabilidade daquele
bit acender dado que a amostra veio do grupo k. Leiam o produtório com calma: quando x_d é
um, sobra o mu; quando x_d é zero, sobra um menos mu. É um jeito compacto de multiplicar a
probabilidade de cada bit ter dado o que deu. E reparem: o mesmo vetor mu determina de uma
vez a média e a variância de cada bit — não existe parâmetro de dispersão separado.""",

43: """Vale insistir nessa mudança. No K-Means o mu era um ponto geométrico, um lugar no espaço;
aqui ele é uma coleção de D probabilidades de ativação. Pensem no dígito zero numa grade
oito por oito: os pixels do anel acendem quase sempre, mu perto de zero vírgula noventa e
cinco; os do buraco no meio quase nunca acendem, mu perto de zero vírgula zero cinco. Ou
seja, o protótipo não é um dígito que alguém desenhou: é um retrato borrado que responde com
que frequência cada pixel acende quando este grupo gera uma imagem.""",

44: """Pra deixar palpável, aqui dá pra desenhar. Eu clico nos quadradinhos e monto um dígito na
grade. Repare que, a cada bit que eu ligo, as barras de probabilidade ao lado se mexem na
hora: o modelo está calculando, para cada protótipo, a chance de aquele desenho ter saído
dele. Vou desenhar um zero bem feito e o componente do zero dispara; apago um pedaço e a
confiança cai, com um segundo componente disputando. É isso que a gente vai chamar de
responsabilidade: não é resposta seca, é divisão de crédito.""",

45: """Agora a dificuldade técnica do bloco. O modelo completo é uma mistura: somo, sobre os K
grupos, o peso pi_k vezes a Bernoulli daquele grupo. O caminho natural pra ajustar os
parâmetros seria a máxima verossimilhança: escrever o log, derivar, igualar a zero. Só que
olhem onde o somatório caiu — ele ficou preso dentro do logaritmo. E logaritmo de soma não
se abre: não existe identidade que separe ln de a mais b. Se os grupos fossem conhecidos, o
log entraria no produto e tudo viraria conta trivial; como não são, a derivada dá um sistema
acoplado, sem solução fechada. É esse impasse que motiva o EM.""",

46: """Esse laboratório existe só pra fixar essa pedra no caminho. À esquerda eu tenho ln de a mais
b; à direita, ln a mais ln b. Vou mexer nos valores: os dois números quase nunca batem, e a
diferença entre eles nem é constante, muda conforme os valores. Ou seja, não é um erro que
eu corrija com uma constante. Por isso a máxima verossimilhança direta trava aqui, e por
isso o EM não tenta abrir esse logaritmo: ele contorna, trocando a função difícil por uma
auxiliar que a gente sabe otimizar.""",

47: """A ideia do EM é resolver um ovo e galinha. Se eu soubesse de qual grupo veio cada amostra,
ajustar os parâmetros seria trivial: era só separar e tirar médias. E se eu soubesse os
parâmetros, descobrir o grupo seria trivial: era só aplicar Bayes. O problema é que eu não
sei nenhum dos dois. Então o EM chuta os parâmetros, usa o chute pra calcular a distribuição
sobre os grupos, e usa essa distribuição pra recalcular os parâmetros. E repete. É a mesma
alternância do Lloyd, com uma diferença crucial: lá o ponto ia inteiro pra um grupo, aqui
ele vai fracionado pra todos.""",

48: """Na mistura de Bernoulli, os dois passos ficam em fórmula fechada. No passo E eu calculo a
responsabilidade gama_nk: o peso do grupo vezes a probabilidade que ele dá pra amostra,
dividido pela soma de todos. É Bayes puro, é a posteriori que o Henrique apresentou no Bloco
1, e soma um em cada linha. No passo M eu somo as responsabilidades e obtenho N_k, o tamanho
efetivo do grupo — um número quebrado, tipo trinta e sete vírgula dois. O pi_k é esse
tamanho dividido por N, e o mu_k é a média das amostras ponderada pelas responsabilidades. É
a mesma média do K-Means, só que cada amostra entra com o peso do quanto ela pertence.""",

49: """Vamos rodar com seis amostras na unha. Aqui estão os seis vetores binários e dois
componentes com parâmetros chutados. Passo E: para cada amostra eu calculo a probabilidade
sob cada componente, multiplico pelo peso e normalizo. Olhem a tabela: essa amostra ficou
noventa e três por cento no grupo um; essa outra ficou cinquenta e dois contra quarenta e
oito, com o modelo honestamente em dúvida. Passo M: os mus se deslocam na direção das
amostras que mais os reivindicaram. Clico de novo e as dúvidas vão sumindo, com as
responsabilidades cada vez mais perto de zero e um. E o log da verossimilhança lá embaixo
sobe a cada rodada.""",

50: """E por que ele sobe sempre? Essa é a prova de convergência. Para qualquer distribuição q
sobre a latente, o log da verossimilhança se decompõe em duas parcelas exatas: uma cota
inferior, o ELBO, mais a divergência de Kullback-Leibler entre q e a posteriori verdadeira.
Como a KL nunca é negativa, o ELBO fica sempre por baixo. Agora vejam a mágica. No passo E,
eu escolho q igual à posteriori exata: isso zera a KL, e a cota encosta na curva. No passo
M, eu subo a cota mexendo nos parâmetros. Como a cota subiu e a verossimilhança está sempre
acima dela, ela também subiu. O EM nunca piora: no pior caso empata, e aí convergiu.""",

51: """Aqui está o argumento em desenho. A curva de cima é o log da verossimilhança, que eu não sei
otimizar direto; a de baixo é a cota. No passo E a cota é levantada até tocar a curva no
parâmetro atual: as duas se beijam, a KL virou zero. No passo M eu ando pro máximo da cota,
que é fácil, e o ponto escorrega pra direita. E a garantia visual é essa: como a cota nunca
ultrapassa a curva de cima e eu sempre subo a cota, a curva de cima nunca desce. E uma
consequência prática: se no seu código o log da verossimilhança cair, não é o EM, é bug.""",

52: """Agora em escala: trezentas e sessenta imagens sintéticas de oito por oito, com ruído de bit
e sem rótulo nenhum. Reparem nos protótipos ao longo das iterações — começam como puro
chuvisco e, depois de algumas rodadas, aparecem três protótipos nítidos. O algoritmo não
fazia ideia de que existiam três dígitos ali, ele só maximizou verossimilhança. E o
protótipo final é suave, com tons de cinza: isso não é defeito, é informação — o cinza diz
quais pixels são estáveis no grupo e quais variam.""",

53: """Duas coisas quebram o EM na prática, e as duas são numéricas. A primeira: se um bit nunca
acendeu no grupo k, a estimativa crava mu igual a zero exato. Aí chega uma amostra nova com
aquele bit ligado, o produtório inteiro zera, o componente declara aquela amostra impossível
e a normalização do passo E vira zero dividido por zero. A segunda: mesmo sem zeros, eu
multiplico centenas de números menores que um. O gráfico mostra o produto despencando até
atravessar o menor float64 e virar zero absoluto. Duas doenças diferentes, e uma cura pra
cada: suavização de Laplace pra primeira, espaço logarítmico pra segunda.""",

54: """A primeira cura. Em vez de estimar mu pela razão pura das contagens, eu somo
pseudo-contagens: alfa no numerador e dois alfa no denominador. Isso é o mesmo que pôr uma
priori Beta sobre o mu e tomar a moda da posteriori: não é gambiarra, é estimação bayesiana.
O efeito é simples: com alfa maior que zero, o mu nunca encosta em zero nem em um. E a
interpretação é humana: é como se eu já tivesse visto, antes dos dados, meia observação de
cada lado. Com muitos dados o alfa some no meio das contagens; com poucos, é ele que impede
uma conclusão absoluta a partir de evidência magra.""",

55: """A segunda cura é o log-sum-exp, um truque que vale pra vida inteira. O problema: eu preciso
do log da soma de exponenciais, e se os expoentes forem tipo menos oitocentos, cada
exponencial vira zero na máquina e eu acabo com log de zero, menos infinito. A solução é
fatorar o maior deles. Coloco exp do a_max em evidência, aplico o log, e ele vira a_max mais
o log da soma de exp de a_k menos a_max. O maior expoente virou exp de zero, que é um, então
a soma nunca some. É matematicamente idêntico, e é a diferença entre o código rodar e cuspir
NaN.""",

56: """Aqui dá pra ver os dois lados na mesma tela. À esquerda, o cálculo ingênuo em float64:
aumentando a dimensão, o produto cai — dez elevado a menos cem, menos duzentos, menos
trezentos — e de repente crava zero e não sai mais de lá. Morreu a informação. À direita, o
mesmo cálculo em espaço logarítmico: em vez de multiplicar eu somo logaritmos, e a linha
desce tranquila, sem degrau, porque menos setecentos é um número comum pra um float. Mesma
matemática — só que uma implementação sobrevive e a outra não.""",

57: """E aqui está tudo junto em código. Reparem que o logsumexp está implementado com o truque do
máximo e que o passo E inteiro acontece em log: eu somo log de mu e log de um menos mu,
nunca multiplico probabilidades. À direita, a saída real da execução. Gerei três protótipos
de seis bits, quarenta cópias de cada, com dez por cento dos bits invertidos por ruído. O
modelo recuperou pesos de trinta e um, trinta e quatro e trinta e cinco por cento — quase o
um terço verdadeiro. E dá pra ler o protótipo em cada linha da matriz de mus: perto de zero
vírgula nove nos bits do padrão, perto de zero vírgula zero cinco nos outros. E o log da
verossimilhança subiu de menos quinhentos e vinte e nove pra menos trezentos e trinta e
quatro, monótono, como a teoria prometia.""",

58: """Fechando o Bloco 3. O que fica é: no hipercubo binário a distribuição nativa é a Bernoulli
multivariada, e o protótipo vira um vetor de probabilidades, não um ponto no espaço. O
somatório preso no log impede solução fechada, e o EM contorna com duas atualizações
analíticas que nunca pioram a verossimilhança. E o agrupamento virou suave: cada amostra
distribui crédito, em vez de ser carimbada num grupo só. E reparem que a estrutura E-M não
tem nada de específico da Bernoulli: aquelas duas equações valem pra qualquer família, muda
só o que entra no lugar de p de x dado teta. Trocando a Bernoulli por uma gaussiana, eu
ganho o modelo pra dados contínuos, com forma, orientação, elipse. E é isso que a Bianca vai
apresentar. Bianca, é com você.""",

}

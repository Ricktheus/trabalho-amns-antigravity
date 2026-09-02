# -*- coding: utf-8 -*-
# Bloco 4 · Bianca Fernandes Visco · slides 59 a 73 · GMM, demonstração e comparação
FALAS = {

59: """Obrigada, Antonio. Eu sou a Bianca Visco e vou fechar a apresentação com o modelo mais geral
dos três: o Gaussian Mixture Model. O Antonio mostrou que o EM não é um algoritmo da
Bernoulli, é um esquema que serve pra qualquer família. Então a gente troca a peça de
dentro: no lugar da Bernoulli entra a gaussiana multivariada, e o modelo vale pra dados
contínuos. A fórmula é uma combinação convexa: os pesos pi_k são positivos e somam um, então
o resultado continua sendo uma densidade legítima. E o ganho está no segundo parâmetro de
cada componente. Antes eu tinha só o centro; agora eu tenho também a matriz de covariância
sigma_k, que carrega a forma e a orientação daquele grupo. Por isso na figura os componentes
não são bolinhas: são elipses, cada uma com seu tamanho, alongamento e inclinação.""",

60: """Vamos abrir a gaussiana multivariada em duas partes. A primeira é o termo de normalização,
esse Z embaixo da fração. O determinante de sigma mede o hipervolume do elipsóide, e ele
está ali garantindo que a integral da densidade dê exatamente um. Na prática: se o grupo é
muito espalhado, o pico tem que ser mais baixo. A segunda parte é o expoente, que é uma
forma quadrática — e essa forma quadrática é a distância de Mahalanobis ao quadrado. Reparem
no que ela substituiu: no K-Means a distância era x menos mu transposto vezes x menos mu, e
aqui entrou a inversa de sigma no meio. Esse sanduíche é a diferença entre medir distância
com uma régua igual em todas as direções e medir com uma régua que se adapta à forma da
nuvem.""",

61: """Vale destrinchar a matriz dois por dois, que é como a gente entende e depois generaliza. Na
diagonal estão as variâncias de cada eixo: sigma um ao quadrado é o quanto a nuvem se
espalha na horizontal, sigma dois ao quadrado na vertical. Fora da diagonal está a
covariância cruzada, que dá pra reescrever como rô vezes sigma um vezes sigma dois, onde rô
é a correlação, entre menos um e mais um. Duas leituras. Se rô é zero, a matriz fica
diagonal e a elipse tem os eixos alinhados com os do gráfico. Se rô é diferente de zero, a
elipse inclina: positivo pra direita, negativo pra esquerda. E a matriz precisa ser
simétrica e positiva-definida: se não for, não descreve elipse nenhuma e a densidade nem
existe.""",

62: """Aqui dá pra sentir com a mão. Tenho três controles: as duas variâncias e a correlação.
Aumento sigma um e a elipse estica na horizontal; aumento sigma dois e ela estica na
vertical. Com os dois iguais e rô zero eu tenho o círculo, que é o caso do K-Means. Agora eu
levo o rô pra mais zero vírgula oito e olhem — a elipse gira e fica inclinada, contando que
quando x um é alto, x dois também tende a ser. Puxo pro negativo e ela inclina pro outro
lado. Repare também nos eixos desenhados dentro: são os autovetores da matriz, com
comprimento igual à raiz do autovalor. É essa a decomposição espectral: a covariância é uma
rotação seguida de um esticamento.""",

63: """Agora, por que a Mahalanobis é a métrica certa. Imaginem uma nuvem alongada na diagonal e
dois pontos à mesma distância euclidiana do centro: um na direção do alongamento, outro na
direção estreita. Pra régua euclidiana, os dois são igualmente típicos. Mas não são: o que
está na direção estreita é muito mais estranho, porque naquela direção a nuvem quase não
varia. A Mahalanobis conserta isso medindo em unidades de desvio padrão local: divide cada
direção pela dispersão que os dados realmente têm ali. E o detalhe elegante é o caso
particular: se sigma for a matriz identidade, a inversa também é a identidade, o sanduíche
colapsa e a Mahalanobis vira exatamente a distância euclidiana. Ou seja, o K-Means é o caso
pobre desse modelo.""",

64: """E aqui está o argumento na tela, com uma nuvem inclinada e dois pontos de teste. Olhem os
círculos tracejados: são os contornos da euclidiana, sempre redondos, indiferentes à forma
dos dados. Agora ligo os contornos de Mahalanobis, e eles são elipses que acompanham a
nuvem. Vejam esses dois pontos: pela euclidiana, os dois estão à mesma distância. Pela
Mahalanobis, esse aqui está a uma unidade e meia, e esse outro a quase quatro. O segundo é o
ponto realmente anômalo, e só a Mahalanobis percebe. Guardem essa ideia, porque daqui a
pouco ela vira detecção de anomalia.""",

65: """O EM para GMM é o mesmo esqueleto do Bloco 3, com uma equação a mais. O passo E é idêntico:
a responsabilidade é o peso vezes a densidade gaussiana, normalizado pela soma. No passo M,
o pi_k continua sendo N_k sobre N e o mu_k continua sendo a média ponderada pelas
responsabilidades — igualzinho à Bernoulli. A novidade é a terceira equação: o sigma_k é a
matriz de covariância das amostras em torno do novo centro, também ponderada pelas
responsabilidades. É aí que mora a diferença pro K-Means, que atualiza só a posição: o GMM
atualiza posição, tamanho, alongamento e ângulo. É por isso que, na figura, as elipses não
só andam, elas também giram e mudam de proporção ao longo das iterações.""",

66: """Rodando ao vivo. No começo as elipses estão todas parecidas, mais ou menos circulares,
porque foram inicializadas assim. A cada passo E as cores dos pontos ficam misturadas,
degradê, porque um ponto na região de sobreposição realmente pertence um pouco a cada
componente. E a cada passo M as elipses se ajustam. Vejam essa aqui — ela vai esticando e
girando até se encaixar na faixa diagonal. E repare que os pontos na fronteira entre dois
grupos continuam com cor misturada até o fim. Isso não é o modelo falhando, é o modelo sendo
honesto: ali existe ambiguidade de verdade, e o GMM guarda essa informação em vez de jogar
fora.""",

67: """Mas essa flexibilidade toda tem um preço, e é uma patologia séria. Se um componente colapsar
em cima de um único ponto, o sigma dele vai a zero, o determinante vai a zero, e como o
determinante está no denominador, a densidade naquele ponto vai pro infinito. A
verossimilhança explode. E o pior é que isso é um máximo legítimo — o EM está fazendo o
trabalho dele, subindo a verossimilhança, e mesmo assim o resultado é lixo: um componente
que descreve um ponto só. Puxando o controle aqui, vocês veem a elipse encolhendo e o log da
verossimilhança disparando. A solução prática é um piso: somar épsilon vezes a identidade na
diagonal, o que no scikit-learn se chama reg_covar e vem com dez elevado a menos seis por
padrão. Isso impede o determinante de chegar a zero e mata a singularidade.""",

68: """O scikit-learn deixa escolher quanta liberdade geométrica dar, em quatro opções. Spherical:
todo componente é um círculo, praticamente um K-Means probabilístico. Diag: elipses, mas com
os eixos obrigatoriamente alinhados aos eixos do gráfico, sem inclinação. Tied: todos os
componentes têm exatamente a mesma matriz, ou seja, a mesma forma e a mesma inclinação,
mudando só o centro. E full: cada componente com a sua matriz, liberdade total. Aí entra o
critério de informação. Na tabela, o full tem mesmo a maior verossimilhança, menos mil
trezentos e cinquenta e seis, mas gasta dezessete parâmetros. O tied tem verossimilhança
quase igual com onze parâmetros, e por isso ele ganha, com BIC dois mil setecentos e oitenta
e oito, que é o menor da coluna — é essa a célula destacada. Faz sentido: esses dados foram
gerados com elipses de mesma forma, então o tied é exatamente o modelo certo, e pagar por
seis parâmetros a mais não compensa.""",

69: """Aqui dá pra varrer sozinho: eu escolho o tipo de covariância e o K, e a curva de BIC se
redesenha. Reparem que ela tem um mínimo bem definido, diferente da inércia do K-Means, que
só caía. É essa a vantagem do BIC: o termo de penalidade, p vezes log de N, cresce com o
número de parâmetros, então em algum ponto ele passa a dominar o ganho de ajuste. Aumentando
o K além do verdadeiro, olhem: o BIC sobe. O modelo está dizendo, com número, que eu estou
complicando à toa. E comparando os tipos: os mais flexíveis ganham em verossimilhança e
perdem em penalidade, e quem vence depende de como os dados realmente são.""",

70: """Agora a demonstração que amarra tudo: mesmo conjunto, três faixas alongadas e inclinadas,
dois algoritmos. À esquerda o K-Means com n_init igual a dez, ou seja, dez semeaduras
ficando com a melhor: ele corta as faixas transversalmente e atinge sessenta e três por
cento de pureza. E não adianta rodar mais vezes: o problema não é inicialização, é a
hipótese — fronteiras de Voronoi são retas, e faixas inclinadas não se separam assim. À
direita, o GMM com covariance_type full, e o resultado é cem por cento. As elipses
simplesmente abraçam cada faixa. E reparem no código: são quatro linhas de scikit-learn,
praticamente a mesma interface. O que mudou não foi a dificuldade de implementar, foi a
hipótese sobre a forma dos grupos.""",

71: """E tem um bônus que só o GMM entrega, por ser generativo: detecção de anomalia. Como eu tenho
a densidade p de x em todo ponto do plano, posso fixar um limiar tau e declarar anomalia
tudo que cair abaixo dele. Arrastando a amostra de teste pra dentro da nuvem: densidade
alta, padrão normal. Levo pra região vazia entre os grupos e a densidade despenca,
disparando o alerta. E agora o limiar. Repare na área sombreada e na curva que marca p de x
igual a tau: quando eu aumento o ln de tau, a fronteira se abre e o modelo fica mais
rigoroso, condenando mais região do plano como anômala; quando eu diminuo, a fronteira se
fecha e ele fica mais permissivo. É exatamente o trade-off entre falso positivo e falso
negativo, e ele fica visível aqui.""",

72: """Esse quadro resume os três métodos lado a lado. Domínio: K-Means e GMM em espaço contínuo,
Bernoulli no hipercubo binário. Hipótese: hiperesferas, Bernoullis independentes,
elipsóides. Atribuição: rígida no K-Means, suave nos outros dois. Critério: o K-Means
minimiza uma inércia, os modelos de mistura maximizam uma verossimilhança. E a linha mais
importante é a da capacidade generativa. O K-Means não tem: ele particiona, mas não sabe
gerar um dado novo nem dizer o quanto um dado é provável. Os modelos de mistura têm, e é daí
que saem coisas como detecção de anomalia, imputação de valores faltantes e amostragem
sintética. A regra prática é simples: se os grupos são redondos, parecidos e você quer
velocidade, K-Means resolve; se tem forma, sobreposição ou você precisa de incerteza, vá de
mistura.""",

73: """Pra fechar, três mensagens. Primeira: é tudo um arcabouço só — a variável latente discreta
está por trás dos três métodos, muda só o que a gente assume sobre como os dados nascem.
Segunda: o K-Means é rápido e continua ótimo pra muita coisa, mas descarta a incerteza e
impõe esferas, e isso cobra um preço quando os dados têm forma. Terceira: o EM dá modelos
que descrevem a incerteza e ainda são generativos. E olhem a fórmula do elo formal, que é o
fecho mais bonito do trabalho: se você fixa todas as covariâncias em épsilon vezes a
identidade, iguala os pesos e faz épsilon tender a zero, as responsabilidades suaves
colapsam em zero e um, e o EM vira, literalmente, o algoritmo de Lloyd. Ou seja, o K-Means
não é um método diferente: é o caso-limite determinístico do GMM. As referências principais
são o Bishop, capítulo nove, e a documentação do scikit-learn. Era isso. Muito obrigada pela
atenção, e estamos abertos às perguntas.""",

}

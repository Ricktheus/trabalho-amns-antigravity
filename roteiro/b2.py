# -*- coding: utf-8 -*-
# Bloco 2 · Luiany Gonçalves Carvalho · slides 16 a 34 · K-Means
FALAS = {

16: """Obrigada, Henrique. Meu nome é Luiany Carvalho e eu vou conduzir o Bloco 2, que é onde a
gente coloca a mão na massa com o primeiro algoritmo de agrupamento: o K-Means. Ele é a
versão mais crua da ideia de variável latente. Eu escolho um número K de grupos, represento
cada grupo por um único ponto, o centróide, e todo mundo pertence ao centróide mais perto.
Olhem a figura: quando eu fixo os centróides, o espaço se reparte sozinho em células de
Voronoi, com fronteiras equidistantes entre centros vizinhos. E guardem uma palavra que vai
voltar o tempo todo: a atribuição aqui é rígida. O r_nk vale zero ou um. É justamente isso
que o Bloco 4 vai relaxar.""",

17: """Pra escolher centróides eu preciso de um critério que diga que uma escolha é melhor que a
outra: a função de distorção, também chamada de inércia. A fórmula assusta, mas leiam em
português: pra cada ponto pego a distância até o centróide do grupo dele, elevo ao quadrado
e somo tudo. Então J é literalmente a soma dos tracejados do desenho — quanto menor, mais
grudados os pontos estão nos seus centros. E aqui aparece o problema: J depende de duas
coisas ao mesmo tempo, de quem pertence a quem e de onde estão os centros. Testar todas as
combinações é NP-difícil, então a gente vai de estratégia iterativa.""",

18: """Antes do algoritmo, vamos calcular esse J na mão, porque quando a gente calcula uma vez fica
muito mais concreto. Para cada ponto eu meço a distância até cada centro, elevo ao quadrado,
escolho a menor, que é a que entra na conta, e vou acumulando. E olhem: quando eu movo um
centróide pro miolo do seu grupo, o total despenca. É essa a intuição que o algoritmo
explora — toda decisão daqui pra frente só vale se derrubar esse número.""",

19: """O algoritmo de Lloyd resolve o impasse com um truque simples: como é difícil otimizar as
duas coisas juntas, ele congela uma e otimiza a outra, alternando. Na atribuição eu fixo os
centróides e pergunto pra cada ponto qual o centro mais perto; cada ponto decide sozinho. Na
atualização eu faço o contrário: congelo as atribuições e pergunto onde o centro deveria
estar, e a resposta é a média do grupo. Duas garantias: cada passo, sozinho, nunca aumenta o
J; e como o número de partições é finito, o algoritmo obrigatoriamente para. Ele converge
sempre — só que pra um mínimo local, não necessariamente pro melhor de todos.""",

20: """Eu disse que o centro ótimo é a média; vamos provar isso. Fixando as atribuições, o custo do
cluster depende só do mu dele. Abro o quadrado e sobram três termos: um que não depende de
mu, um cruzado e um quadrático. Derivo, igualo a zero, e o termo constante some. Sobra uma
equação linear: a soma dos pontos menos N_k vezes mu igual a zero. Isolando, mu é a média
aritmética. E a segunda derivada dá dois vezes N_k, sempre positivo, então é mínimo mesmo. A
média não é bom senso, ela cai da matemática.""",

21: """Essa mesma prova, agora em desenho e em uma dimensão só. O eixo horizontal é onde eu coloco
o centróide e o vertical é o custo. Conforme eu arrasto o centro, a curva desenha uma
parábola com a boca pra cima — e tem que ser parábola, porque J é soma de termos quadráticos
em mu. Reparem que o fundo dela, onde a tangente fica horizontal, cai exatamente em cima da
média dos pontos. Se eu empurro pra qualquer lado, a derivada deixa de ser zero e o custo
sobe.""",

22: """Agora vamos separar bem os dois meios-passos, porque é aqui que muita gente se confunde. Vou
clicar e só atribuir: os centros ficam parados e são as cores que mudam. Clico de novo e só
atualizo: as cores param e os centros se deslocam pro meio das suas nuvens. Percebam o
padrão — a cada meio-passo o J cai, ou no máximo empata, mas nunca sobe. É a descida
alternada acontecendo na frente de vocês. E o movimento vai ficando menor até que um clique
não muda mais nada: quando nenhum ponto troca de cor, convergiu.""",

23: """Aqui a mesma coisa numa escala maior: duzentos e setenta pontos, três grupos, com o
algoritmo rodando de verdade dentro do navegador. À esquerda, a trajetória dos centróides,
que sai de uma posição aleatória e caminha até o coração de cada nuvem. À direita, a curva
do J. Olhem o formato: despenca da primeira pra segunda iteração e depois vira quase uma
reta. Na prática o K-Means resolve quase tudo nas duas ou três primeiras rodadas e o resto é
ajuste fino. O custo de cada iteração é linear no número de pontos: por isso um algoritmo
dos anos setenta segue rodando em conjuntos gigantes.""",

24: """Até agora eu venho dizendo "escolho K" como se fosse trivial, e não é. Tem uma armadilha
séria: o J sempre melhora quando o K aumenta. Se eu botar K igual ao número de pontos, cada
ponto vira seu próprio centro e o J dá zero — inércia perfeita e informação nenhuma. O
primeiro critério é o cotovelo, à esquerda: procuro onde a curva para de despencar, porque
dali pra frente eu pago um grupo a mais e ganho quase nada. O segundo é a silhueta, à
direita, e essa tem um pico de verdade. Aqui os dois apontam pro mesmo K igual a quatro —
quando eles concordam, a gente fica bem mais tranquila.""",

25: """Vale abrir a silhueta, porque a fórmula é intuitiva. Para um ponto i, o a de i é a distância
média dele até os colegas do mesmo cluster: é a coesão, o quanto ele está em casa. O b de i
é a distância média até o cluster vizinho mais próximo, ou seja, o concorrente mais
perigoso. A silhueta é a diferença entre os dois dividida pelo maior deles, espremendo tudo
entre menos um e mais um. Perto de mais um, ponto bem classificado. Perto de zero, ele está
em cima da fronteira. E se der negativo é alarme: aquele ponto está mais perto do grupo
vizinho do que do grupo dele.""",

26: """Agora dá pra brincar com o K ao vivo. Vou arrastar de um até oito. Com K igual a um, o J é
enorme, é a variância total dos dados. Puxando pra dois, três, quatro, a queda é bem
visível. Passou do quatro, reparem: o J continua caindo, sim, mas devagarzinho, e é aí que a
silhueta começa a desabar, porque eu comecei a rachar grupos que eram um só. O cotovelo diz
quando parar de ganhar; a silhueta diz quando começar a perder.""",

27: """Duas coisas estragam o K-Means silenciosamente, sem dar erro, entregando um resultado bonito
e errado. A primeira é a inicialização. À esquerda, uma semeadura infeliz: dois centros
nasceram dentro da mesma nuvem e brigam pra dividir aquele grupo, enquanto duas nuvens de
verdade lá longe ficaram fundidas num centro só. E ele convergiu: não tem nada quebrado, só
caiu num mínimo local ruim. À direita, os mesmos dados semeados de outro jeito, e os grupos
aparecem certinhos. A ideia do k-means++ é espalhar os centros iniciais de propósito: cada
novo centro é sorteado com probabilidade proporcional ao quadrado da distância até o centro
mais próximo que já existe.""",

28: """Deixa eu detalhar essa semeadura. O primeiro centro é sorteado uniformemente. Depois, pra
cada ponto eu calculo D de x, a distância até o centro mais próximo já escolhido, e sorteio
o próximo com probabilidade proporcional a D ao quadrado. Duas perguntas sempre aparecem.
Por que sortear, e não pegar o ponto mais distante? Porque o mais distante costuma ser um
outlier, e o determinístico sentaria um centróide em cima de ruído. E por que ao quadrado?
Porque o quadrado exagera a diferença: uma região duas vezes mais longe fica quatro vezes
mais provável.""",

29: """Aqui está essa roleta funcionando. Cada ponto do gráfico virou uma fatia da barra de
probabilidade lá embaixo, e o tamanho da fatia é o D ao quadrado dele. Coloquei o primeiro
centro aqui, e reparem: todos os pontos perto dele encolheram até quase sumir da barra, e as
nuvens distantes ficaram com fatias enormes. Vou sortear: caiu numa nuvem longe, como era
esperado — não garantido, mas muito mais provável. Na terceira rodada, a única que ainda tem
massa na roleta é justamente a nuvem que falta.""",

30: """O segundo modo silencioso de errar é a escala, e esse é mais traiçoeiro porque não depende
de sorte: ele erra sempre. A distância euclidiana soma os quadrados das diferenças de cada
atributo. Imaginem uma tabela com salário anual e idade. Cinquenta mil reais ao quadrado dá
dois vírgula cinco vezes dez elevado a nove; quarenta anos ao quadrado dá mil e seiscentos.
O termo da idade é um milhão de vezes menor — existe na fórmula, mas não influencia nada.
Você achou que agrupava por perfil e agrupou por faixa salarial. A correção é padronizar com
z-score, e ajustar o scaler só no treino, senão você vaza informação.""",

31: """Esse é o K-Means inteiro escrito do zero, e cabe em vinte e cinco linhas de NumPy. Destaco a
linha do broadcasting: esse X com newaxis menos os centróides monta de uma vez só todas as N
vezes K diferenças, sem nenhum laço em Python. À direita está a saída real da execução.
Gerei três nuvens gaussianas centradas em menos quatro menos dois, zero e três, e quatro
menos um. Ele convergiu em quatro iterações e recuperou os três centros com erro abaixo de
zero vírgula três. Os tamanhos deram sessenta, sessenta e um e cinquenta e nove: dois pontos
de fronteira trocaram de grupo, o que é esperado quando as nuvens se encostam.""",

32: """Uma aplicação que fecha bem o bloco: quantização de cores. Numa imagem, cada pixel é um
ponto em três dimensões — vermelho, verde e azul. Se eu rodo K-Means nesse espaço com K
igual a dezesseis, acho as dezesseis cores que melhor representam a imagem inteira e troco
cada pixel pela cor do seu centróide. Com K bem baixo a imagem fica cartunizada, aparecem
blocos chapados; aumentando o K ela volta ao normal, e por volta de trinta e duas cores o
olho quase não distingue do original.""",

33: """E agora a parte mais importante do meu bloco: onde esse algoritmo quebra. O K-Means tem uma
hipótese geométrica escondida na própria definição: como só usa distância euclidiana até o
centróide, ele acredita que todo grupo é uma bolinha redonda e que todas têm mais ou menos o
mesmo tamanho. Quando isso não vale, ele erra feio. À esquerda, faixas diagonais alongadas:
as fronteiras de Voronoi são retas, então ele corta as faixas atravessado. À direita,
densidades desiguais: ele fatia o grupo largo e funde os dois compactos, porque isso dá um J
menor. E tem um terceiro caso: em vetores de zeros e uns, a distância euclidiana perde o
sentido e a média vira um número quebrado que não representa objeto nenhum.""",

34: """Fechando o Bloco 2. O que fica é: o Lloyd minimiza a inércia por descida alternada, com
convergência garantida mas local; a escolha do K precisa de cotovelo e silhueta juntos; e a
semeadura k-means++ com a padronização decidem se o resultado presta ou não. E fica a dívida
do slide anterior. As três falhas têm a mesma raiz: atribuição rígida e distância
euclidiana, sem nenhuma noção de forma, de espalhamento, de incerteza. A saída é trocar
distância por probabilidade: em vez de perguntar qual centro está mais perto, perguntar qual
distribuição tem mais chance de ter gerado aquele ponto. E é isso que o Antonio vai
apresentar agora, com as misturas de Bernoulli e o algoritmo EM. Antonio, é com você.""",

}

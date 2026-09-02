# -*- coding: utf-8 -*-
FALAS = {

2: """Antes de entrar no conteúdo em si, deixa eu mostrar rapidamente este decodificador,
porque ele resolve um problema real: a notação. Boa parte da dificuldade em aprendizado
não supervisionado não está na ideia, está em ler a fórmula. Então aqui a gente listou os
símbolos que vão aparecer o tempo todo no trabalho — o somatório, o produtório, o vetor z,
a responsabilidade gama, a matriz sigma maiúsculo, o logaritmo natural, o argumento do
mínimo e a transposta. Se vocês clicarem em qualquer um deles, aparece do lado a tradução
em português comum, um exemplo com números e onde exatamente aquele símbolo aparece na
nossa apresentação. A ideia é simples: nenhum símbolo daqui pra frente vai ser usado sem
que a gente já tenha combinado o que ele significa.""",

3: """Aqui a gente relembra o mínimo de álgebra linear que o trabalho exige. São três coisas.
Primeira: um vetor é só uma lista ordenada de números — nesse caso duas coordenadas, que
dá pra arrastar nos controles e ver o ponto se mexendo no gráfico. Segunda: a transposta,
esse T pequenininho no expoente, só está dizendo que o vetor deitou de linha pra coluna,
ou o contrário. Ela existe pra que a multiplicação de matrizes feche. E terceira, a mais
importante pra gente: a norma euclidiana, que é o comprimento da flecha, e a distância
entre dois pontos, que é a norma da diferença. Quando a gente falar em ‘ponto mais próximo
do centróide’, no bloco de K-Means, é exatamente essa conta que está por trás. Nada além
disso.""",

4: """Estatística agora, também no essencial. A média mu é o centro de massa dos dados: soma
tudo e divide por N. A variância sigma ao quadrado é a média dos desvios ao quadrado em
relação a essa média — em português, o quanto os dados espalham. E o desvio padrão é só a
raiz da variância, pra voltar pra unidade original. Aqui vocês podem arrastar os cinco
pontos e ver as três contas se atualizarem junto com a curva normal correspondente.
Reparem numa coisa: a curva sempre fica centrada na média e a largura dela é governada
pelo desvio padrão. Guardem essa imagem, porque no Bloco 4 essa mesma curva vai virar um
elipsóide em duas dimensões, e a variância vai virar uma matriz de covariância.""",

5: """Estas duas regras são a base de tudo que vem depois. A regra do produto diz que a
probabilidade conjunta de x e z é a probabilidade de z vezes a probabilidade de x dado z.
Ou seja: primeiro sorteia a causa, depois sorteia o efeito dado a causa. E a regra da soma,
que é a marginalização, diz que se eu quero a probabilidade de observar x sozinho, eu somo
sobre todos os cenários possíveis da causa oculta z. Essa é literalmente a fórmula do
modelo de mistura, só que ainda sem esse nome. No laboratório ao lado a gente montou um
cenário clínico: um paciente com um sintoma que pode vir de gripe ou de alergia. Movendo os
controles, vocês veem a evidência total sendo montada como uma soma ponderada.""",

6: """Agora Bayes, com números na mão. A pergunta muda de direção: em vez de perguntar qual a
chance do sintoma dado a doença, eu pergunto qual a chance da doença dado que eu vi o
sintoma. É a inversão. E a mecânica é sempre a mesma: pega o prior, multiplica pela
verossimilhança, e divide pela soma de todos os numeradores. Essa divisão é o que garante
que as duas hipóteses somem cem por cento. Olhem o gráfico da direita: em cima, as duas
densidades ponderadas, e a linha vertical mostrando onde a amostra caiu. Embaixo, essas
mesmas duas alturas normalizadas, virando uma barra que fecha em um. Eu quero que vocês
guardem essa imagem, porque esse número que sai daqui tem nome — chama responsabilidade — e
ele vai voltar em todos os blocos.""",

7: """E pra fechar o nivelamento, a máquina geradora. Isso aqui é o modelo de mistura andando
de trás pra frente. Em vez de olhar um dado e perguntar de onde ele veio, a gente sorteia
de onde ele vem e aí gera o dado. Passo um: sorteia qual componente, com probabilidade pi.
Passo dois: dado o componente, sorteia a amostra da distribuição daquele componente.
Cliquem em ‘sortear’ algumas vezes e reparem que os pontos vão caindo, e o histograma que
eles formam vai convergindo exatamente pra curva teórica desenhada por cima. Isso é o que
significa dizer que um modelo de mistura é generativo: ele não só separa os dados, ele sabe
produzir dados novos parecidos com os originais. Feito o nivelamento, vamos ao conteúdo.""",

}

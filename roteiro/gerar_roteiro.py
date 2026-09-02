# -*- coding: utf-8 -*-
"""Gera o roteiro de fala (HTML pronto para virar PDF) a partir de index.html.

Os títulos, o bloco e o tipo de cada slide são lidos do próprio index.html, de
modo que o roteiro nunca sai de sincronia com a apresentação. O texto falado
vive em b1.py … b4.py, um dicionário FALAS por bloco.

    python3 roteiro/gerar_roteiro.py            # escreve roteiro/roteiro.html
    node    roteiro/gerar_pdf.js                # imprime roteiro-apresentacao.pdf
"""
import html
import json
import os
import re
import sys

AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.dirname(AQUI)
sys.path.insert(0, AQUI)

import b1, b2, b3, b4  # noqa: E402

PPM = 135  # palavras por minuto — ritmo de fala usado no planejamento

BLOCOS = [
    (1, b1, 'Bloco 1', 'Henrique Matheus Mendonça de Miranda', 'Fundamentos e variáveis latentes'),
    (2, b2, 'Bloco 2', 'Luiany Gonçalves Carvalho', 'K-Means clustering'),
    (3, b3, 'Bloco 3', 'Antonio Carlos de Barcelos Fernandes', 'Misturas de Bernoulli e EM'),
    (4, b4, 'Bloco 4', 'Bianca Fernandes Visco', 'GMM, demonstração e comparação'),
]

TIPOS = {'nucleo': 'núcleo', 'aprofundamento': 'aprofundamento', 'abertura': 'abertura'}

GREGAS = [
    (r'\\boldsymbol\\mu', 'μ'), (r'\\boldsymbol\\Sigma', 'Σ'), (r'\\boldsymbol\\theta', 'θ'),
    (r'\\boldsymbol\\pi', 'π'), (r'\\Sigma', 'Σ'), (r'\\sigma', 'σ'), (r'\\mu', 'μ'),
    (r'\\gamma', 'γ'), (r'\\rho', 'ρ'), (r'\\tau', 'τ'), (r'\\pi', 'π'), (r'\\theta', 'θ'),
    (r'\\epsilon', 'ε'), (r'\\alpha', 'α'), (r'\\beta', 'β'), (r'\\lambda', 'λ'),
    (r'\\propto', '∝'), (r'\\neq', '≠'), (r'\\to', '→'), (r'\\ln', 'ln'), (r'\\max', 'max'),
    (r'\\min', 'min'), (r'\\mid', '|'), (r'\\top', 'T'), (r'\\,', ' '), (r'\;', ' '),
    (r'\\\|', '‖'), (r'\\in', '∈'), (r'\\times', '×'), (r'\\le', '≤'), (r'\\ge', '≥'),
]


def tex_para_texto(s):
    """Converte o LaTeX inline dos títulos em HTML legível (sem KaTeX)."""
    s = re.sub(r'\\[\(\)\[\]]', '', s)
    s = re.sub(r'\\mathbf\{([^}]*)\}', r'\1', s)
    s = re.sub(r'\\mathcal\{([^}]*)\}', r'\1', s)
    s = re.sub(r'\\mathrm\{([^}]*)\}', r'\1', s)
    s = re.sub(r'\\text\{([^}]*)\}', r'\1', s)
    for pat, rep in GREGAS:
        s = re.sub(pat + r'(?![A-Za-z])', rep, s)
    s = html.escape(s)
    s = re.sub(r'\^\{([^}]*)\}', r'<sup>\1</sup>', s)
    s = re.sub(r'\^(\w)', r'<sup>\1</sup>', s)
    s = re.sub(r'_\{([^}]*)\}', r'<sub>\1</sub>', s)
    s = re.sub(r'_(\w)', r'<sub>\1</sub>', s)
    return s.replace('{', '').replace('}', '').replace('\\', '')


def ler_slides():
    """(numero -> {bloco, tipo, titulo}) extraído de index.html."""
    fonte = open(os.path.join(RAIZ, 'index.html'), encoding='utf-8').read()
    saida = {}
    padrao = re.compile(
        r'<section class="slide[^"]*" id="slide-(\d+)"([^>]*)>(.*?)<h([12]) class="s-title">(.*?)</h\4>',
        re.S)
    for m in padrao.finditer(fonte):
        attrs = m.group(2)
        bloco = re.search(r'data-member-id="(\d+)"', attrs)
        tipo = re.search(r'data-type="([\w-]+)"', attrs)
        saida[int(m.group(1))] = {
            'bloco': int(bloco.group(1)) if bloco else -1,
            'tipo': tipo.group(1) if tipo else '',
            'titulo': tex_para_texto(re.sub(r'<[^>]+>', '', m.group(5)).strip()),
        }
    return saida


def mmss(palavras):
    seg = round(palavras / PPM * 60)
    return '%d:%02d' % (seg // 60, seg % 60)


def paragrafos(texto):
    """Quebra a fala em parágrafos curtos, para o apresentador achar a linha."""
    frases = re.split(r'(?<=[.!?])\s+', ' '.join(texto.split()))
    blocos, atual = [], []
    for f in frases:
        atual.append(f)
        if sum(len(x.split()) for x in atual) >= 45:
            blocos.append(' '.join(atual))
            atual = []
    if atual:
        blocos.append(' '.join(atual))
    return blocos


CSS = """
@page { size: A4; margin: 17mm 15mm 15mm 15mm; }
* { box-sizing: border-box; }
body { margin: 0; font-family: "DejaVu Sans", "Liberation Sans", Arial, sans-serif;
       color: #16191f; font-size: 10.5pt; line-height: 1.5; }
h1, h2, h3 { margin: 0; font-weight: 700; }
.capa { height: 258mm; display: flex; flex-direction: column; justify-content: center;
        page-break-after: always; }
.capa .eyebrow { font-size: 10pt; letter-spacing: .18em; text-transform: uppercase;
                 color: #6b7280; margin-bottom: 10mm; }
.capa h1 { font-size: 26pt; line-height: 1.2; letter-spacing: -.02em; }
.capa .sub { font-size: 13pt; color: #374151; margin-top: 4mm; }
.capa hr { border: 0; border-top: 2px solid #16191f; margin: 9mm 0 7mm; }
table.resumo { width: 100%; border-collapse: collapse; font-size: 10pt; margin-top: 3mm; }
table.resumo th { text-align: left; font-size: 8.5pt; letter-spacing: .08em;
                  text-transform: uppercase; color: #6b7280; padding: 0 6px 4px 0;
                  border-bottom: 1px solid #d1d5db; }
table.resumo td { padding: 4px 6px 4px 0; border-bottom: 1px solid #eceef1;
                  vertical-align: top; }
table.resumo td.num { text-align: right; font-variant-numeric: tabular-nums;
                      white-space: nowrap; }
.nota { font-size: 9pt; color: #6b7280; margin-top: 7mm; line-height: 1.55; }

.bloco-capa { page-break-before: always; padding-top: 22mm; page-break-after: avoid; }
.bloco-capa .kicker { font-size: 9pt; letter-spacing: .2em; text-transform: uppercase;
                      color: #6b7280; }
.bloco-capa h2 { font-size: 21pt; margin-top: 3mm; letter-spacing: -.01em; }
.bloco-capa .quem { font-size: 13pt; color: #1f2937; margin-top: 3mm; font-weight: 600; }
.bloco-capa .meta { font-size: 9.5pt; color: #6b7280; margin-top: 4mm;
                    border-top: 2px solid #16191f; padding-top: 3mm; }

.slide { page-break-inside: avoid; margin-top: 7mm; padding-bottom: 5mm;
         border-bottom: 1px solid #e5e7eb; }
.slide .cab { display: flex; align-items: baseline; gap: 8px; margin-bottom: 2.5mm; }
.slide .n { font-size: 8.5pt; font-weight: 700; letter-spacing: .1em; color: #ffffff;
            background: #16191f; padding: 2px 7px; border-radius: 2px; white-space: nowrap; }
.slide .tipo { font-size: 8pt; letter-spacing: .1em; text-transform: uppercase;
               color: #6b7280; }
.slide .dur { margin-left: auto; font-size: 8.5pt; color: #6b7280;
              font-variant-numeric: tabular-nums; white-space: nowrap; }
.slide h3 { font-size: 11pt; line-height: 1.35; margin-bottom: 2.5mm; }
.slide p { margin: 0 0 2.6mm; font-size: 10.5pt; line-height: 1.62; text-align: justify; }
.slide p:last-child { margin-bottom: 0; }
sub, sup { font-size: .72em; }
"""


def gerar():
    slides = ler_slides()
    partes = []
    total_palavras = 0
    linhas_resumo = []
    for _, mod, nome, pessoa, tema in BLOCOS:
        p = sum(len(v.split()) for v in mod.FALAS.values())
        total_palavras += p
        linhas_resumo.append((nome, pessoa, tema, len(mod.FALAS), p, mmss(p)))

    resumo = '\n'.join(
        '<tr><td><b>%s</b></td><td>%s</td><td>%s</td><td class="num">%d</td>'
        '<td class="num">%d</td><td class="num">%s</td></tr>' % r for r in linhas_resumo)

    partes.append("""
<div class="capa">
  <div class="eyebrow">Roteiro de fala · texto integral</div>
  <h1>Variáveis Latentes Discretas</h1>
  <div class="sub">K-Means, Misturas de Bernoulli e Gaussian Mixture Models</div>
  <hr>
  <table class="resumo">
    <tr><th>Bloco</th><th>Apresentador</th><th>Tema</th><th class="num">Slides</th>
        <th class="num">Palavras</th><th class="num">Duração</th></tr>
    %s
    <tr><td colspan="3"><b>Total</b></td><td class="num"><b>%d</b></td>
        <td class="num"><b>%d</b></td><td class="num"><b>%s</b></td></tr>
  </table>
  <div class="nota">
    Cada entrada abaixo é o texto falado do slide correspondente, escrito em linguagem
    coloquial de apresentação. As durações são estimadas a %d palavras por minuto, ritmo
    confortável de fala em português para conteúdo técnico — quem fala mais devagar deve
    somar cerca de 10%%. Os quatro blocos ficam entre 12 e 15 minutos cada.
  </div>
</div>""" % (resumo, sum(r[3] for r in linhas_resumo), total_palavras,
             mmss(total_palavras), PPM))

    for _, mod, nome, pessoa, tema in BLOCOS:
        nums = sorted(mod.FALAS)
        p = sum(len(v.split()) for v in mod.FALAS.values())
        partes.append(
            '<div class="bloco-capa"><div class="kicker">%s</div><h2>%s</h2>'
            '<div class="quem">%s</div>'
            '<div class="meta">Slides %d–%d · %d slides · %d palavras · ≈ %s de fala</div></div>'
            % (nome, html.escape(tema), html.escape(pessoa),
               nums[0], nums[-1], len(nums), p, mmss(p)))
        for n in nums:
            info = slides.get(n, {'titulo': '(slide %d)' % n, 'tipo': ''})
            fala = mod.FALAS[n]
            corpo = '\n'.join('<p>%s</p>' % html.escape(par) for par in paragrafos(fala))
            partes.append(
                '<div class="slide"><div class="cab"><span class="n">SLIDE %02d</span>'
                '<span class="tipo">%s</span><span class="dur">%d palavras · ≈ %s</span></div>'
                '<h3>%s</h3>%s</div>'
                % (n, TIPOS.get(info['tipo'], info['tipo']), len(fala.split()),
                   mmss(len(fala.split())), info['titulo'], corpo))

    doc = ('<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">'
           '<title>Roteiro de fala · Variáveis Latentes Discretas</title>'
           '<style>%s</style></head><body>%s</body></html>' % (CSS, '\n'.join(partes)))

    destino = os.path.join(AQUI, 'roteiro.html')
    open(destino, 'w', encoding='utf-8').write(doc)
    print('roteiro.html gerado · %d slides · %d palavras · %s'
          % (sum(len(m.FALAS) for _, m, _, _, _ in BLOCOS), total_palavras, mmss(total_palavras)))
    return destino


if __name__ == '__main__':
    gerar()

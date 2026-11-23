# Prompts usados para construir o "Posso Faltar?"

O app foi desenvolvido com o **Claude Code** (assistente de programação com IA), a partir dos
prompts abaixo, em ordem cronológica.

> **Sobre a origem de cada prompt**
>
> - **Original**: copiado literalmente do histórico da conversa.
> - **Reconstruído**: a conversa em que o app foi criado não ficou salva. O texto foi reescrito
>   a partir do resultado (código, README e histórico do git) e representa o que foi pedido,
>   não as palavras exatas.

---

## Fase 1: criação do app (21/11/2026)

### 1. Ideia e criação do app (reconstruído)

```
Preciso fazer um app mobile para a AT2-N2 de Desenvolvimento Mobile. A entrega é um vídeo de
uns 30 segundos e uma apresentação em sala. A nota considera se resolve um problema real,
UI/UX e funcionamento.

Minha ideia é o "Posso Faltar?": um app para estudantes controlarem as faltas e as notas da
faculdade e descobrirem se podem faltar sem reprovar. Quero fazer em React Native com Expo
(Expo Router e TypeScript), rodando no Expo Go, sem backend: tudo salvo no celular.

Funcionalidades:
- Cadastro de matérias: nome, professor, cor, dias da semana com aula e quantas aulas por dia,
  total de aulas no semestre e frequência mínima (normalmente 75%).
- Tela "Hoje" que responde "Posso faltar hoje?" (sim / pode, mas com cuidado / não),
  considerando todas as matérias do dia, com botões "Fui" e "Faltei".
- Poder tocar em outro dia da semana para simular se posso faltar nele.
- Por matéria: quantas faltas ainda posso ter, em aulas e em dias, e um histórico.
- Notas: lançar N1 e N2 e ver quanto preciso tirar para passar.
- Situação de cada matéria por cores (tranquilo, atenção, no limite, reprovado).
- Dados de exemplo para eu conseguir gravar o vídeo.

Capriche na interface: modo claro e escuro, vibração nos toques e ícones nativos.
Todos os textos em português.
```

### 2. Ajustes e testes (reconstruído)

```
Teste o app na web, no modo claro e escuro, e corrija o que estiver quebrado. Confirme que os
bundles de Android e iOS compilam e escreva um README explicando o problema, a solução, as
funcionalidades e como o cálculo de faltas e notas funciona.
```

### 3. Documentação para o assistente (reconstruído)

```
/init
Crie um CLAUDE.md com o contexto do projeto: stack, estrutura de pastas, regras de negócio,
convenções de UI e os problemas que já encontramos, para as próximas sessões.
```

---

## Fase 2: adaptação à minha faculdade (21/11/2026)

### 4. Entender o projeto (original)

```
o que você sabe sobre este projeto?
```

### 5. Faltas desde agosto e sistema de notas da faculdade (original)

```
ta, quero que você faça algumas mudanças, por exemplo. Para ja poder simular minhas faltas no
final do semestre, habilite para eu marcar minhas faltas desde o começo do semestre, em agosto.
Também mude o jeito das notas, na minha faculdade a media é 6,75. Mas so posso colocar 6,5 ou 7.
E por exemplo, a N1 posso tirar ate 4,5, na N2 a mesma coisa, e tem o "ppd" que vale 1 ponto.
Faça focado no padrao da minha faculdade por enquanto, ja que ate agora ele é academico, dps se
eu for expandir ele, ai melhoro a questao das notas.
```

**Resultado:**
- O registro de faltas e presenças virou um calendário por mês, que vai do começo do semestre
  (1º de agosto) até hoje.
- As notas passaram a ser uma soma: N1 vale até 4,5, N2 até 4,5 e PPD até 1, e a média para
  passar é 6,75.
- Os dados já salvos no formato antigo são convertidos automaticamente.

---

## Fase 3: entrega (22/11/2026)

### 6. Este documento (original)

```
gere um arquivo colocando os prompts usados na conversa para fazer esse app. Eu preciso entregar
para o meu superior os prompts que usei para montar esse app, caso voce nn tenha acesso, pode
simular um prompt
```

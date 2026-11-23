# Posso Faltar?

App mobile (React Native + Expo) para estudantes controlarem **faltas e notas** da faculdade e
descobrirem se podem faltar sem reprovar. Feito para a AT2-N2 de Desenvolvimento Mobile: a entrega
é um vídeo de ~30 s e uma apresentação em sala. A avaliação considera **problema real**,
**UI/UX** e **funcionamento**, então priorize um app polido e estável, que não quebre na demo.

- Responda e escreva textos de interface em **português do Brasil**.
- Instruções gerais de Expo do template: @AGENTS.md

## Stack (não troque sem motivo)

- Expo **SDK 58**, React Native 0.88, React 19.3, TypeScript strict, **React Compiler ligado**.
- Expo Router (rotas em `src/app/`), abas nativas com `NativeTabs` (`expo-router/native-tabs`).
- `@react-native-async-storage/async-storage` **2.2.0 fixo** (versão do Expo Go), `expo-symbols`, `expo-haptics`.
- Precisa rodar no **Expo Go**: use só módulos que estão em
  `node_modules/expo/bundledNativeModules.json`, na versão listada lá. Prefira `npx expo install`;
  se ele falhar sem rede para a API da Expo, instale com `npm install pacote@versão-do-arquivo`.
- Sem backend: tudo é local no aparelho.

## Comandos

```bash
npm start            # servidor de desenvolvimento (w = abrir na web)
npm run lint         # ESLint (eslint-config-expo)
npm run typecheck    # tsc --noEmit
```

`typecheck` depende de `expo-env.d.ts` e `.expo/types/`, que são gerados ao rodar `npm start`
uma vez (estão no .gitignore). Antes de dar uma tarefa como pronta, rode lint e typecheck e
teste o fluxo na web; se possível, também no Expo Go.

## Estrutura

```
src/app/(tabs)/index.tsx     Hoje: veredito "Posso faltar?", faixa da semana, botões Fui/Faltei
src/app/(tabs)/materias.tsx  Lista de matérias + resumo por situação + "Apagar tudo"
src/app/(tabs)/notas.tsx     Quanto precisa tirar em cada matéria
src/app/materia/[id].tsx     Detalhe: faltas restantes, notas editáveis, horários, histórico
src/app/materia/form.tsx     Nova/editar matéria (modal)
src/app/registrar.tsx        Registrar presença/falta em uma data (modal)
src/components/ui.tsx        AppText, Card, Button, IconButton, Chip, Stepper, Pill, ProgressBar, EmptyState, useLevelMeta
src/components/icon.tsx      <Icon name=...>: mapa SF Symbols (iOS) + Material Symbols (Android/web)
src/components/screen.tsx    <Screen> (rolagem, safe area, espaço da tab bar) e <LargeTitle>
src/lib/calc.ts              TODAS as regras de negócio (faltas, veredito do dia, notas, formatação)
src/lib/store.tsx            Estado global (Context) + persistência no AsyncStorage
src/lib/sample.ts            Dados de exemplo gerados a partir da data de hoje (desde o começo do semestre)
src/lib/migrate.ts           Migração dos dados salvos entre versões do formato
src/lib/dates.ts             Datas em pt-BR (YYYY-MM-DD local, semana começa na segunda)
src/lib/feedback.ts          Haptics + confirmAction (Alert no celular, window.confirm na web)
```

## Regras de negócio (src/lib/calc.ts)

- Faltas permitidas = `floor(totalAulas × (100 − frequênciaMínima) / 100)`. Ex.: 80 aulas a 75% → 20.
- Restantes = permitidas − aulas faltadas. Dias restantes = restantes ÷ média de aulas por dia de aula.
- Situação: `failed` (passou do limite) · `danger` (usou ≥ 80% ou não dá pra faltar mais um dia
  inteiro) · `warning` (usou ≥ 50%) · `safe`.
- Veredito do dia (só considera aulas ainda não registradas naquele dia): `no` se faltar faz alguma
  matéria passar do limite; `careful` se alguma fica em `warning`/`danger`; senão `yes`.
  Sem aulas → `free`; tudo registrado → `done`.
- Notas no padrão da faculdade do autor: cada avaliação vale até `maxPoints` (N1 4,5 · N2 4,5 · PPD 1)
  e a nota final é a **soma** dos pontos. Média padrão 6,75 (o stepper anda de 0,25).
- Nota necessária = `média − pontosFeitos`, arredondada **para cima** em centésimos. ≤ 0 → já aprovado;
  > soma do valor das pendentes → impossível. Com várias pendentes, sugere a divisão proporcional
  ao valor de cada uma (arredondada para cima em décimos).
- Um registro por matéria por dia (`setAttendance` substitui o anterior).
- O registro aceita qualquer dia de `semesterStart()` (1º/ago no 2º semestre, 1º/fev no 1º) até hoje.

## Dados

- Tipos em `src/lib/types.ts`. Salvo como JSON na chave `posso-faltar:data:v1` (a chave não muda;
  a versão do formato fica em `data.version`, hoje **2**).
- `src/lib/migrate.ts` converte na leitura: v1 (média ponderada com `weight`/`maxGrade`) → v2
  (soma de `maxPoints`), mantendo o mesmo resultado.
- Se mudar o formato dos dados, **não quebre dados já salvos**: migre na leitura ou crie uma nova versão.
- `buildSampleData()` cria 5 matérias com situações variadas (uma em cada nível), usado na demo/vídeo.

## Convenções de UI

- Cores só pelos tokens de `src/constants/theme.ts` via `useTheme()`. Modo claro e escuro precisam funcionar.
- Reaproveite os componentes de `ui.tsx`. Para um ícone novo, adicione o par iOS/Material no mapa
  de `icon.tsx` (os nomes são checados pelo TypeScript).
- Telas usam `<Screen>`. Modais usam `<NavHeader backIcon="close" safeTop={Platform.OS !== 'ios'} />`
  (no iOS o modal é uma folha e não precisa do recuo da status bar).
- Toques importantes dão feedback com `tapFeedback` / `successFeedback` / `warningFeedback`.
- Confirmações destrutivas usam `confirmAction` (o `Alert` do React Native não funciona na web).

## Armadilhas já encontradas

- `src/components/app-tabs.web.tsx`: os `TabTrigger` precisam ser filhos **diretos** do componente
  passado ao `<TabList asChild>`. Se ficarem aninhados em outra View, as abas param de trocar.
  Estilos passados para filhos de `Slot` devem ser objeto único (`StyleSheet.flatten`), não array.
- O aviso "No screens are declared in ./(tabs)/_layout.tsx" na web em desenvolvimento é inofensivo.
- `app.json` usa `web.output: "single"` (sem renderização estática, porque o AsyncStorage não existe no servidor).
- `npx expo install`, `expo lint` (auto-setup) e `expo-doctor` precisam da API da Expo; num ambiente
  sem rede para ela, use as alternativas acima.

## Estado do projeto

- Funcionalidades do README implementadas e testadas na web (claro/escuro). Os bundles de Android
  e iOS compilam. **Ainda falta testar num celular real pelo Expo Go** antes da apresentação.
- Vídeo de demonstração pronto em `docs/demo.mp4` (capa em `docs/demo-poster.jpg`), gravado da
  versão web numa moldura de celular. Se mudar telas que aparecem nele, avise que o vídeo ficou desatualizado.
- Ideias futuras (lembretes, widget, importar grade, premium) estão no README; não implemente sem pedido.

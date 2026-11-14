# PosOp Monitor 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.

## Primeiro build iOS / TestFlight

Configuração de distribuição preparada em 7 de novembro de 2026. A versão 1.0.2, build 5, foi enviada ao App Store Connect e instalada pelo TestFlight.

### Dados para o cadastro

No Apple Developer, crie um App ID explícito e, no App Store Connect, crie um novo app com:

| Campo | Valor |
| --- | --- |
| Plataforma | iOS |
| Nome | PosOp Monitor (sujeito à disponibilidade na Apple) |
| Idioma principal | Português (Brasil) |
| Bundle ID | `com.victormilitao.posopmonitor` |
| SKU sugerido | `posop-monitor-ios` |
| Versão | `1.0.2` |
| Dispositivos | iPhone e iPad |

O identificador deve ser exatamente o mesmo do `app.json`. O número do build é gerenciado e incrementado pelo EAS. O Apple ID numérico do app é `6832781878`; para fixar o destino dos próximos envios, adicione esse número em `submit.production.ios.ascAppId` no `eas.json` (como string). Não confunda esse número com o Bundle ID ou o e-mail Apple.

### Ambiente e comandos

O ícone em `assets/images/icon.png` é quadrado (1024 × 1024), sem canal alfa, com o logo original sobre `AppColors.primary[900]`. Para regenerá-lo após mudar o logo ou a paleta, execute `npm run generate:icon`. A fonte transparente permanece em `assets/images/logo.png`. Alterações no ícone exigem um novo build nativo para aparecer no TestFlight.

1. Execute `npx eas login` usando a conta com acesso ao projeto Expo `victormilitao/medical-surgey` (ID `f7963815-e620-41e4-86b3-27a3efecab8c`).
2. No painel do projeto Expo, em Environment variables, cadastre no ambiente **production** as variáveis `EXPO_PUBLIC_SUPABASE_URL` e `EXPO_PUBLIC_SUPABASE_ANON_KEY`, usando a URL HTTPS e a chave pública anon/publishable do backend de produção, também utilizado pelo TestFlight. Nunca use a chave service_role ou secret no aplicativo. Os valores públicos entram no bundle; a proteção dos dados depende das políticas do backend.
3. Execute `npx eas-cli@latest build --platform ios --profile production`. Selecione sua equipe Apple Developer e permita ao EAS gerar as credenciais de assinatura quando solicitado.
4. Após o build concluir, execute `npx eas-cli@latest submit --platform ios --profile production` e selecione o build correto.
5. No App Store Connect → TestFlight, aguarde o processamento, preencha as informações do beta e adicione o build ao grupo de testes.

O perfil production usa distribuição store, ambiente production, canal production e Xcode 26.2. O SDK Expo 54 suporta esse caminho. O hook `eas-build-post-install` interrompe o build se as variáveis obrigatórias estiverem ausentes ou inadequadas. `.easignore` impede o envio dos arquivos `.env` locais e dos diretórios nativos gerados; o EAS gera o iOS a partir da configuração Expo. Não envie a pasta `ios` local manualmente: ela pode ter configurações anteriores.

O arquivo `.env` já era rastreado pelo Git antes desta preparação. Acrescentar a regra ao `.gitignore` não remove esse histórico. Seus valores não devem ser tratados como segredo; não inclua credenciais privadas nele. As variáveis remotas foram configuradas pelo responsável no ambiente production do Expo antes do build bem-sucedido.

### Textos para o beta

Descrição sugerida:

> PosOp Monitor é um aplicativo de acompanhamento pós-operatório que permite aos pacientes registrar sua evolução e compartilhar fotos e relatos com o médico responsável. A equipe médica pode acompanhar os pacientes e consultar os registros durante o período de recuperação.

O que testar:

> Testar cadastro e acesso de médico e paciente, aceite dos termos, cadastro de acompanhamento, preenchimento de relatos, envio de fotos pela câmera e biblioteca, consulta da evolução e encerramento da sessão. Informar modelo do aparelho, versão do iOS e passos para reproduzir qualquer problema. Usar somente dados fictícios nesta etapa.

Você ainda precisa informar: nome, telefone e e-mail do responsável pela revisão, e-mail de feedback e contas demonstrativas funcionais de médico e paciente. O médico entra com CPF e senha; o paciente, somente com telefone com DDD. Não salve essas senhas no repositório. Testes externos passam pela revisão beta da Apple.

### Mudança no acesso do paciente

A exigência de senha individual foi temporariamente desabilitada a pedido do responsável. O cadastro não solicita senha e o paciente entra somente com telefone com DDD; internamente, o aplicativo utiliza a credencial fixa do fluxo anterior. Não há verificação por SMS. Atualizar o aplicativo **não altera** as senhas já gravadas no servidor: contas que receberam senhas individuais precisam ser ajustadas pelo administrador do Supabase para serem compatíveis com esse fluxo.

A função remota `create_patient_bypass` já é utilizada pelo projeto e deve aceitar `patient_password`; sua implementação não está nas migrations deste repositório. Validar em ambiente de teste a criação do paciente e o login somente com telefone. A autorização dessa RPC e as políticas de acesso a perfis e fotos precisam ser verificadas no backend antes de usar dados reais. Esta preparação não representa uma auditoria de segurança do backend.

### Verificação em aparelhos

Antes de distribuir para participantes externos, testar no iPhone e no iPad: login dos dois perfis, criação de paciente, persistência da sessão, termos, relatos, câmera/fotos (inclusive permissão negada), visualização pelo médico e logout. Bundle JavaScript e testes automatizados não substituem um build nativo assinado e execução em aparelho.

Referências: [env no EAS](https://docs.expo.dev/eas/environment-variables/), [SDK 26 e Expo 54](https://expo.dev/blog/app-store-connect-minimum-sdk-26), [envio iOS](https://docs.expo.dev/submit/ios/).

## Banco local e distribuição

O desenvolvimento local usa um Supabase separado, executado no Docker. Não há fallback para o banco remoto.

```bash
# Com Docker Desktop aberto e Supabase CLI instalado:
npm run db:start
npm start -- --clear
```

`db:start` inicia os serviços, aplica as migrations locais pendentes e gera `.env.local` com a URL e a chave pública **locais**. É seguro executá-lo novamente; ele não apaga os dados. `npm run db:status` mostra os serviços e `npm run db:stop` os encerra preservando os volumes. Reinicie o Metro após trocar de ambiente.

O iOS Simulator e o navegador usam `127.0.0.1:55321`. O emulador Android usa automaticamente `10.0.2.2:55321`. Para um aparelho físico via Metro/Expo Go, ajuste a URL no `.env.local` para o IP de rede privada do Mac; continua sendo o banco local. Expo Go conectado ao Metro é desenvolvimento local, não publicação.

A estrutura inicial, sem registros de usuários ou pacientes, está em `supabase/local/schema.sql`: snapshot do esquema público remoto em 14/11/2026, incluindo as migrations até `20260516160000`. O script monta um workspace isolado em `.supabase-local/` e acrescenta as migrations posteriores de `supabase/migrations/`. Use os comandos `db:*` do projeto, não `supabase start` na raiz, pois o histórico antigo não contém a criação das tabelas iniciais. Novas migrations devem ter timestamp posterior ao snapshot. Não rode reset para atualizar o banco.

Os perfis EAS `development`, `preview` e `production` usam explicitamente o ambiente **production** do EAS, que contém as credenciais remotas já cadastradas. As publicações também buscam as variáveis do EAS e ignoram os arquivos `.env` locais:

```bash
npm run deploy:preview -- "Descrição da atualização"
npm run deploy:production -- "Descrição da atualização"
npm run build:ios
```

O seletor `EXPO_PUBLIC_BACKEND_TARGET` é `local` no desenvolvimento e `remote` na distribuição. A configuração bloqueia URL remota no modo local e URL local/HTTP no modo remoto. Não use `eas update` sem `--environment production`: utilize os scripts acima. TestFlight e produção continuam usando o remoto; nenhuma migration é enviada ao remoto pelos comandos `db:*`.

Referência: [variáveis do EAS e isolamento dos arquivos locais em updates](https://docs.expo.dev/eas/environment-variables/usage/).

Para criar uma conta fictícia de médico somente no banco local: `npm run db:seed`. Entre com CPF `00000000000` e senha `PosopLocal123!`. As contas e os dados remotos não são copiados. O seed não sobrescreve uma conta de teste já existente.

O PostgreSQL local está fixado em `15.14.1.003`, imagem disponível neste Mac; o remoto usa PostgreSQL 17. O esquema foi importado sem dados e deve ser validado novamente no remoto antes de distribuir mudanças que dependam de recursos exclusivos do PostgreSQL 17.

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

Você ainda precisa informar: nome, telefone e e-mail do responsável pela revisão, e-mail de feedback e contas demonstrativas funcionais de médico e paciente. O médico entra com CPF e senha; o paciente, com telefone com DDD e senha individual. Não salve essas senhas no repositório. Testes externos passam pela revisão beta da Apple.

### Mudança no acesso do paciente

A senha fixa compartilhada foi removida do login e da criação de pacientes. Novos cadastros exigem uma senha individual de pelo menos 12 caracteres. Combine essa senha com o participante por um canal apropriado. Antes de convidar testadores, atribua senhas individuais às contas de demonstração existentes pelo administrador do Supabase; atualizar o aplicativo **não altera** as senhas já gravadas no servidor. Não reutilize as antigas credenciais compartilhadas.

A função remota `create_patient_bypass` já é utilizada pelo projeto e deve aceitar `patient_password`; sua implementação não está nas migrations deste repositório. Validar em ambiente de teste a criação do paciente e o login com a senha escolhida. A autorização dessa RPC e as políticas de acesso a perfis e fotos precisam ser verificadas no backend antes de usar dados reais. Esta preparação não representa uma auditoria de segurança do backend.

### Verificação em aparelhos

Antes de distribuir para participantes externos, testar no iPhone e no iPad: login dos dois perfis, criação de paciente, persistência da sessão, termos, relatos, câmera/fotos (inclusive permissão negada), visualização pelo médico e logout. Bundle JavaScript e testes automatizados não substituem um build nativo assinado e execução em aparelho.

Referências: [env no EAS](https://docs.expo.dev/eas/environment-variables/), [SDK 26 e Expo 54](https://expo.dev/blog/app-store-connect-minimum-sdk-26), [envio iOS](https://docs.expo.dev/submit/ios/).

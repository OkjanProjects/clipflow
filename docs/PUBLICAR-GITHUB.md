# Gerar o APK pelo GitHub (passo a passo)

O workflow já está no repositório: `.github/workflows/android-apk.yml`. Ele compila o app **nativo**
(React Native) num servidor do GitHub e devolve o `.apk` para download. Não precisa de Android SDK,
não precisa de PC potente, e dá para disparar e baixar pelo celular.

Tempo: ~20 minutos de build. Custo: repositório **público** = minutos ilimitados; **privado** = 2.000
minutos grátis por mês (o build usa ~20).

---

## Passo 1 — Criar o repositório

Pelo navegador (pode ser no celular):

1. Abra `github.com/new`
2. **Repository name:** `clipflow`
3. Marque **Private** (ou Public, se preferir minutos ilimitados)
4. **NÃO** marque "Add a README", "Add .gitignore" nem "Choose a license" — o projeto já tem tudo
5. **Create repository**

Você vai cair numa página com instruções. Ignore-as e use as de baixo.

---

## Passo 2 — Enviar o projeto

No computador, na pasta do projeto:

```bash
cd /home/okjanpc/clipflow

git remote add origin https://github.com/SEU_USUARIO/clipflow.git
git push -u origin main
```

Se pedir usuário e senha: **a senha não é a da conta**. O GitHub exige um *Personal Access Token*.

### Como criar o token

1. `github.com/settings/tokens` → **Generate new token (classic)**
2. Note: `clipflow`
3. Expiration: 30 days
4. Marque o escopo **`repo`** (e **`workflow`**, se aparecer)
5. **Generate token** e copie o valor (`ghp_...`) — ele só aparece uma vez
6. No `git push`, use:
   - **Username:** seu usuário do GitHub
   - **Password:** o token colado

> Alternativa com token fine-grained: em *Repository access* selecione o repo `clipflow` e dê
> permissão **Contents: Read and write** + **Workflows: Read and write** (sem Workflows o GitHub
> recusa o push do arquivo `.github/workflows/`).

Para não digitar o token toda vez:

```bash
git config --global credential.helper store   # salva em ~/.git-credentials (texto puro)
```

---

## Passo 3 — Rodar o build

1. Abra o repositório no GitHub
2. Aba **Actions**
3. Se aparecer um aviso, clique em **I understand my workflows, go ahead and enable them**
4. Na lista à esquerda, clique em **Android APK**
5. Botão **Run workflow** → branch **main** → **Run workflow**
6. Atualize a página: aparece um run amarelo (em execução)

O que ele faz, em ordem:

| Etapa | O que acontece |
| --- | --- |
| Checkout | baixa o código |
| Setup Node 22 / Java 21 | instala as ferramentas |
| `npm ci` | instala dependências exatas do lockfile |
| `expo prebuild -p android` | gera a pasta `android/` |
| `gradlew assembleRelease` | compila o APK (arm64-v8a) |
| upload-artifact | publica `clipflow-apk` |

Se algo falhar, clique no passo vermelho — o log mostra o erro exato.

---

## Passo 4 — Baixar e instalar

1. Abra o run concluído (check verde)
2. No fim da página, em **Artifacts**, toque em **clipflow-apk**
3. Baixa um `.zip`; extraia (app "Arquivos" do Android ou ZArchiver)
4. Toque no `app-release.apk`
5. O Android vai pedir para permitir **instalar apps desconhecidos** para o app que está abrindo o
   arquivo — permita
6. Instalar → abrir

O APK é assinado com a **debug keystore** (a mesma que o Expo gera). Instala e funciona normalmente;
só não serve para publicar na Play Store. Para isso seria preciso gerar uma keystore de release.

O artifact fica disponível por **30 dias**.

---

## Fazer tudo pelo celular (sem PC)

Se o projeto estiver no celular (pasta `clipflow`), use o Termux:

```bash
pkg install git
cd ~/clipflow
git init
git add -A
git commit -m "clipflow"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/clipflow.git
git push -u origin main
```

O `git push` pede usuário + token, igual ao passo 2. Depois siga do passo 3 em diante no navegador
do próprio celular.

---

## Problemas comuns

| Sintoma | Causa / solução |
| --- | --- |
| **Actions** não mostra "Android APK" | o arquivo precisa estar na branch **default** (`main`). Confira em Settings → Branches |
| `refusing to allow a Personal Access Token to create or update workflow` | o token não tem escopo `workflow` |
| `npm ci` falha | `package-lock.json` não foi enviado (confira `git ls-files | grep lock`) |
| Build passa de 60 min e é cancelado | aumente `timeout-minutes` no workflow; normalmente leva ~20 |
| APK não instala | precisa de Android 7+ (minSdk 24); desinstale uma versão anterior com assinatura diferente |
| Quer x86_64 (emulador) | troque `-PreactNativeArchitectures=arm64-v8a` por `arm64-v8a,x86_64` |

---

## Depois do primeiro envio

Cada `git push` na `main` **não** dispara o build (só `workflow_dispatch` e tags `v*`). Para gerar uma
versão nova, rode o workflow de novo. Para gerar por tag:

```bash
git tag v1.0.0
git push origin v1.0.0
```

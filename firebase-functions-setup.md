
# Configuração das Firebase Cloud Functions para Stripe

Este arquivo descreve como configurar as Firebase Cloud Functions para integração com o Stripe na sua aplicação.

## Pré-requisitos

1. Conta Firebase com plano Blaze (pay-as-you-go)
2. Firebase CLI instalado (`npm install -g firebase-tools`)
3. Conta Stripe com chave secreta

## Passos para Configuração

### 1. Inicializar Firebase Functions

```bash
# Fazer login no Firebase
firebase login

# Inicializar Firebase Functions no seu projeto
firebase init functions
```

Selecione JavaScript ou TypeScript conforme sua preferência.

### 2. Estrutura do Projeto Functions

Após a inicialização, você terá uma pasta `functions` com a seguinte estrutura:

```
functions/
  ├── package.json
  ├── index.js (ou index.ts)
  ├── node_modules/
  └── .eslintrc.js
```

### 3. Instalar Dependências do Stripe

```bash
cd functions
npm install stripe
```

### 4. Configurar Variáveis de Ambiente

```bash
firebase functions:config:set stripe.secret="sua_chave_secreta_do_stripe"
```

### 5. Implementar a Função createStripeCheckout

Edite o arquivo `index.js` (ou `index.ts`) para adicionar a função de checkout do Stripe:

```javascript
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const Stripe = require('stripe');

admin.initializeApp();

exports.createStripeCheckout = functions.https.onCall(async (data, context) => {
  // Verificar autenticação
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'O usuário deve estar autenticado'
    );
  }

  try {
    // Inicializar Stripe com a chave secreta
    const stripe = new Stripe(functions.config().stripe.secret);
    
    const { planId, priceId, userId, userEmail, successUrl, cancelUrl } = data;
    
    // Verificar se o cliente já existe
    const customers = await stripe.customers.list({ email: userEmail, limit: 1 });
    let customerId;
    
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    } else {
      // Criar um novo cliente
      const customer = await stripe.customers.create({ email: userEmail });
      customerId = customer.id;
    }
    
    // Criar a sessão de checkout
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
    });
    
    // Opcionalmente, armazenar os detalhes da sessão no Firestore
    await admin.firestore().collection('stripeCheckoutSessions').add({
      userId,
      planId,
      priceId,
      sessionId: session.id,
      status: 'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    return { url: session.url };
  } catch (error) {
    console.error('Erro no createStripeCheckout:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});
```

### 6. Implementar Webhook para Eventos do Stripe (opcional, mas recomendado)

```javascript
exports.stripeWebhook = functions.https.onRequest(async (req, res) => {
  const stripe = new Stripe(functions.config().stripe.secret);
  const endpointSecret = functions.config().stripe.webhook_secret;
  
  const sig = req.headers['stripe-signature'];
  
  try {
    let event;
    
    if (endpointSecret) {
      event = stripe.webhooks.constructEvent(req.rawBody, sig, endpointSecret);
    } else {
      event = req.body;
    }
    
    // Processar eventos do Stripe (pagamentos bem-sucedidos, etc.)
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object;
        await handleCheckoutSessionCompleted(session);
        break;
        
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        const subscription = event.data.object;
        await handleSubscriptionUpdate(subscription);
        break;
        
      default:
        console.log(`Evento não processado: ${event.type}`);
    }
    
    res.json({ received: true });
  } catch (err) {
    console.error('Erro no webhook:', err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
});

async function handleCheckoutSessionCompleted(session) {
  // Buscar detalhes da sessão no Firestore
  const sessionsRef = admin.firestore().collection('stripeCheckoutSessions');
  const snapshot = await sessionsRef.where('sessionId', '==', session.id).get();
  
  if (snapshot.empty) {
    console.log('Nenhuma sessão encontrada para o ID:', session.id);
    return;
  }
  
  const sessionDoc = snapshot.docs[0];
  const sessionData = sessionDoc.data();
  
  // Buscar detalhes da assinatura
  const stripe = new Stripe(functions.config().stripe.secret);
  const subscription = await stripe.subscriptions.retrieve(session.subscription);
  
  // Atualizar status da assinatura no Firestore
  await admin.firestore().collection('subscriptions').doc(sessionData.userId).set({
    userId: sessionData.userId,
    planType: sessionData.planId,
    status: 'active',
    startDate: new Date(subscription.current_period_start * 1000),
    endDate: new Date(subscription.current_period_end * 1000),
    stripeCustomerId: session.customer,
    stripeSubscriptionId: session.subscription,
    selectedCategories: []
  });
  
  // Atualizar o plano do usuário
  await admin.firestore().collection('users').doc(sessionData.userId).update({
    plano: sessionData.planId
  });
  
  // Atualizar status da sessão de checkout
  await sessionDoc.ref.update({
    status: 'completed',
    completedAt: admin.firestore.FieldValue.serverTimestamp(),
    stripeCustomerId: session.customer,
    stripeSubscriptionId: session.subscription
  });
}

async function handleSubscriptionUpdate(subscription) {
  // Buscar o usuário baseado no cliente do Stripe
  const usersRef = admin.firestore().collection('subscriptions');
  const snapshot = await usersRef.where('stripeSubscriptionId', '==', subscription.id).get();
  
  if (snapshot.empty) {
    console.log('Nenhuma assinatura encontrada para o ID:', subscription.id);
    return;
  }
  
  const subscriptionDoc = snapshot.docs[0];
  
  // Atualizar status da assinatura
  const status = subscription.status === 'active' ? 'active' : 'canceled';
  
  await subscriptionDoc.ref.update({
    status: status,
    endDate: new Date(subscription.current_period_end * 1000)
  });
  
  // Se cancelado, atualizar o plano do usuário para gratuito
  if (status !== 'active') {
    await admin.firestore().collection('users').doc(subscriptionDoc.data().userId).update({
      plano: 'free'
    });
  }
}
```

### 7. Implantar as Functions

```bash
firebase deploy --only functions
```

### 8. Atualizar o Código do Frontend

Depois de implantar as functions, você precisará atualizar o arquivo `stripe-service.ts` no seu aplicativo para usar as funções reais do Firebase em vez da simulação temporária. Você pode descomentar o código comentado e remover a solução temporária de simulação.

## Configuração do Webhook no Stripe

1. Acesse o [Dashboard do Stripe](https://dashboard.stripe.com/webhooks)
2. Clique em "Add Endpoint"
3. Digite a URL da sua função (algo como `https://us-central1-seu-projeto.cloudfunctions.net/stripeWebhook`)
4. Selecione os eventos `checkout.session.completed`, `customer.subscription.updated` e `customer.subscription.deleted`
5. Copie o "Signing Secret" e atualize sua configuração de funções:

```bash
firebase functions:config:set stripe.webhook_secret="seu_webhook_signing_secret"
```

6. Reimplante suas funções:

```bash
firebase deploy --only functions
```

## Testando

1. Acesse sua aplicação
2. Selecione um plano e clique em "Assinar"
3. Complete o fluxo de checkout
4. Verifique os logs das funções para garantir que tudo esteja funcionando corretamente

const listaCards = document.querySelector("#lista-cards");
const campoPesquisa = document.querySelector("#campo-pesquisa");
const resultadoContagem = document.querySelector("#resultado-contagem");
const botoesFiltro = document.querySelectorAll(".filtro");
const paginacao = document.querySelector("#paginacao");
const catalogo = document.querySelector("#catalogo");

const abrirPedido = document.querySelector("#abrir-pedido");
const fecharPedido = document.querySelector("#fechar-pedido");
const painelPedido = document.querySelector("#painel-pedido");
const fundoPedido = document.querySelector("#fundo-pedido");
const itensPedido = document.querySelector("#itens-pedido");
const totalPedido = document.querySelector("#total-pedido");
const contadorPedido = document.querySelector(".contador-pedido");
const finalizarPedido = document.querySelector("#finalizar-pedido");

/*
  Número que receberá os pedidos.

  Formato:
  55 + DDD + número

  Sem espaços, parênteses, traços ou sinal de mais.
*/
const numeroWhatsApp = "5511915275121";

/*
  Limite conservador para evitar que pedidos grandes
  sejam cortados ao serem enviados pela URL do WhatsApp.

  Se a URL ultrapassar este tamanho, o pedido será
  copiado automaticamente para a área de transferência.
*/
const limiteUrlWhatsApp = 1800;

const cardsPorPagina = 12;

let cards = [];
let filtroAtual = "Todos";
let paginaAtual = 1;
let pedido = [];

/* =========================================================
   CARREGAMENTO DOS CARDS
========================================================= */

async function carregarCards() {
  try {
    const resposta = await fetch("cards.json");

    if (!resposta.ok) {
      throw new Error(
        "Não foi possível carregar o arquivo cards.json."
      );
    }

    cards = await resposta.json();

    atualizarCatalogo();
    atualizarPedido();
  } catch (erro) {
    console.error(erro);

    listaCards.innerHTML = `
      <div class="estado-vazio">
        <span>⚠️</span>
        <h3>Não foi possível carregar os cards</h3>
        <p>Verifique se o arquivo cards.json está salvo corretamente.</p>
      </div>
    `;

    paginacao.innerHTML = "";
  }
}

/* =========================================================
   FORMATAÇÃO
========================================================= */

function formatarPreco(valor) {
  const preco = Number(valor) || 0;

  return preco.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function cardEstaDisponivel(card) {
  return (
    card.status === "Disponível" &&
    Number(card.estoque) > 0
  );
}

/* =========================================================
   CRIAÇÃO DOS CARDS
========================================================= */

function criarCard(card) {
  const disponivel = cardEstaDisponivel(card);

  return `
    <article class="card-produto">
      <div class="card-imagem">
        <img
          src="${card.imagem}"
          alt="Card ${card.numero} de ${card.nome}"
          loading="lazy"
        />

        <span class="card-tipo">${card.raridade}</span>
      </div>

      <div class="card-conteudo">
        <div class="card-dados">
          <p class="card-numero">
            ${card.numero}
          </p>

          <h3>
            ${card.nome}
          </h3>

          <p class="card-categoria">
            ${card.categoria}
          </p>

          <p class="card-pais">
            ${card.pais}
          </p>

          <p class="card-status">
            ${disponivel ? "Disponível" : card.status}
          </p>
        </div>

        <div class="card-rodape">
          <strong>
            ${formatarPreco(card.preco)}
          </strong>

          <button
            class="botao-adicionar"
            type="button"
            data-id="${card.id}"
            ${disponivel ? "" : "disabled"}
          >
            ${disponivel ? "Adicionar" : "Indisponível"}
          </button>
        </div>
      </div>
    </article>
  `;
}

/* =========================================================
   PESQUISA E FILTROS
========================================================= */

function filtrarCards() {
  const pesquisa = campoPesquisa.value
    .trim()
    .toLowerCase();

  return cards.filter((card) => {
    const nome = String(
      card.nome || ""
    ).toLowerCase();

    const pais = String(
      card.pais || ""
    ).toLowerCase();

    const categoria = String(
      card.categoria || ""
    ).toLowerCase();

    const raridade = String(
      card.raridade || ""
    ).toLowerCase();

    const tipo = String(
      card.tipo || ""
    ).toLowerCase();

    const numero = String(
      card.numero || ""
    ).toLowerCase();

    const correspondePesquisa =
      nome.includes(pesquisa) ||
      pais.includes(pesquisa) ||
      categoria.includes(pesquisa) ||
      raridade.includes(pesquisa) ||
      tipo.includes(pesquisa) ||
      numero.includes(pesquisa);

    const correspondeFiltro =
      filtroAtual === "Todos" ||
      card.raridade === filtroAtual ||
      card.pais === filtroAtual ||
      card.categoria === filtroAtual;

    return (
      correspondePesquisa &&
      correspondeFiltro
    );
  });
}

/* =========================================================
   PAGINAÇÃO
========================================================= */

function obterCardsDaPagina(cardsFiltrados) {
  const indiceInicial =
    (paginaAtual - 1) * cardsPorPagina;

  const indiceFinal =
    indiceInicial + cardsPorPagina;

  return cardsFiltrados.slice(
    indiceInicial,
    indiceFinal
  );
}

function criarBotaoPagina(numeroPagina) {
  const ativo =
    numeroPagina === paginaAtual;

  return `
    <button
      class="botao-pagina ${ativo ? "ativo" : ""}"
      type="button"
      data-pagina="${numeroPagina}"
      aria-label="Ir para a página ${numeroPagina}"
      ${ativo ? 'aria-current="page"' : ""}
    >
      ${numeroPagina}
    </button>
  `;
}

function criarReticencias() {
  return `
    <span
      class="paginacao-reticencias"
      aria-hidden="true"
    >
      ...
    </span>
  `;
}

function obterPaginasVisiveis(totalPaginas) {
  if (totalPaginas <= 7) {
    return Array.from(
      { length: totalPaginas },
      (_, indice) => indice + 1
    );
  }

  if (paginaAtual <= 4) {
    return [
      1,
      2,
      3,
      4,
      5,
      "...",
      totalPaginas
    ];
  }

  if (paginaAtual >= totalPaginas - 3) {
    return [
      1,
      "...",
      totalPaginas - 4,
      totalPaginas - 3,
      totalPaginas - 2,
      totalPaginas - 1,
      totalPaginas
    ];
  }

  return [
    1,
    "...",
    paginaAtual - 1,
    paginaAtual,
    paginaAtual + 1,
    "...",
    totalPaginas
  ];
}

function atualizarPaginacao(totalCards) {
  const totalPaginas = Math.ceil(
    totalCards / cardsPorPagina
  );

  if (totalPaginas <= 1) {
    paginacao.innerHTML = "";
    return;
  }

  const paginasVisiveis =
    obterPaginasVisiveis(totalPaginas);

  const botoesNumerados =
    paginasVisiveis
      .map((pagina) => {
        if (pagina === "...") {
          return criarReticencias();
        }

        return criarBotaoPagina(pagina);
      })
      .join("");

  paginacao.innerHTML = `
    <button
      class="botao-pagina"
      type="button"
      data-pagina="${paginaAtual - 1}"
      aria-label="Ir para a página anterior"
      ${paginaAtual === 1 ? "disabled" : ""}
    >
      Anterior
    </button>

    ${botoesNumerados}

    <button
      class="botao-pagina"
      type="button"
      data-pagina="${paginaAtual + 1}"
      aria-label="Ir para a próxima página"
      ${
        paginaAtual === totalPaginas
          ? "disabled"
          : ""
      }
    >
      Próxima
    </button>
  `;
}

/* =========================================================
   ATUALIZAÇÃO DO CATÁLOGO
========================================================= */

function atualizarCatalogo() {
  const cardsFiltrados = filtrarCards();

  const totalPaginas = Math.ceil(
    cardsFiltrados.length / cardsPorPagina
  );

  if (
    paginaAtual > totalPaginas &&
    totalPaginas > 0
  ) {
    paginaAtual = totalPaginas;
  }

  const cardsDaPagina =
    obterCardsDaPagina(cardsFiltrados);

  resultadoContagem.textContent =
    `${cardsFiltrados.length} ${
      cardsFiltrados.length === 1
        ? "card encontrado"
        : "cards encontrados"
    }`;

  if (cardsFiltrados.length === 0) {
    listaCards.innerHTML = `
      <div class="estado-vazio">
        <span>🔍</span>
        <h3>Nenhum card encontrado</h3>
        <p>
          Tente pesquisar outro jogador,
          país, número ou categoria.
        </p>
      </div>
    `;

    paginacao.innerHTML = "";
    return;
  }

  listaCards.innerHTML =
    cardsDaPagina
      .map(criarCard)
      .join("");

  atualizarPaginacao(
    cardsFiltrados.length
  );
}

function mudarPagina(novaPagina) {
  const cardsFiltrados =
    filtrarCards();

  const totalPaginas = Math.ceil(
    cardsFiltrados.length /
      cardsPorPagina
  );

  if (
    novaPagina < 1 ||
    novaPagina > totalPaginas ||
    novaPagina === paginaAtual
  ) {
    return;
  }

  paginaAtual = novaPagina;

  atualizarCatalogo();

  catalogo.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}

/* =========================================================
   PAINEL DO PEDIDO
========================================================= */

function abrirPainelPedido() {
  painelPedido.classList.add("aberto");
  fundoPedido.classList.add("ativo");

  painelPedido.setAttribute(
    "aria-hidden",
    "false"
  );

  document.body.style.overflow =
    "hidden";
}

function fecharPainelPedido() {
  painelPedido.classList.remove(
    "aberto"
  );

  fundoPedido.classList.remove(
    "ativo"
  );

  painelPedido.setAttribute(
    "aria-hidden",
    "true"
  );

  document.body.style.overflow = "";
}

/* =========================================================
   ADICIONAR AO PEDIDO
========================================================= */

function adicionarAoPedido(idCard) {
  const card = cards.find(
    (item) =>
      Number(item.id) === idCard
  );

  if (
    !card ||
    !cardEstaDisponivel(card)
  ) {
    return;
  }

  const itemExistente =
    pedido.find(
      (item) =>
        Number(item.id) === idCard
    );

  if (itemExistente) {
    if (
      itemExistente.quantidade <
      Number(card.estoque)
    ) {
      itemExistente.quantidade += 1;
    }
  } else {
    pedido.push({
      ...card,
      quantidade: 1
    });
  }

  atualizarPedido();
  abrirPainelPedido();
}

/* =========================================================
   QUANTIDADE
========================================================= */

function alterarQuantidade(
  idCard,
  alteracao
) {
  const item = pedido.find(
    (produto) =>
      Number(produto.id) === idCard
  );

  if (!item) {
    return;
  }

  const novaQuantidade =
    item.quantidade + alteracao;

  if (novaQuantidade < 1) {
    removerDoPedido(idCard);
    return;
  }

  if (
    novaQuantidade <=
    Number(item.estoque)
  ) {
    item.quantidade =
      novaQuantidade;
  }

  atualizarPedido();
}

function removerDoPedido(idCard) {
  pedido = pedido.filter(
    (item) =>
      Number(item.id) !== idCard
  );

  atualizarPedido();
}

/* =========================================================
   ITEM DO PEDIDO
========================================================= */

function criarItemPedido(item) {
  return `
    <article class="item-pedido">
      <img
        src="${item.imagem}"
        alt="Card ${item.numero} de ${item.nome}"
      />

      <div>
        <h3>
          ${item.nome}
        </h3>

        <p>
          ${item.numero} • ${item.pais}
        </p>

        <p>
          ${formatarPreco(item.preco)}
        </p>

        <div class="item-quantidade">
          <button
            type="button"
            data-acao="diminuir"
            data-id="${item.id}"
            aria-label="Diminuir quantidade"
          >
            −
          </button>

          <span>
            ${item.quantidade}
          </span>

          <button
            type="button"
            data-acao="aumentar"
            data-id="${item.id}"
            aria-label="Aumentar quantidade"
            ${
              item.quantidade >=
              Number(item.estoque)
                ? "disabled"
                : ""
            }
          >
            +
          </button>
        </div>
      </div>

      <button
        class="remover-item"
        type="button"
        data-acao="remover"
        data-id="${item.id}"
      >
        Remover
      </button>
    </article>
  `;
}

/* =========================================================
   TOTAIS
========================================================= */

function calcularQuantidadeTotal() {
  return pedido.reduce(
    (total, item) =>
      total + item.quantidade,
    0
  );
}

function calcularValorTotal() {
  return pedido.reduce(
    (total, item) =>
      total +
      Number(item.preco) *
        item.quantidade,
    0
  );
}

/* =========================================================
   ATUALIZAÇÃO DO PEDIDO
========================================================= */

function atualizarPedido() {
  const quantidadeTotal =
    calcularQuantidadeTotal();

  const valorTotal =
    calcularValorTotal();

  contadorPedido.textContent =
    quantidadeTotal;

  totalPedido.textContent =
    formatarPreco(valorTotal);

  if (pedido.length === 0) {
    itensPedido.innerHTML = `
      <div class="pedido-vazio">
        <p>
          Nenhum card adicionado.
        </p>
      </div>
    `;

    return;
  }

  itensPedido.innerHTML =
    pedido
      .map(criarItemPedido)
      .join("");
}

/* =========================================================
   MENSAGEM DO WHATSAPP
========================================================= */

function criarMensagemWhatsApp() {
  const quantidadeTotal =
    calcularQuantidadeTotal();

  const valorTotal =
    calcularValorTotal();

  /*
    Formato compacto para evitar mensagens
    desnecessariamente grandes.

    Exemplo:

    GB-08 | Cristiano Ronaldo | Portugal
    1x R$ 50,00 = R$ 50,00
  */
  const linhasCards = pedido
    .map((item) => {
      const subtotal =
        Number(item.preco) *
        item.quantidade;

      return [
        `*${item.numero} | ${item.nome} | ${item.pais}*`,
        `${item.quantidade}x ${formatarPreco(item.preco)} = ${formatarPreco(subtotal)}`
      ].join("\n");
    })
    .join("\n\n");

  return [
    "*PEDIDO DE CARDS*",
    "",
    "*Coleção:*",
    "Panini Adrenalyn XL - FIFA World Cup 2026",
    "",
    "--------------------",
    "",
    linhasCards,
    "",
    "--------------------",
    "",
    `*Total de cards:* ${quantidadeTotal}`,
    `*Valor do pedido:* ${formatarPreco(valorTotal)}`,
    "",
    "O frete será calculado separadamente.",
    "",
    "--------------------",
    "",
    "*Nome:*",
    "",
    "*CEP:*"
  ].join("\n");
}

/* =========================================================
   COPIAR PEDIDO
========================================================= */

async function copiarTexto(texto) {
  /*
    Método moderno.
    Funciona normalmente em HTTPS,
    como no GitHub Pages.
  */
  if (
    navigator.clipboard &&
    window.isSecureContext
  ) {
    try {
      await navigator.clipboard.writeText(
        texto
      );

      return true;
    } catch (erro) {
      console.warn(
        "Não foi possível usar navigator.clipboard.",
        erro
      );
    }
  }

  /*
    Método alternativo para navegadores
    que não permitirem Clipboard API.
  */
  try {
    const areaTexto =
      document.createElement(
        "textarea"
      );

    areaTexto.value = texto;

    areaTexto.style.position =
      "fixed";

    areaTexto.style.left =
      "-999999px";

    areaTexto.style.top =
      "-999999px";

    areaTexto.setAttribute(
      "readonly",
      ""
    );

    document.body.appendChild(
      areaTexto
    );

    areaTexto.focus();
    areaTexto.select();

    const copiado =
      document.execCommand("copy");

    document.body.removeChild(
      areaTexto
    );

    return copiado;
  } catch (erro) {
    console.error(
      "Não foi possível copiar o pedido.",
      erro
    );

    return false;
  }
}

/* =========================================================
   FINALIZAR PEDIDO PELO WHATSAPP
========================================================= */

async function finalizarPedidoPeloWhatsApp() {
  if (pedido.length === 0) {
    alert(
      "Adicione pelo menos um card ao pedido."
    );

    return;
  }

  if (
    !numeroWhatsApp ||
    numeroWhatsApp ===
      "5511999999999"
  ) {
    alert(
      "Coloque o seu número de WhatsApp na constante numeroWhatsApp do arquivo app.js."
    );

    return;
  }

  const numeroLimpo =
    numeroWhatsApp.replace(
      /\D/g,
      ""
    );

  const mensagem =
    criarMensagemWhatsApp();

  const mensagemCodificada =
    encodeURIComponent(
      mensagem
    );

  const urlWhatsAppComMensagem =
    `https://wa.me/${numeroLimpo}?text=${mensagemCodificada}`;

  /*
    PEDIDO PEQUENO

    Se a URL estiver dentro do limite,
    abre normalmente com o pedido
    já preenchido no WhatsApp.
  */
  if (
    urlWhatsAppComMensagem.length <=
    limiteUrlWhatsApp
  ) {
    window.open(
      urlWhatsAppComMensagem,
      "_blank",
      "noopener,noreferrer"
    );

    return;
  }

  /*
    PEDIDO GRANDE

    O pedido completo será copiado
    para evitar que a URL seja cortada.
  */
  const copiado =
    await copiarTexto(mensagem);

  if (!copiado) {
    alert(
      "O pedido é muito grande e não foi possível copiá-lo automaticamente. Tente novamente ou reduza a quantidade de cards."
    );

    return;
  }

  alert(
    "Pedido grande detectado!\n\nO pedido completo foi copiado.\n\nO WhatsApp será aberto agora. Cole a mensagem no campo de conversa e envie."
  );

  const urlWhatsApp =
    `https://wa.me/${numeroLimpo}`;

  window.open(
    urlWhatsApp,
    "_blank",
    "noopener,noreferrer"
  );
}

/* =========================================================
   EVENTOS DA PESQUISA
========================================================= */

campoPesquisa.addEventListener(
  "input",
  () => {
    paginaAtual = 1;
    atualizarCatalogo();
  }
);

/* =========================================================
   EVENTOS DOS FILTROS
========================================================= */

botoesFiltro.forEach((botao) => {
  botao.addEventListener(
    "click",
    () => {
      botoesFiltro.forEach(
        (item) => {
          item.classList.remove(
            "ativo"
          );
        }
      );

      botao.classList.add(
        "ativo"
      );

      const textoFiltro =
        botao.textContent.trim();

      if (
        textoFiltro === "Bases"
      ) {
        filtroAtual = "Base";
      } else if (
        textoFiltro ===
        "Especiais"
      ) {
        filtroAtual =
          "Especial";
      } else {
        filtroAtual =
          textoFiltro;
      }

      paginaAtual = 1;

      atualizarCatalogo();
    }
  );
});

/* =========================================================
   EVENTOS DA PAGINAÇÃO
========================================================= */

paginacao.addEventListener(
  "click",
  (evento) => {
    const botao =
      evento.target.closest(
        "button[data-pagina]"
      );

    if (
      !botao ||
      botao.disabled
    ) {
      return;
    }

    const novaPagina =
      Number(
        botao.dataset.pagina
      );

    mudarPagina(
      novaPagina
    );
  }
);

/* =========================================================
   EVENTOS DOS CARDS
========================================================= */

listaCards.addEventListener(
  "click",
  (evento) => {
    const botao =
      evento.target.closest(
        ".botao-adicionar"
      );

    if (
      !botao ||
      botao.disabled
    ) {
      return;
    }

    const idCard =
      Number(
        botao.dataset.id
      );

    adicionarAoPedido(
      idCard
    );
  }
);

/* =========================================================
   EVENTOS DO PEDIDO
========================================================= */

itensPedido.addEventListener(
  "click",
  (evento) => {
    const botao =
      evento.target.closest(
        "button[data-acao]"
      );

    if (
      !botao ||
      botao.disabled
    ) {
      return;
    }

    const idCard =
      Number(
        botao.dataset.id
      );

    const acao =
      botao.dataset.acao;

    if (
      acao === "aumentar"
    ) {
      alterarQuantidade(
        idCard,
        1
      );
    }

    if (
      acao === "diminuir"
    ) {
      alterarQuantidade(
        idCard,
        -1
      );
    }

    if (
      acao === "remover"
    ) {
      removerDoPedido(
        idCard
      );
    }
  }
);

/* =========================================================
   ABRIR E FECHAR PEDIDO
========================================================= */

abrirPedido.addEventListener(
  "click",
  abrirPainelPedido
);

fecharPedido.addEventListener(
  "click",
  fecharPainelPedido
);

fundoPedido.addEventListener(
  "click",
  fecharPainelPedido
);

document.addEventListener(
  "keydown",
  (evento) => {
    if (
      evento.key === "Escape"
    ) {
      fecharPainelPedido();
    }
  }
);

/* =========================================================
   FINALIZAR PEDIDO
========================================================= */

finalizarPedido.addEventListener(
  "click",
  finalizarPedidoPeloWhatsApp
);

/* =========================================================
   INICIALIZAÇÃO
========================================================= */

carregarCards();
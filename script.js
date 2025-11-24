const cardContainer = document.querySelector(".card-container");
const campoBusca = document.querySelector("#campo-busca");
const categoryContainer = document.querySelector("#category-container");
const stateFilter = document.querySelector("#state-filter");
const cityFilter = document.querySelector("#city-filter");
const themeSwitcher = document.querySelector("#theme-switcher");
const descriptionContainer = document.querySelector(".description-container");

let dados = [];

async function carregarDados() {
    try {
        const resposta = await fetch("data.json");
        dados = await resposta.json();
        renderizarBotoesCategoria();
        renderizarCards([]); // Exibe a mensagem inicial através do JS
    } catch (error) {
        console.error("Erro ao carregar os dados:", error);
    }
}

function applyTheme(theme) {
    document.body.classList.remove('light-mode', 'daltonism-mode');
    if (theme === 'light') {
        document.body.classList.add('light-mode');
    } else if (theme === 'daltonism') {
        document.body.classList.add('daltonism-mode');
    }
    // O modo escuro é o padrão, então não precisa de classe
}

function setupThemeSwitcher() {
    const savedTheme = localStorage.getItem('theme') || 'auto';
    themeSwitcher.value = savedTheme;

    if (savedTheme === 'auto') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        applyTheme(prefersDark ? 'dark' : 'light');
    } else {
        applyTheme(savedTheme);
    }

    themeSwitcher.addEventListener('change', (e) => {
        const selectedTheme = e.target.value;
        localStorage.setItem('theme', selectedTheme);

        if (selectedTheme === 'auto') {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            applyTheme(prefersDark ? 'dark' : 'light');
        } else {
            applyTheme(selectedTheme);
        }
    });
}

function renderizarBotoesCategoria() {
    categoryContainer.innerHTML = ''; // Limpa para evitar duplicatas

    const categoriasUnicas = [...new Set(dados.map(dado => dado.categoria))];

    // Botão "Ver Todos"
    const allButton = document.createElement('button');
    allButton.className = 'category-button';
    allButton.textContent = 'Ver Todos';
    allButton.onclick = () => {
        if (cityFilter.value !== 'Santa Maria') {
            alert("Selecione ao menos a cidade para prosseguir.");
            return;
        }
        campoBusca.value = ''; // Limpa o campo de busca, caso haja algo
        setActiveButton(allButton); // Define o próprio botão como ativo
        descriptionContainer.classList.remove('hidden'); // Garante que a descrição esteja visível
        renderizarCards(dados); // Exibe todos os cards
    };
    categoryContainer.appendChild(allButton);

    categoriasUnicas.forEach(categoria => {
        const button = document.createElement('button');
        button.className = 'category-button';
        button.textContent = categoria;
        button.onclick = () => {
            if (cityFilter.value !== 'Santa Maria') {
                alert("Selecione ao menos a cidade para prosseguir.");
                return;
            }

            const isAlreadyActive = button.classList.contains('active');

            if (isAlreadyActive) {
                // Se o botão já está ativo, deseleciona e volta ao estado inicial
                setActiveButton(null);
                descriptionContainer.classList.remove('hidden');
                renderizarCards([]);
            } else {
                // Se não está ativo, seleciona e filtra os resultados
                setActiveButton(button);
                descriptionContainer.classList.add('hidden');
                const resultados = dados.filter(dado => dado.categoria === categoria);
                renderizarCards(resultados);
            }
        };
        categoryContainer.appendChild(button);
    });
}

function setActiveButton(activeButton) {
    document.querySelectorAll('.category-button').forEach(btn => btn.classList.remove('active'));
    if (activeButton) {
        activeButton.classList.add('active');
    }
}

// Função auxiliar para remover acentos de uma string
function removerAcentos(texto) {
    return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function iniciarBusca() {
    const termoBusca = removerAcentos(campoBusca.value.toLowerCase());

    if (cityFilter.value !== 'Santa Maria') {
        alert("Selecione ao menos a cidade para prosseguir.");
        campoBusca.value = ''; // Limpa o campo para evitar confusão
        return;
    }

    descriptionContainer.classList.add('hidden'); // Oculta a descrição ao iniciar a busca

    setActiveButton(null); // Remove a seleção de qualquer botão de categoria
    const resultados = dados.filter(dado => {
        const segmentoMatch = removerAcentos(dado.segmento.toLowerCase()).includes(termoBusca);
        const categoriaMatch = removerAcentos(dado.categoria.toLowerCase()).includes(termoBusca);
        // Verifica se o termo de busca corresponde ao nome de algum dos locais
        const locaisMatch = dado.locais.some(local => {
            const nomeAbreviadoMatch = removerAcentos(local.nome.toLowerCase()).includes(termoBusca);
            const nomeCompletoMatch = local.nomeCompleto ? removerAcentos(local.nomeCompleto.toLowerCase()).includes(termoBusca) : false;
            return nomeAbreviadoMatch || nomeCompletoMatch;
        });

        return segmentoMatch || categoriaMatch || locaisMatch;
    });
    renderizarCards(resultados);
}

function renderizarCards(dados) {
    cardContainer.innerHTML = ""; // Limpa os cards existentes antes de renderizar novos

    if (dados.length === 0) {
        const isSearching = campoBusca.value !== '';
        const isCategorySelected = document.querySelector('.category-button.active') !== null;

        // Se o usuário está buscando ativamente (por texto ou categoria) e não há resultados
        if (isSearching || isCategorySelected) {
            cardContainer.innerHTML = "<p class='card-container-message'>Nenhum resultado encontrado para a sua busca.</p>";
        } else {
            // Se não há busca ativa, mostra a mensagem inicial
            cardContainer.innerHTML = "<p class='card-container-message'>Pesquise para sanar a sua dúvida: descartONde?</p>";
        }
        return;
    }

    for (const dado of dados) {
        let article = document.createElement("article");
        article.classList.add("card");

        // Cria a string de links dinamicamente
        let linksHtml = dado.locais.map(local => {
            return `<a href="${local.link}" target="_blank">${local.nome}</a>`;
        }).join(', '); // Junta os links com uma vírgula e espaço

        article.innerHTML = `
        <h2>${dado.segmento}</h2>
        <p><strong>Categoria:</strong> ${dado.categoria}</p>
        <p><strong>Locais Exemplo:</strong> ${linksHtml} e entre outros locais.</p>
        `
        cardContainer.appendChild(article);
    }
}

// Adiciona um listener para o evento 'input', que dispara a busca a cada alteração no campo
campoBusca.addEventListener('input', () => {
    const termoBusca = campoBusca.value;
    // Se o campo de busca não estiver vazio, inicia a busca.
    if (termoBusca !== '') {
        iniciarBusca();
    } else {
        // Se o campo de busca for limpo, reseta para o estado inicial.
        setActiveButton(null);
        descriptionContainer.classList.remove('hidden'); // Mostra a descrição novamente
        renderizarCards([]);
    }
});

carregarDados(); // Carrega os dados em segundo plano
setupThemeSwitcher(); // Configura o seletor de temas
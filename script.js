let booksData = [];
let originalHeader = '';

// Função para carregar os dados do JSON
async function loadData() {
    try {
        const response = await fetch('livros.json');
        const data = await response.json();
        booksData = data.livros;
        
        // Configurar botões
        document.getElementById('show-overdue-btn').addEventListener('click', mostrarAtrasadosOrdenados);
        document.getElementById('reset-view-btn').addEventListener('click', () => {
            document.getElementById('books-table').classList.remove('mostrar-detalhes-atraso');
            loadBooks();
        });
        
        loadBooks();
    } catch (error) {
        console.error('Erro ao carregar os dados:', error);
        alert('Erro ao carregar os dados dos livros. Verifique o console para mais detalhes.');
    }
}

// Função para calcular dias de atraso (mantido em dias para cálculos)
function calcularDiasAtraso(dataDevolucao) {
    if (!dataDevolucao) return 0;
    
    const [dia, mes, ano] = dataDevolucao.split('/');
    const dataPrevista = new Date(ano, mes - 1, dia);
    const hoje = new Date();
    
    hoje.setHours(0, 0, 0, 0);
    dataPrevista.setHours(0, 0, 0, 0);
    
    const diff = hoje - dataPrevista;
    return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

// Função para formatar apenas a exibição (sem alterar cálculos)
function formatarExibicaoAtraso(dias) {
    if (dias === 0) return "0 dias";
    
    const anos = Math.floor(dias / 365);
    let resto = dias % 365;
    
    const meses = Math.floor(resto / 30);
    resto = resto % 30;
    
    const diasRestantes = resto;
    
    const partes = [];
    if (anos > 0) partes.push(`${anos} ano${anos > 1 ? 's' : ''}`);
    if (meses > 0) partes.push(`${meses} mês${meses > 1 ? 'es' : ''}`);
    if (diasRestantes > 0 || partes.length === 0) partes.push(`${diasRestantes} dia${diasRestantes > 1 ? 's' : ''}`);
    
    return partes.join(', ');
}

// Função para determinar a classe de atraso
function getAtrasoClass(dias) {
    if (dias > 30) return 'grave-atraso';
    if (dias > 15) return 'moderado-atraso';
    return 'leve-atraso';
}

// Função para calcular a dívida (continua usando dias)
function calcularDivida(diasAtraso) {
    return (diasAtraso * 0.5).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2
    });
}

// Função para mostrar atrasados ordenados
function mostrarAtrasadosOrdenados() {
    const atrasados = booksData.filter(book => book.status === 'ATRASADO');
    
    const atrasadosComDias = atrasados.map(book => {
        const diasAtraso = calcularDiasAtraso(book.devolucaoPrevista);
        return {
            ...book,
            textoAtraso: formatarExibicaoAtraso(diasAtraso),
            diasAtraso: diasAtraso,
            divida: calcularDivida(diasAtraso)
        }
    });
    
    atrasadosComDias.sort((a, b) => a.diasAtraso - b.diasAtraso);
    
    const tableBody = document.getElementById('books-body');
    tableBody.innerHTML = '';
    
    atrasadosComDias.forEach(book => {
        const row = document.createElement('tr');
        const atrasoClass = getAtrasoClass(book.diasAtraso);
        
        row.innerHTML = `
            <td>${book.codigoAcervo}</td>
            <td>${book.exemplarUnico}</td>
            <td>${book.titulo}</td>
            <td>${book.autor}</td>
            <td><span class="status atrasado">ATRASADO</span></td>
            <td>${book.devolucaoPrevista}</td>
            <td class="dias-atraso-cell ${atrasoClass}">${book.textoAtraso}</td>
            <td class="divida-cell">${book.divida}</td>
        `;
        
        tableBody.appendChild(row);
    });
    
    document.getElementById('books-table').classList.add('mostrar-detalhes-atraso');
}

// Função principal para carregar livros
function loadBooks(data = booksData) {
    const tableBody = document.getElementById('books-body');
    tableBody.innerHTML = '';
    
    // Atualizar estatísticas
    document.getElementById('total-books').textContent = booksData.length;
    document.getElementById('available-books').textContent = booksData.filter(b => b.status === 'DISPONÍVEL').length;
    document.getElementById('borrowed-books').textContent = booksData.filter(b => b.status === 'EMPRESTADO').length;
    document.getElementById('overdue-books').textContent = booksData.filter(b => b.status === 'ATRASADO').length;
    
    // Preencher tabela
    data.forEach(book => {
        const row = document.createElement('tr');
        let statusClass = '';
        
        if (book.status === 'DISPONÍVEL') statusClass = 'disponivel';
        else if (book.status === 'EMPRESTADO') statusClass = 'emprestado';
        else if (book.status === 'ATRASADO') statusClass = 'atrasado';
        
        const diasAtraso = book.status === 'ATRASADO' ? calcularDiasAtraso(book.devolucaoPrevista) : 0;
        const textoAtraso = book.status === 'ATRASADO' ? formatarExibicaoAtraso(diasAtraso) : '-';
        const divida = book.status === 'ATRASADO' ? calcularDivida(diasAtraso) : '-';
        
        row.innerHTML = `
            <td>${book.codigoAcervo}</td>
            <td>${book.exemplarUnico}</td>
            <td>${book.titulo}</td>
            <td>${book.autor}</td>
            <td><span class="status ${statusClass}">${book.status}</span></td>
            <td>${book.devolucaoPrevista || '-'}</td>
            <td class="dias-atraso-cell">${textoAtraso}</td>
            <td class="divida-cell">${divida}</td>
        `;
        
        tableBody.appendChild(row);
    });
    
    // Preencher filtro de códigos ACERVO
    const acervoFilter = document.getElementById('acervo-filter');
    const acervoCodes = [...new Set(booksData.map(book => book.codigoAcervo))];
    
    while (acervoFilter.options.length > 1) {
        acervoFilter.remove(1);
    }
    
    acervoCodes.forEach(code => {
        const option = document.createElement('option');
        option.value = code;
        option.textContent = code;
        acervoFilter.appendChild(option);
    });
    
    document.getElementById('books-table').classList.remove('mostrar-detalhes-atraso');
}

// Função de filtro
function filterBooks() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const statusFilter = document.getElementById('status-filter').value;
    const acervoFilter = document.getElementById('acervo-filter').value;
    
    const filteredBooks = booksData.filter(book => {
        const matchesSearch = 
            book.titulo.toLowerCase().includes(searchTerm) ||
            book.autor.toLowerCase().includes(searchTerm) ||
            book.codigoAcervo.toLowerCase().includes(searchTerm) ||
            book.exemplarUnico.toLowerCase().includes(searchTerm);
        
        const matchesStatus = statusFilter === 'all' || book.status === statusFilter;
        const matchesAcervo = acervoFilter === 'all' || book.codigoAcervo === acervoFilter;
        
        return matchesSearch && matchesStatus && matchesAcervo;
    });
    
    loadBooks(filteredBooks);
}

// Inicialização
window.onload = function() {
    loadData();
    
    document.getElementById('search-input').addEventListener('keyup', function(event) {
        if (event.key === 'Enter') {
            filterBooks();
        }
    });
};
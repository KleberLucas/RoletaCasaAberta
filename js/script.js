// Definindo o espaçamento interno e as dimensões da roleta
var padding = { top: 20, right: 40, bottom: 0, left: 0 },
    w = 700 - padding.left - padding.right,  // Largura do SVG menos o padding
    h = 700 - padding.top - padding.bottom,  // Altura do SVG menos o padding
    r = Math.min(w, h) / 2,                  // Calculando o raio do círculo da roleta
    rotation = 0,                            // Ângulo de rotação inicial
    oldrotation = 0,                         // Ângulo de rotação anterior
    picked = 100000,                         // Índice da pergunta escolhida
    oldpick = [],                            // Armazena as perguntas já escolhidas
    color = d3.scale.category20();           // Escala de cores para os setores da roleta

// Array de objetos que representam as perguntas da roleta
var data = [
    // Cada objeto tem um label (rótulo), um valor (peso) e a pergunta em si
    { "label": "CANETA", "value": 1, "question": "CANETA" }, // padding
    { "label": "LÁPIS", "value": 1, "question": "LÁPIS" }, // padding
    { "label": "BLOQUINHO", "value": 1, "question": "BLOQUINHO" }, // padding
    { "label": "CHAVEIRO", "value": 1, "question": "CHAVEIRO" }, // padding
    // Adicionar mais perguntas conforme necessário
    //{ "label": "Question 30", "value": 1, "question": "What character symbol do I use to specify multiple CSS selectors in one code block?" } //comma
];

//var data = []

// Criando um SVG e definindo sua largura e altura
var svg = d3.select('#chart')
    .append("svg")
    .data([data])
    .attr("width", w + padding.left + padding.right)
    .attr("height", h + padding.top + padding.bottom);

// Criando um grupo (g) que será o contêiner principal da roleta
var container = svg.append("g")
    .attr("class", "chartholder")
    .attr("transform", "translate(" + (w / 2 + padding.left) + "," + (h / 2 + padding.top) + ")");

// Adicionando um grupo dentro do contêiner, que irá conter as fatias da roleta
var vis = container.append("g");

// Criando a função que gera o layout de torta (pie) para as fatias da roleta
var pie = d3.layout.pie().sort(null).value(function (d) { return 1; });

// Declarando a função geradora de arcos para desenhar as fatias da roleta
var arc = d3.svg.arc().outerRadius(r);

// Selecionando os grupos onde as fatias serão desenhadas, e criando elementos de fatia com base no layout de torta
var arcs = vis.selectAll("g.slice")
    .data(pie)
    .enter()
    .append("g")
    .attr("class", "slice");

// Desenhando as fatias da roleta usando a função de arco
arcs.append("path")
    .attr("fill", function (d, i) { return color(i); })  // Cor de cada fatia
    .attr("d", function (d) { return arc(d); });        // Desenhando a fatia com base na função de arco

// Adicionando o texto (label) para cada fatia
arcs.append("text").attr("transform", function (d) {
    d.innerRadius = 0;
    d.outerRadius = r;
    d.angle = (d.startAngle + d.endAngle) / 2;
    return "rotate(" + (d.angle * 180 / Math.PI - 90) + ")translate(" + (d.outerRadius - 10) + ")";
})
    .attr("text-anchor", "end")
    .text(function (d, i) {
        return data[i].label; // Exibindo o label correspondente à fatia
    });

// Adicionando o evento de clique ao contêiner da roleta
container.on("click", spin);

// Função responsável por girar a roleta quando clicada
function spin(d) {

    container.on("click", null); // Desabilita o clique durante a rotação

    // Verificando se todas as perguntas já foram escolhidas
    if (oldpick.length == data.length) {
        console.log("done");
        container.on("click", null); // Desativa a roleta se todas as perguntas já foram vistas
        return;
    }

    // Calculando a rotação aleatória
    var ps = 360 / data.length,        // Tamanho de cada fatia em graus
        pieslice = Math.round(1440 / data.length), // Tamanho do segmento em graus para múltiplos giros
        rng = Math.floor((Math.random() * 1440) + 360); // Geração de um número aleatório para o ângulo de rotação

    rotation = (Math.round(rng / ps) * ps); // Calcula o novo ângulo de rotação

    // Calculando qual fatia foi escolhida
    picked = Math.round(data.length - (rotation % 360) / ps);
    picked = picked >= data.length ? (picked % data.length) : picked;

    // Se a pergunta já foi escolhida, gira novamente
    if (oldpick.indexOf(picked) !== -1) {
        d3.select(this).call(spin);
        return;
    } else {
        oldpick.push(picked); // Adiciona a pergunta ao array de perguntas já escolhidas
    }

    // Ajusta a rotação para que o texto da fatia fique centralizado ao parar
    rotation += 90 - Math.round(ps / 2);

    // Anima a rotação da roleta
    vis.transition()
        .duration(3000) // Duração da rotação em milissegundos
        .attrTween("transform", rotTween) // Função de interpolação da rotação
        .each("end", function () {

            // Marca a fatia da pergunta como "vista"
            d3.select(".slice:nth-child(" + (picked + 1) + ") path")
                .attr("fill", "#111");

            // Exibe a pergunta correspondente
            d3.select("#question h1")
                .text(data[picked].question);

            // Explosão de confetes ao exibir a pergunta
            confetti({
                particleCount: 1000, // Número de partículas (confetes)
                spread: 200,         // Ângulo de dispersão dos confetes
                origin: { y: 0.6 }  // Ponto de origem da explosão (ajustar se necessário)
            });

            oldrotation = rotation; // Salva o ângulo de rotação atual

            container.on("click", spin); // Reabilita o clique após a rotação
        });
}

// Desenha uma seta para indicar onde a roleta parará
svg.append("g")
    .attr("transform", "translate(" + (w + padding.left + padding.right) + "," + ((h / 2) + padding.top) + ")")
    .append("path")
    .attr("d", "M-" + (r * .15) + ",0L0," + (r * .05) + "L0,-" + (r * .05) + "Z")
    .style({ "fill": "black" });

// Desenha um círculo no centro da roleta, que funciona como um botão de "girar"
container.append("circle")
    .attr("cx", 0)
    .attr("cy", 0)
    .attr("r", 60)
    .style({ "fill": "white", "cursor": "pointer" });

// Adiciona o texto "SPIN" ao botão de girar
container.append("text")
    .attr("x", 0)
    .attr("y", 15)
    .attr("text-anchor", "middle")
    .text("GIRAR")
    .style({ "font-weight": "bold", "font-size": "30px" });

// Função de interpolação para a rotação suave da roleta
function rotTween(to) {
    var i = d3.interpolate(oldrotation % 360, rotation); // Interpola entre a rotação antiga e a nova
    return function (t) {
        return "rotate(" + i(t) + ")"; // Retorna o valor de rotação interpolado
    };
}

// Função para gerar números aleatórios (usada para criptografia, se disponível)
function getRandomNumbers() {
    var array = new Uint16Array(1000); // Cria um array de 1000 números
    var scale = d3.scale.linear().range([360, 1440]).domain([0, 100000]);

    if (window.hasOwnProperty("crypto") && typeof window.crypto.getRandomValues === "function") {
        window.crypto.getRandomValues(array); // Usa números aleatórios gerados de forma segura se disponíveis
        console.log("works");
    } else {
        // Se a criptografia não estiver disponível, usa um método menos seguro para gerar números aleatórios
        for (var i = 0; i < 1000; i++) {
            array[i] = Math.floor(Math.random() * 100000) + 1;
        }
    }

    return array; // Retorna o array de números aleatórios
}


//! =============================================================================================================

// Função para atualizar o gráfico quando novas perguntas são adicionadas ou removidas
function updateChart() {
    // Selecionando os elementos de fatia existentes e associando-os aos dados
    var arcs = vis.selectAll("g.slice").data(pie);

    // Inserindo novos grupos de fatia conforme necessário
    arcs.enter()
        .append("g")
        .attr("class", "slice")
        .append("path")
        .attr("fill", function(d, i) { return color(i); })  // Define a cor de cada fatia
        .attr("d", function(d) { return arc(d); });         // Desenha a fatia usando a função de arco

    // Atualizando as fatias existentes
    arcs.select("path")
        .attr("fill", function(d, i) { return color(i); })  // Atualiza a cor da fatia
        .attr("d", function(d) { return arc(d); });         // Atualiza o desenho da fatia

    // Removendo as fatias que não são mais necessárias
    arcs.selectAll("text").remove();
    arcs.exit().remove();

    // Adicionando o texto (label) para cada fatia
    arcs.append("text").attr("transform", function(d) {
            d.innerRadius = 0;
            d.outerRadius = r;
            d.angle = (d.startAngle + d.endAngle) / 2;
            return "rotate(" + (d.angle * 180 / Math.PI - 90) + ")translate(" + (d.outerRadius - 10) + ")";
        })
        .attr("text-anchor", "end")  // Alinha o texto no final da fatia
        .text(function(d, i) { return data[i].label; });  // Define o texto como o label correspondente
}




// Adiciona um evento de clique ao botão de adicionar pergunta
document.getElementById('addQuestionBtn').addEventListener('click', function() {
    var questionInput = document.getElementById('questionInput');  // Seleciona o campo de input de pergunta
    var questionText = questionInput.value.trim();  // Obtém e limpa o valor do input

    // Se o texto da pergunta não estiver vazio
    if (questionText !== '') {
        var newQuestion = { label: `Pergunta ${data.length + 1}`, value: 1, question: questionText };  // Cria um objeto de nova pergunta
        data.push(newQuestion);  // Adiciona a nova pergunta ao array de dados
        updateChart();  // Atualiza a roleta com a nova pergunta

        var li = document.createElement('li');  // Cria um novo item de lista
        var span = document.createElement('span');  // Cria um novo span

        span.textContent = questionText;  // Define o texto do item da lista como a pergunta
        li.appendChild(span);

        // Cria um botão de remover ao lado da pergunta na lista
        var removeBtn = document.createElement('button');
        removeBtn.textContent = 'X';  // Texto do botão de remover
        removeBtn.addEventListener('click', function() {
            var index = data.findIndex(d => d.question === questionText);  // Encontra o índice da pergunta na lista
            if (index !== -1) {
                data.splice(index, 1);  // Remove a pergunta do array de dados
                li.remove();  // Remove o item da lista correspondente
                updateChart();  // Atualiza a roleta
            }
        });

        li.appendChild(removeBtn);  // Adiciona o botão de remover ao item da lista
        document.getElementById('questionList').appendChild(li);  // Adiciona o item da lista ao DOM
        questionInput.value = '';  // Limpa o campo de input
    }
});

//! ===================
/* function updateBackground() {
    const now = new Date();
    const hours = now.getHours();
    const body = document.body;

    if (hours >= 6 && hours < 18) {
        // Dia
        body.classList.add('day');
        body.classList.remove('night');
    } else {
        // Noite
        body.classList.add('night');
        body.classList.remove('day');
    }
}

// Atualiza o fundo quando a página carrega
window.onload = updateBackground;

// Opcional: Atualiza o fundo a cada hora, para refletir mudanças ao longo do dia
setInterval(updateBackground, 3600000); */
// ==========================================================
// 1. LÓGICA DA PÁGINA INICIAL (Autenticação e Logs)
// ==========================================================

const video = document.getElementById("videoElement");
if (video) {
    navigator.mediaDevices.getUserMedia({ video: true })
      .then((s) => (video.srcObject = s))
      .catch((e) => console.log(e));
}

const btnAutenticar = document.getElementById("btnAutenticar");
if (btnAutenticar) {
    btnAutenticar.addEventListener("click", () => {
        document.getElementById("uiStatus").innerText = "Analisando Rosto...";
        document.getElementById("uiStatus").className = "sistema";

        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        fetch("/autenticar", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ image: canvas.toDataURL("image/jpeg") })
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === "sucesso") {
                document.getElementById("Nome").innerText = data.nome;
                document.getElementById("Nivel").innerText = data.nivel_texto;
                
                let statusEl = document.getElementById("uiStatus");
                statusEl.innerText = "ACESSO CONCEDIDO";
                statusEl.className = "liberado";
            } else {
                document.getElementById("Nome").innerText = "Desconhecido";
                document.getElementById("Nivel").innerText = "--";
                
                let statusEl = document.getElementById("uiStatus");
                statusEl.innerText = "ACESSO NEGADO";
                statusEl.className = "negado";
            }
            
            carregarLogsRecentes(); // Atualiza a tabela do Cofre na hora
        })
        .catch((error) => {
            console.error("Erro no servidor:", error);
            document.getElementById("uiStatus").innerText = "ERRO NO SERVIDOR";
        });
    });
}

function carregarLogsRecentes() {
    const tabelaLogs = document.getElementById("tabelaLogs");
    if (!tabelaLogs) return;

    fetch('/api/logs')
        .then(res => res.json())
        .then(logs => {
            // RECRIAMOS OS CABEÇALHOS AQUI PARA NUNCA SUMIREM
            tabelaLogs.innerHTML = `
                <tr>
                    <th>Data/Hora</th>
                    <th>Nome do Funcionário</th>
                    <th>Nível de Acesso</th>
                    <th>Status</th>
                </tr>
            `;
            
            const ultimos3 = logs.slice(0, 3);
            ultimos3.forEach(log => {
                let corStatus = log.status === 'Liberado' ? '#10b981' : '#ef4444';
                let dataFormatada = new Date(log.data_hora).toLocaleString('pt-BR');

                tabelaLogs.innerHTML += `
                    <tr>
                        <td>${dataFormatada}</td>
                        <td>${log.nome_tentativa}</td>
                        <td>${log.nivel_tentativa}</td>
                        <td style="color: ${corStatus}; font-weight: bold;">${log.status}</td>
                    </tr>
                `;
            });
        });
}

if (document.getElementById("tabelaLogs")) carregarLogsRecentes();


// ==========================================================
// 2. LÓGICA DA PÁGINA ADMIN (Cadastro, Tabela e Exclusão)
// ==========================================================

const videoAdmin = document.getElementById("videoAdmin");
if (videoAdmin) {
    navigator.mediaDevices.getUserMedia({ video: true })
        .then((s) => (videoAdmin.srcObject = s))
        .catch((e) => console.log(e));
}

const btnCadastrar = document.getElementById("btnCadastrar");
if (btnCadastrar) {
    btnCadastrar.addEventListener("click", () => {
        const nome = document.getElementById("inputNome").value;
        const nivel = document.getElementById("selectNivel").value; 
        
        if(!nome || !nivel) return alert("Preencha o nome e o nível.");

        const canvas = document.createElement("canvas");
        canvas.width = videoAdmin.videoWidth;
        canvas.height = videoAdmin.videoHeight;
        canvas.getContext("2d").drawImage(videoAdmin, 0, 0);
        
        fetch("/api/cadastrar", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nome: nome, nivel: nivel, image: canvas.toDataURL("image/jpeg") })
        })
        .then(res => res.json())
        .then(data => {
            if(data.status === "sucesso") {
                alert("Funcionário cadastrado com sucesso!");
                document.getElementById("inputNome").value = "";
                carregarTabela(); // Atualiza a tabela do Admin na hora
            }
        });
    });
}

function carregarTabela() {
    const tbody = document.getElementById('tabelaUsuarios');
    if (!tbody) return;

    fetch('/api/usuarios')
        .then(res => res.json())
        .then(usuarios => {
            // RECRIAMOS OS CABEÇALHOS DO ADMIN AQUI PARA NUNCA SUMIREM
            tbody.innerHTML = `
                <tr>
                    <th>Id</th>
                    <th>Usuario</th>
                    <th>Nivel de Acesso</th>
                    <th>Ações</th>
                </tr>
            `;
            
            usuarios.forEach(user => {
                let nivelTexto = user.nivel_acesso === 3 ? "Ministro (Nível 3)" : (user.nivel_acesso === 2 ? "Diretor (Nível 2)" : "Geral (Nível 1)");
                tbody.innerHTML += `
                    <tr>
                        <td>${user.id}</td>
                        <td>${user.nome}</td>
                        <td>${nivelTexto}</td>
                        <td>
                            <button class="btnEditar" onclick="editarUsuario(${user.id}, '${user.nome}', ${user.nivel_acesso})"><i class="fa-solid fa-pencil"></i></button>
                            <button class="btnExcluir" onclick="excluirUsuario(${user.id})"><i class="fa-solid fa-trash"></i></button>
                        </td>
                    </tr>
                `;
            });
        });
}

function excluirUsuario(id) {
    if(confirm("Tem certeza que deseja excluir este funcionário e sua biometria?")) {
        fetch(`/api/usuario/${id}`, { method: 'DELETE' })
            .then(() => carregarTabela());
    }
}

function editarUsuario(id, nomeAtual, nivelAtual) {
    const novoNome = prompt("Novo nome:", nomeAtual);
    if(novoNome) {
        const novoNivel = prompt("Novo nível (1=Geral, 2=Diretor, 3=Ministro):", nivelAtual);
        if(novoNivel && ["1", "2", "3"].includes(novoNivel)) {
            fetch(`/api/usuario/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nome: novoNome, nivel: parseInt(novoNivel) })
            }).then(() => carregarTabela());
        }
    }
}

if (document.getElementById('tabelaUsuarios')) carregarTabela();
// ==========================================================
// LÓGICA DA PÁGINA INICIAL (Autenticação no Cofre)
// ==========================================================

const video = document.getElementById("videoElement");
if (video) { // Só liga esta câmera se o vídeo da página inicial existir
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((s) => (video.srcObject = s))
      .catch((e) => console.log(e));
}

const btnAutenticar = document.getElementById("btnAutenticar");
if (btnAutenticar) { // Só adiciona o evento se o botão de autenticar existir
    btnAutenticar.addEventListener("click", () => {
        document.getElementById("uiStatus").innerText = "Analisando Rosto...";
        document.getElementById("uiStatus").className = "sistema";

        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const imageData = canvas.toDataURL("image/jpeg");

        fetch("/autenticar", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ image: imageData })
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === "sucesso") {
                document.getElementById("Nome").innerText = data.nome;
                document.getElementById("Nivel").innerText = data.nivel_texto;
                
                let statusEl = document.getElementById("uiStatus");
                statusEl.innerText = "ACESSO CONCEDIDO";
                statusEl.className = "liberado";

                let tabela = document.getElementById("tabelaLogs");
                if(tabela) {
                    tabela.innerHTML =
                        `<tr>
                            <td>Agora</td>
                            <td>${data.nome}</td>
                            <td>${data.nivel_texto}</td>
                            <td style="color: #10b981; font-weight: bold;">Liberado</td>
                        </tr>` + tabela.innerHTML;
                }
            } else {
                document.getElementById("Nome").innerText = "Desconhecido";
                document.getElementById("Nivel").innerText = "--";
                
                let statusEl = document.getElementById("uiStatus");
                statusEl.innerText = "ACESSO NEGADO";
                statusEl.className = "negado";
            }
        })
        .catch((error) => {
            console.error("Erro na comunicação com o servidor:", error);
            document.getElementById("uiStatus").innerText = "ERRO NO SERVIDOR";
        });
    });
}

// ==========================================================
// LÓGICA DA PÁGINA ADMIN (Cadastro, Edição e Exclusão)
// ==========================================================

const videoAdmin = document.getElementById("videoAdmin");
if (videoAdmin) { // Só liga esta câmera se o vídeo da página de Admin existir
    navigator.mediaDevices
        .getUserMedia({ video: true })
        .then((s) => (videoAdmin.srcObject = s))
        .catch((e) => console.log(e));
}

const btnCadastrar = document.getElementById("btnCadastrar");
if (btnCadastrar) { // Evento do botão de cadastrar
    btnCadastrar.addEventListener("click", () => {
        const nome = document.getElementById("inputNome").value;
        const nivel = document.getElementById("selectNivel").value; 
        
        if(!nome || !nivel) return alert("Preencha o nome e selecione o nível.");

        // Captura a foto da câmera do Admin
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
                document.getElementById("inputNome").value = ""; // Limpa o campo
                carregarTabela(); // Atualiza a tabela na hora
            } else {
                alert("Erro ao cadastrar.");
            }
        });
    });
}

// Função para buscar os usuários no MySQL e preencher a tabela
function carregarTabela() {
    const tbody = document.getElementById('tabelaUsuarios');
    if (!tbody) return; // Se não houver tabela nesta página, não faz nada

    fetch('/api/usuarios')
        .then(res => res.json())
        .then(usuarios => {
            tbody.innerHTML = '';
            usuarios.forEach(user => {
                let nivelTexto = user.nivel_acesso === 3 ? "Ministro (Nível 3)" : (user.nivel_acesso === 2 ? "Diretor (Nível 2)" : "Geral (Nível 1)");
                tbody.innerHTML += `
                    <tr>
                        <td>${user.id}</td>
                        <td>${user.nome}</td>
                        <td>${nivelTexto}</td>
                        <td>
                            <!-- Utilizando as suas classes CSS prontas -->
                            <button class="btnEditar" onclick="editarUsuario(${user.id}, '${user.nome}', ${user.nivel_acesso})"><i class="fa-solid fa-pencil"></i></button>
                            <button class="btnExcluir" onclick="excluirUsuario(${user.id})"><i class="fa-solid fa-trash"></i></button>
                        </td>
                    </tr>
                `;
            });
        })
        .catch(err => console.error("Erro ao carregar tabela:", err));
}

// Função para Excluir
function excluirUsuario(id) {
    if(confirm("Tem certeza que deseja excluir este funcionário e sua biometria?")) {
        fetch(`/api/usuario/${id}`, { method: 'DELETE' })
            .then(res => res.json())
            .then(data => {
                if(data.status === "sucesso") carregarTabela();
            });
    }
}

// Função para Editar
function editarUsuario(id, nomeAtual, nivelAtual) {
    const novoNome = prompt("Novo nome:", nomeAtual);
    if(novoNome) {
        const novoNivel = prompt("Novo nível (1=Geral, 2=Diretor, 3=Ministro):", nivelAtual);
        if(novoNivel && (novoNivel === "1" || novoNivel === "2" || novoNivel === "3")) {
            fetch(`/api/usuario/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nome: novoNome, nivel: parseInt(novoNivel) })
            })
            .then(res => res.json())
            .then(data => {
                if(data.status === "sucesso") carregarTabela();
            });
        } else if (novoNivel) {
            alert("Nível inválido. Use 1, 2 ou 3.");
        }
    }
}

// Executa automaticamente quando a página carrega
window.onload = () => {
    carregarTabela(); // Ele verifica sozinho se a tabela existe antes de rodar
};
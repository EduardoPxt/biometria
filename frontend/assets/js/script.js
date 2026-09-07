const video = document.getElementById("videoElement");
navigator.mediaDevices
  .getUserMedia({ video: true })
  .then((s) => (video.srcObject = s))
  .catch((e) => console.log(e));

// Simulação do Python mandando os dados para a interface
document.getElementById("btnAutenticar").addEventListener("click", () => {
  document.getElementById("uiStatus").innerText = "Analisando Rosto...";
  document.getElementById("uiStatus").className = "espera";

  setTimeout(() => {
    // Preenchendo os dados (isso virá do Python depois)
    document.getElementById("Nome").innerText = "Eduardo Peixoto";
    document.getElementById("Nivel").innerText = "Ministro (Nível 3)";

    let statusEl = document.getElementById("uiStatus");
    statusEl.innerText = "ACESSO CONCEDIDO";
    statusEl.className = "espera status-concedido";

    // Adicionando no relatório da tabela inferior
    let tabela = document.getElementById("tabelaLogs");
    tabela.innerHTML =
      `<tr>
                <td>Agora</td>
                <td>Eduardo Peixoto</td>
                <td>Nível 3 (Ministro)</td>
                <td style="color: #10b981; font-weight: bold;">Liberado</td>
            </tr>` + tabela.innerHTML;
  }, 1500);
});

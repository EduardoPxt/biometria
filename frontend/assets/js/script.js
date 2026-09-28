const video = document.getElementById("videoElement");
navigator.mediaDevices
  .getUserMedia({ video: true })
  .then((s) => (video.srcObject = s))
  .catch((e) => console.log(e));

// Comunicação real com o Python
document.getElementById("btnAutenticar").addEventListener("click", () => {
  document.getElementById("uiStatus").innerText = "Analisando Rosto...";
  document.getElementById("uiStatus").className = "sistema";

// 1. Criar um canvas invisível para capturar a fotografia atual do vídeo
  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  // 2. Converter a imagem capturada para o formato Base64 (texto)
  const imageData = canvas.toDataURL("image/jpeg");

  // 3. Enviar a imagem para o backend em Python (Rota /autenticar que vamos criar no Flask)
  fetch("/autenticar", {
      method: "POST",
      headers: {
          "Content-Type": "application/json"
      },
      body: JSON.stringify({ image: imageData })
  })
  .then(response => response.json())
  .then(data => {
      // 4. Receber a resposta do Python e atualizar a interface!
      if (data.status === "sucesso") {
          document.getElementById("Nome").innerText = data.nome;
          document.getElementById("Nivel").innerText = data.nivel_texto;
          
          let statusEl = document.getElementById("uiStatus");
          statusEl.innerText = "ACESSO CONCEDIDO";
          statusEl.className = "liberado";

          // Adicionando no relatório da tabela inferior
          let tabela = document.getElementById("tabelaLogs");
          tabela.innerHTML =
            `<tr>
                <td>Agora</td>
                <td>${data.nome}</td>
                <td>${data.nivel_texto}</td>
                <td style="color: #10b981; font-weight: bold;">Liberado</td>
            </tr>` + tabela.innerHTML;
      } else {
          // Caso o rosto não seja reconhecido
          document.getElementById("Nome").innerText = "Desconhecido";
          document.getElementById("Nivel").innerText = "--";
          
          let statusEl = document.getElementById("uiStatus");
          statusEl.innerText = "ACESSO NEGADO";
          statusEl.className = "negado"; // Certifique-se de ter esta classe no seu CSS para ficar vermelho
      }
  })
  .catch((error) => {
      console.error("Erro na comunicação com o servidor:", error);
      document.getElementById("uiStatus").innerText = "ERRO NO SERVIDOR";
  });
});
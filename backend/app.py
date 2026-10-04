from flask import Flask, render_template, request, jsonify
import base64
import os
import uuid
import reconhecimento  # Importamos o arquivo inteiro para podermos recarregar as fotos depois
from database import obter_logs, cadastrar_usuario, obter_usuarios, atualizar_usuario, excluir_usuario

app = Flask(__name__, template_folder='../frontend', static_folder='../frontend/assets')

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/autenticar', methods=['POST'])
def autenticar():
    dados = request.get_json()
    imagem_base64 = dados.get('image')

    if imagem_base64:
        _, imagem_codificada = imagem_base64.split(',', 1)
        imagem_bytes = base64.b64decode(imagem_codificada)
        
        # Chama a função de reconhecimento
        resultado = reconhecimento.processar_imagem_base64(imagem_bytes)
        return jsonify(resultado)
        
    return jsonify({"status": "falha", "mensagem": "Nenhuma imagem recebida"})

@app.route('/admin')
def admin():
    return render_template('admin.html')

@app.route('/cadastro')
def cadastro():
    return render_template('cadastro.html')

@app.route('/api/logs', methods=['GET'])
def api_logs():
    """Envia os dados da tabela para o painel de Admin"""
    logs = obter_logs()
    return jsonify(logs)

@app.route('/api/cadastrar', methods=['POST'])
def api_cadastrar():
    """Recebe a foto e os dados do novo usuário e guarda no sistema"""
    dados = request.get_json()
    nome = dados.get('nome')
    nivel = dados.get('nivel')
    imagem_base64 = dados.get('image')

    if not nome or not nivel or not imagem_base64:
        return jsonify({"status": "erro", "mensagem": "Dados incompletos"})

    # Separar o cabeçalho do Base64 e descodificar
    _, imagem_codificada = imagem_base64.split(',', 1)
    imagem_bytes = base64.b64decode(imagem_codificada)
    
    # Gerar um nome de arquivo único (ex: a1b2c3d4.jpg)
    nome_ficheiro = f"{uuid.uuid4().hex}.jpg"
    caminho_ficheiro = os.path.join("backend/rostos_autorizados", nome_ficheiro)
    
    # Guardar a foto fisicamente na pasta
    with open(caminho_ficheiro, "wb") as f:
        f.write(imagem_bytes)
        
    # Guardar no MySQL
    cadastrar_usuario(nome, int(nivel), nome_ficheiro)
    
    # Faz a IA ler a pasta novamente para aprender o rosto na hora
    reconhecimento.carregar_rostos()
    
    return jsonify({"status": "sucesso"})

@app.route('/api/usuarios', methods=['GET'])
def api_listar_usuarios():
    """Devolve a lista de todos os utilizadores para a tabela do Admin"""
    usuarios = obter_usuarios()
    return jsonify(usuarios)

@app.route('/api/usuario/<int:id_usuario>', methods=['DELETE'])
def api_excluir_usuario(id_usuario):
    """Exclui o utilizador e a foto da pasta"""
    arquivo_foto = excluir_usuario(id_usuario)
    
    # Apaga a imagem fisicamente do computador
    if arquivo_foto:
        caminho = os.path.join("backend/rostos_autorizados", arquivo_foto)
        if os.path.exists(caminho):
            os.remove(caminho)
            
    reconhecimento.carregar_rostos() # Atualiza a IA
    return jsonify({"status": "sucesso"})

@app.route('/api/usuario/<int:id_usuario>', methods=['PUT'])
def api_editar_usuario(id_usuario):
    """Atualiza os dados de um utilizador"""
    dados = request.get_json()
    atualizar_usuario(id_usuario, dados['nome'], dados['nivel'])
    reconhecimento.carregar_rostos() # Atualiza a IA
    return jsonify({"status": "sucesso"})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
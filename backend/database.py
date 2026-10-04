import mysql.connector

def conectar():
    # Conecta ao XAMPP usando a porta 3307 que configuramos
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="",
        database="biosec_db",
        port=3307
    )

def obter_usuarios():
    """Busca todos os usuários autorizados cadastrados no cofre"""
    conexao = conectar()
    cursor = conexao.cursor(dictionary=True)
    cursor.execute("SELECT * FROM usuarios")
    usuarios = cursor.fetchall()
    cursor.close()
    conexao.close()
    return usuarios

def registrar_acesso(usuario_id, nome, nivel_texto, status):
    """Salva a tentativa de acesso (liberado ou bloqueado) na tabela de auditoria"""
    conexao = conectar()
    cursor = conexao.cursor()
    sql = "INSERT INTO acessos_log (usuario_id, nome_tentativa, nivel_tentativa, status) VALUES (%s, %s, %s, %s)"
    valores = (usuario_id, nome, nivel_texto, status)
    cursor.execute(sql, valores)
    conexao.commit()
    cursor.close()
    conexao.close()


def obter_logs():
    """Devolve os últimos 50 registos de acesso para a página de Admin"""
    conexao = conectar()
    cursor = conexao.cursor(dictionary=True)
    cursor.execute("SELECT nome_tentativa, nivel_tentativa, status, data_hora FROM acessos_log ORDER BY data_hora DESC LIMIT 50")
    logs = cursor.fetchall()
    cursor.close()
    conexao.close()
    return logs

def cadastrar_usuario(nome, nivel_acesso, arquivo_foto):
    """Regista um novo utilizador no cofre"""
    conexao = conectar()
    cursor = conexao.cursor()
    sql = "INSERT INTO usuarios (nome, nivel_acesso, arquivo_foto) VALUES (%s, %s, %s)"
    cursor.execute(sql, (nome, nivel_acesso, arquivo_foto))
    conexao.commit()
    cursor.close()
    conexao.close()   

def atualizar_usuario(id_usuario, nome, nivel):
    """Atualiza o nome e o nível de um utilizador existente"""
    conexao = conectar()
    cursor = conexao.cursor()
    cursor.execute("UPDATE usuarios SET nome = %s, nivel_acesso = %s WHERE id = %s", (nome, nivel, id_usuario))
    conexao.commit()
    cursor.close()
    conexao.close()

def excluir_usuario(id_usuario):
    """Exclui um utilizador e desvincula os seus registos de acesso"""
    conexao = conectar()
    cursor = conexao.cursor()
    
    # 1. Desvincula o ID nos relatórios (para não dar erro no MySQL)
    cursor.execute("UPDATE acessos_log SET usuario_id = NULL WHERE usuario_id = %s", (id_usuario,))
    
    # 2. Descobre qual é a foto para podermos apagá-la da pasta
    cursor.execute("SELECT arquivo_foto FROM usuarios WHERE id = %s", (id_usuario,))
    resultado = cursor.fetchone()
    arquivo = resultado[0] if resultado else None
    
    # 3. Apaga o utilizador definitivamente
    cursor.execute("DELETE FROM usuarios WHERE id = %s", (id_usuario,))
    
    conexao.commit()
    cursor.close()
    conexao.close()
    
    return arquivo
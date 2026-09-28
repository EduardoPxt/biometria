import face_recognition
import cv2
import numpy as np
import os
from database import obter_usuarios, registrar_acesso

rostos_conhecidos_encodings = []
rostos_conhecidos_nomes = []
rostos_conhecidos_niveis = []
rostos_conhecidos_ids = []

def carregar_rostos():
    """Carrega as fotos de referência com base no banco de dados"""
    rostos_conhecidos_encodings.clear()
    rostos_conhecidos_nomes.clear()
    rostos_conhecidos_niveis.clear()
    rostos_conhecidos_ids.clear()
    pasta_dataset = "backend/rostos_autorizados"
    usuarios_db = obter_usuarios() # Puxa do MySQL!

    for usuario in usuarios_db:
        caminho_imagem = os.path.join(pasta_dataset, usuario["arquivo_foto"])
        if os.path.exists(caminho_imagem):
            imagem = face_recognition.load_image_file(caminho_imagem)
            encodings = face_recognition.face_encodings(imagem)
            if len(encodings) > 0:
                rostos_conhecidos_encodings.append(encodings[0])
                rostos_conhecidos_nomes.append(usuario["nome"])
                rostos_conhecidos_ids.append(usuario["id"])
                
                # Traduz o número do banco para o texto da interface
                nivel = usuario["nivel_acesso"]
                if nivel == 3: nivel_txt = "Ministro (Nível 3)"
                elif nivel == 2: nivel_txt = "Diretor (Nível 2)"
                else: nivel_txt = "Geral (Nível 1)"
                
                rostos_conhecidos_niveis.append(nivel_txt)

# Executa ao iniciar o servidor
carregar_rostos()

def processar_imagem_base64(imagem_bytes):
    """Processa a foto da câmera e verifica permissões"""
    nparr = np.frombuffer(imagem_bytes, np.uint8)
    img_cv2 = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    img_rgb = cv2.cvtColor(img_cv2, cv2.COLOR_BGR2RGB)

    localizacoes_rostos = face_recognition.face_locations(img_rgb)
    encodings_rostos = face_recognition.face_encodings(img_rgb, localizacoes_rostos)

    for encoding in encodings_rostos:
        matches = face_recognition.compare_faces(rostos_conhecidos_encodings, encoding)
        
        if True in matches:
            primeiro_match = matches.index(True)
            nome = rostos_conhecidos_nomes[primeiro_match]
            nivel = rostos_conhecidos_niveis[primeiro_match]
            usuario_id = rostos_conhecidos_ids[primeiro_match]
            
            # Registra no banco de dados que a pessoa entrou
            registrar_acesso(usuario_id, nome, nivel, "Liberado")
            
            return {"status": "sucesso", "nome": nome, "nivel_texto": nivel}

    # Se não for reconhecido, barra o acesso e registra a tentativa falha
    registrar_acesso(None, "Desconhecido", "--", "Bloqueado")
    return {"status": "falha"}
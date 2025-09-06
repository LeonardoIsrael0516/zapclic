#!/bin/bash
# 
# functions for collecting installation variables - VERSÃO CORRIGIDA
# Corrige problemas de validação e configuração

# Função para log colorido
log_info() { echo -e "\033[34m[INFO]\033[0m $1"; }
log_success() { echo -e "\033[32m[SUCCESS]\033[0m $1"; }
log_warning() { echo -e "\033[33m[WARNING]\033[0m $1"; }
log_error() { echo -e "\033[31m[ERROR]\033[0m $1"; }

# Função para validar URL
validate_url() {
    local url=$1
    local name=$2
    
    # Verificar formato básico da URL
    if [[ ! $url =~ ^https?://[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(/.*)?$ ]]; then
        log_error "URL inválida para $name: $url"
        log_info "Formato esperado: http://exemplo.com ou https://exemplo.com"
        return 1
    fi
    
    # Verificar se o domínio resolve
    local domain=$(echo "$url" | sed 's|https\?://||' | sed 's|/.*||')
    if ! nslookup "$domain" > /dev/null 2>&1; then
        log_warning "Domínio $domain pode não resolver corretamente"
        read -p "Deseja continuar mesmo assim? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            return 1
        fi
    fi
    
    log_success "URL válida para $name: $url"
    return 0
}

# Função para validar porta
validate_port() {
    local port=$1
    local name=$2
    
    # Verificar se é um número
    if ! [[ "$port" =~ ^[0-9]+$ ]]; then
        log_error "Porta inválida para $name: $port (deve ser um número)"
        return 1
    fi
    
    # Verificar range válido
    if [ "$port" -lt 1024 ] || [ "$port" -gt 65535 ]; then
        log_error "Porta inválida para $name: $port (deve estar entre 1024 e 65535)"
        return 1
    fi
    
    # Verificar se a porta está em uso
    if netstat -tlnp | grep ":$port " > /dev/null; then
        log_warning "Porta $port já está em uso"
        netstat -tlnp | grep ":$port "
        read -p "Deseja usar esta porta mesmo assim? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            return 1
        fi
    fi
    
    log_success "Porta válida para $name: $port"
    return 0
}

# Função para validar email
validate_email() {
    local email=$1
    
    if [[ ! $email =~ ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$ ]]; then
        log_error "Email inválido: $email"
        return 1
    fi
    
    log_success "Email válido: $email"
    return 0
}

# Função para validar nome de instância
validate_instance_name() {
    local name=$1
    
    # Verificar se contém apenas caracteres válidos
    if [[ ! $name =~ ^[a-zA-Z0-9_-]+$ ]]; then
        log_error "Nome de instância inválido: $name"
        log_info "Use apenas letras, números, hífen (-) e underscore (_)"
        return 1
    fi
    
    # Verificar comprimento
    if [ ${#name} -lt 3 ] || [ ${#name} -gt 30 ]; then
        log_error "Nome de instância deve ter entre 3 e 30 caracteres"
        return 1
    fi
    
    # Verificar se já existe
    if [ -d "/home/deploy/$name" ]; then
        log_warning "Instância $name já existe"
        read -p "Deseja sobrescrever? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            return 1
        fi
    fi
    
    log_success "Nome de instância válido: $name"
    return 0
}

#######################################
# collects database password - VERSÃO CORRIGIDA
# Arguments:
#   None
#######################################
inquiry_options() {
    log_info "Coletando senha do banco de dados..."
    
    while true; do
        echo
        read -p "Digite a senha do banco de dados PostgreSQL: " db_pass
        
        if [ -z "$db_pass" ]; then
            log_error "Senha não pode estar vazia"
            continue
        fi
        
        if [ ${#db_pass} -lt 8 ]; then
            log_error "Senha deve ter pelo menos 8 caracteres"
            continue
        fi
        
        # Testar conexão com o banco
        log_info "Testando conexão com o banco de dados..."
        if PGPASSWORD="$db_pass" psql -h localhost -U postgres -c "\l" > /dev/null 2>&1; then
            log_success "Conexão com banco de dados bem-sucedida"
            break
        else
            log_error "Falha na conexão com o banco de dados"
            log_info "Verifique se o PostgreSQL está rodando e a senha está correta"
            read -p "Tentar novamente? (Y/n): " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Nn]$ ]]; then
                exit 1
            fi
        fi
    done
}

#######################################
# collects instance information - VERSÃO CORRIGIDA
# Arguments:
#   None
#######################################
inquiry_add_instance() {
    log_info "Coletando informações da nova instância..."
    
    # Nome da instância
    while true; do
        echo
        read -p "Digite o nome da instância: " instancia_add
        
        if validate_instance_name "$instancia_add"; then
            break
        fi
    done
    
    # Quantidade de conexões
    while true; do
        echo
        read -p "Digite a quantidade de conexões simultâneas (padrão: 100): " maxConnections
        maxConnections=${maxConnections:-100}
        
        if [[ "$maxConnections" =~ ^[0-9]+$ ]] && [ "$maxConnections" -gt 0 ] && [ "$maxConnections" -le 1000 ]; then
            log_success "Quantidade de conexões: $maxConnections"
            break
        else
            log_error "Quantidade deve ser um número entre 1 e 1000"
        fi
    done
    
    # Quantidade de usuários
    while true; do
        echo
        read -p "Digite a quantidade máxima de usuários (padrão: 10): " maxUsers
        maxUsers=${maxUsers:-10}
        
        if [[ "$maxUsers" =~ ^[0-9]+$ ]] && [ "$maxUsers" -gt 0 ] && [ "$maxUsers" -le 100 ]; then
            log_success "Quantidade de usuários: $maxUsers"
            break
        else
            log_error "Quantidade deve ser um número entre 1 e 100"
        fi
    done
    
    # Quantidade de WhatsApp
    while true; do
        echo
        read -p "Digite a quantidade máxima de WhatsApp (padrão: 5): " maxWhats
        maxWhats=${maxWhats:-5}
        
        if [[ "$maxWhats" =~ ^[0-9]+$ ]] && [ "$maxWhats" -gt 0 ] && [ "$maxWhats" -le 50 ]; then
            log_success "Quantidade de WhatsApp: $maxWhats"
            break
        else
            log_error "Quantidade deve ser um número entre 1 e 50"
        fi
    done
    
    # URL do frontend
    while true; do
        echo
        read -p "Digite a URL do frontend (ex: https://app.exemplo.com): " frontend_url
        
        if validate_url "$frontend_url" "Frontend"; then
            break
        fi
    done
    
    # Porta do frontend
    while true; do
        echo
        read -p "Digite a porta do frontend (padrão: 3000): " frontend_port
        frontend_port=${frontend_port:-3000}
        
        if validate_port "$frontend_port" "Frontend"; then
            break
        fi
    done
    
    # URL do backend
    while true; do
        echo
        read -p "Digite a URL do backend (ex: https://api.exemplo.com): " backend_url
        
        if validate_url "$backend_url" "Backend"; then
            break
        fi
    done
    
    # Porta do backend
    while true; do
        echo
        read -p "Digite a porta do backend (padrão: 4000): " backend_port
        backend_port=${backend_port:-4000}
        
        if validate_port "$backend_port" "Backend"; then
            break
        fi
    done
    
    # Email para certificados SSL
    while true; do
        echo
        read -p "Digite o email para certificados SSL: " deploy_email
        
        if validate_email "$deploy_email"; then
            break
        fi
    done
    
    # Resumo das configurações
    echo
    log_info "=== RESUMO DAS CONFIGURAÇÕES ==="
    echo "Instância: $instancia_add"
    echo "Conexões: $maxConnections"
    echo "Usuários: $maxUsers"
    echo "WhatsApp: $maxWhats"
    echo "Frontend: $frontend_url (porta $frontend_port)"
    echo "Backend: $backend_url (porta $backend_port)"
    echo "Email: $deploy_email"
    echo
    
    read -p "Confirma as configurações? (Y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Nn]$ ]]; then
        log_info "Configuração cancelada pelo usuário"
        exit 0
    fi
    
    log_success "Configurações confirmadas"
}

#######################################
# collects update information - VERSÃO CORRIGIDA
# Arguments:
#   None
#######################################
inquiry_update_instance() {
    log_info "Coletando informações para atualização..."
    
    # Listar instâncias existentes
    echo
    log_info "Instâncias disponíveis:"
    if [ -d "/home/deploy" ]; then
        ls -1 /home/deploy/ | grep -v "^\\."
    else
        log_error "Diretório /home/deploy não encontrado"
        exit 1
    fi
    
    # Selecionar instância
    while true; do
        echo
        read -p "Digite o nome da instância para atualizar: " empresa_atualizar
        
        if [ -z "$empresa_atualizar" ]; then
            log_error "Nome da instância não pode estar vazio"
            continue
        fi
        
        if [ ! -d "/home/deploy/$empresa_atualizar" ]; then
            log_error "Instância $empresa_atualizar não encontrada"
            continue
        fi
        
        log_success "Instância selecionada: $empresa_atualizar"
        break
    done
    
    # Confirmar atualização
    echo
    log_warning "Esta operação irá atualizar a instância $empresa_atualizar"
    log_warning "O serviço será temporariamente interrompido durante a atualização"
    
    read -p "Deseja continuar? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Atualização cancelada pelo usuário"
        exit 0
    fi
    
    log_success "Atualização confirmada para $empresa_atualizar"
}

#######################################
# collects deletion information - VERSÃO CORRIGIDA
# Arguments:
#   None
#######################################
inquiry_delete_instance() {
    log_info "Coletando informações para exclusão..."
    
    # Listar instâncias existentes
    echo
    log_info "Instâncias disponíveis:"
    if [ -d "/home/deploy" ]; then
        ls -1 /home/deploy/ | grep -v "^\\."
    else
        log_error "Diretório /home/deploy não encontrado"
        exit 1
    fi
    
    # Selecionar instância
    while true; do
        echo
        read -p "Digite o nome da instância para EXCLUIR: " empresa_delete
        
        if [ -z "$empresa_delete" ]; then
            log_error "Nome da instância não pode estar vazio"
            continue
        fi
        
        if [ ! -d "/home/deploy/$empresa_delete" ]; then
            log_error "Instância $empresa_delete não encontrada"
            continue
        fi
        
        log_success "Instância selecionada: $empresa_delete"
        break
    done
    
    # Confirmar exclusão
    echo
    log_error "⚠️  ATENÇÃO: OPERAÇÃO IRREVERSÍVEL ⚠️"
    log_error "Esta operação irá EXCLUIR PERMANENTEMENTE:"
    echo "  - Todos os arquivos da instância $empresa_delete"
    echo "  - Banco de dados da instância"
    echo "  - Configurações do Nginx"
    echo "  - Certificados SSL"
    echo "  - Containers Docker"
    echo "  - Processos PM2"
    echo
    
    read -p "Digite 'EXCLUIR PERMANENTEMENTE' para confirmar: " confirmacao
    
    if [ "$confirmacao" != "EXCLUIR PERMANENTEMENTE" ]; then
        log_info "Exclusão cancelada pelo usuário"
        exit 0
    fi
    
    log_warning "Exclusão confirmada para $empresa_delete"
}

#######################################
# collects system lock information - VERSÃO CORRIGIDA
# Arguments:
#   None
#######################################
inquiry_block_system() {
    log_info "Configurando bloqueio do sistema..."
    
    echo
    log_warning "Esta função irá bloquear o acesso ao sistema"
    log_info "Opções disponíveis:"
    echo "1) Bloquear temporariamente (modo manutenção)"
    echo "2) Bloquear permanentemente"
    echo "3) Cancelar"
    
    while true; do
        echo
        read -p "Escolha uma opção (1-3): " opcao_bloqueio
        
        case $opcao_bloqueio in
            1)
                log_info "Modo manutenção selecionado"
                read -p "Digite a mensagem de manutenção: " mensagem_manutencao
                mensagem_manutencao=${mensagem_manutencao:-"Sistema em manutenção"}
                tipo_bloqueio="manutencao"
                break
                ;;
            2)
                log_warning "Bloqueio permanente selecionado"
                read -p "Digite o motivo do bloqueio: " motivo_bloqueio
                motivo_bloqueio=${motivo_bloqueio:-"Sistema bloqueado"}
                tipo_bloqueio="permanente"
                break
                ;;
            3)
                log_info "Operação cancelada"
                exit 0
                ;;
            *)
                log_error "Opção inválida"
                ;;
        esac
    done
    
    # Confirmar bloqueio
    echo
    log_warning "Confirma o bloqueio do sistema?"
    if [ "$tipo_bloqueio" = "manutencao" ]; then
        echo "Tipo: Manutenção temporária"
        echo "Mensagem: $mensagem_manutencao"
    else
        echo "Tipo: Bloqueio permanente"
        echo "Motivo: $motivo_bloqueio"
    fi
    
    read -p "Confirmar? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Bloqueio cancelado"
        exit 0
    fi
    
    log_success "Bloqueio confirmado"
}

#######################################
# main menu - VERSÃO CORRIGIDA
# Arguments:
#   None
#######################################
inquiry_options_installer() {
    clear
    print_banner
    
    echo
    log_info "=== INSTALADOR ZAPCLIC - VERSÃO CORRIGIDA ==="
    echo
    echo "Escolha uma opção:"
    echo
    echo "1) 🚀 Instalar nova instância"
    echo "2) 🔄 Atualizar instância existente"
    echo "3) 🗑️  Excluir instância"
    echo "4) 🔒 Bloquear sistema"
    echo "5) 🏥 Verificar saúde do sistema"
    echo "6) ⚡ Otimizar sistema"
    echo "7) 🔧 Diagnóstico de problemas"
    echo "8) ❌ Sair"
    echo
    
    while true; do
        read -p "Digite sua opção (1-8): " opcao
        
        case $opcao in
            1)
                log_success "Instalação de nova instância selecionada"
                inquiry_options
                inquiry_add_instance
                return 0
                ;;
            2)
                log_success "Atualização de instância selecionada"
                inquiry_options
                inquiry_update_instance
                return 0
                ;;
            3)
                log_success "Exclusão de instância selecionada"
                inquiry_delete_instance
                return 0
                ;;
            4)
                log_success "Bloqueio de sistema selecionado"
                inquiry_block_system
                return 0
                ;;
            5)
                log_success "Verificação de saúde selecionada"
                system_health_check
                read -p "Pressione Enter para continuar..."
                inquiry_options_installer
                ;;
            6)
                log_success "Otimização de sistema selecionada"
                system_optimize
                read -p "Pressione Enter para continuar..."
                inquiry_options_installer
                ;;
            7)
                log_success "Diagnóstico selecionado"
                if [ -f "./diagnose-installation.sh" ]; then
                    bash ./diagnose-installation.sh
                else
                    log_error "Script de diagnóstico não encontrado"
                fi
                read -p "Pressione Enter para continuar..."
                inquiry_options_installer
                ;;
            8)
                log_info "Saindo do instalador..."
                exit 0
                ;;
            *)
                log_error "Opção inválida. Digite um número de 1 a 8."
                ;;
        esac
    done
}
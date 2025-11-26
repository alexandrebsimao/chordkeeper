class PermissionService
  PERMISSIONS = {
    read: [:owner, :admin, :editor, :read_only],
    edit: [:owner, :admin, :editor],
    admin: [:owner, :admin],
    owner: [:owner],
    share: [:owner, :admin, :editor]
  }.freeze

  def initialize(library, user)
    @library = library
    @user = user
  end

  def can?(action)
    return false if @library.nil? || @user.nil?
    
    # Verificar se a permissão existe
    allowed_roles = PERMISSIONS[action.to_sym]
    return false if allowed_roles.nil?
    
    # Owner sempre tem todas as permissões (se a permissão existir)
    return true if @library.owner_id == @user.id
    
    library_user = @library.library_users.find_by(user: @user)
    return false if library_user.nil?
    
    allowed_roles.include?(library_user.role.to_sym)
  end

  def can_read?
    can?(:read)
  end

  def can_edit?
    can?(:edit)
  end

  def can_admin?
    can?(:admin)
  end

  def is_owner?
    can?(:owner)
  end

  def can_share?
    can?(:share)
  end

  def role
    return nil if @library.nil? || @user.nil?
    
    # Owner sempre é owner
    return :owner if @library.owner_id == @user.id
    
    library_user = @library.library_users.find_by(user: @user)
    library_user&.role&.to_sym
  end

  def self.can?(library, user, action)
    new(library, user).can?(action)
  end

  def self.authorize!(library, user, action)
    unless new(library, user).can?(action)
      raise PermissionError.new("Você não tem permissão para #{action_message(action)}.")
    end
  end

  private

  def self.action_message(action)
    {
      read: 'visualizar',
      edit: 'editar',
      admin: 'administrar',
      owner: 'gerenciar proprietários',
      share: 'compartilhar'
    }[action.to_sym] || action.to_s
  end

  class PermissionError < StandardError; end
end

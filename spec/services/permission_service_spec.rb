require 'rails_helper'

RSpec.describe PermissionService, type: :service do
  let(:owner) { create(:user) }
  let(:admin) { create(:user) }
  let(:editor) { create(:user) }
  let(:read_only_user) { create(:user) }
  let(:non_member) { create(:user) }
  
  let(:library) { create(:library, owner: owner) }
  
  before do
    create(:library_user, user: owner, library: library, role: 'owner')
    create(:library_user, user: admin, library: library, role: 'admin')
    create(:library_user, user: editor, library: library, role: 'editor')
    create(:library_user, user: read_only_user, library: library, role: 'read_only')
  end

  describe '#can?' do
    context 'quando valida permissão :read' do
      it 'permite owner' do
        service = described_class.new(library, owner)
        expect(service.can?(:read)).to be true
      end

      it 'permite admin' do
        service = described_class.new(library, admin)
        expect(service.can?(:read)).to be true
      end

      it 'permite editor' do
        service = described_class.new(library, editor)
        expect(service.can?(:read)).to be true
      end

      it 'permite read_only' do
        service = described_class.new(library, read_only_user)
        expect(service.can?(:read)).to be true
      end

      it 'nega não-membro' do
        service = described_class.new(library, non_member)
        expect(service.can?(:read)).to be false
      end
    end

    context 'quando valida permissão :edit' do
      it 'permite owner' do
        service = described_class.new(library, owner)
        expect(service.can?(:edit)).to be true
      end

      it 'permite admin' do
        service = described_class.new(library, admin)
        expect(service.can?(:edit)).to be true
      end

      it 'permite editor' do
        service = described_class.new(library, editor)
        expect(service.can?(:edit)).to be true
      end

      it 'nega read_only' do
        service = described_class.new(library, read_only_user)
        expect(service.can?(:edit)).to be false
      end

      it 'nega não-membro' do
        service = described_class.new(library, non_member)
        expect(service.can?(:edit)).to be false
      end
    end

    context 'quando valida permissão :admin' do
      it 'permite owner' do
        service = described_class.new(library, owner)
        expect(service.can?(:admin)).to be true
      end

      it 'permite admin' do
        service = described_class.new(library, admin)
        expect(service.can?(:admin)).to be true
      end

      it 'nega editor' do
        service = described_class.new(library, editor)
        expect(service.can?(:admin)).to be false
      end

      it 'nega read_only' do
        service = described_class.new(library, read_only_user)
        expect(service.can?(:admin)).to be false
      end

      it 'nega não-membro' do
        service = described_class.new(library, non_member)
        expect(service.can?(:admin)).to be false
      end
    end

    context 'quando valida permissão :owner' do
      it 'permite owner' do
        service = described_class.new(library, owner)
        expect(service.can?(:owner)).to be true
      end

      it 'nega admin' do
        service = described_class.new(library, admin)
        expect(service.can?(:owner)).to be false
      end

      it 'nega editor' do
        service = described_class.new(library, editor)
        expect(service.can?(:owner)).to be false
      end

      it 'nega read_only' do
        service = described_class.new(library, read_only_user)
        expect(service.can?(:owner)).to be false
      end

      it 'nega não-membro' do
        service = described_class.new(library, non_member)
        expect(service.can?(:owner)).to be false
      end
    end

    context 'quando valida permissão :share' do
      it 'permite owner' do
        service = described_class.new(library, owner)
        expect(service.can?(:share)).to be true
      end

      it 'permite admin' do
        service = described_class.new(library, admin)
        expect(service.can?(:share)).to be true
      end

      it 'permite editor' do
        service = described_class.new(library, editor)
        expect(service.can?(:share)).to be true
      end

      it 'nega read_only' do
        service = described_class.new(library, read_only_user)
        expect(service.can?(:share)).to be false
      end

      it 'nega não-membro' do
        service = described_class.new(library, non_member)
        expect(service.can?(:share)).to be false
      end
    end

    context 'quando library é nil' do
      it 'retorna false' do
        service = described_class.new(nil, owner)
        expect(service.can?(:read)).to be false
      end
    end

    context 'quando user é nil' do
      it 'retorna false' do
        service = described_class.new(library, nil)
        expect(service.can?(:read)).to be false
      end
    end

    context 'quando permissão não existe' do
      it 'retorna false' do
        service = described_class.new(library, owner)
        expect(service.can?(:invalid_permission)).to be false
      end
    end
  end

  describe '#can_read?' do
    it 'delega para can?(:read)' do
      service = described_class.new(library, owner)
      expect(service.can_read?).to eq(service.can?(:read))
    end
  end

  describe '#can_edit?' do
    it 'delega para can?(:edit)' do
      service = described_class.new(library, admin)
      expect(service.can_edit?).to eq(service.can?(:edit))
    end
  end

  describe '#can_admin?' do
    it 'delega para can?(:admin)' do
      service = described_class.new(library, admin)
      expect(service.can_admin?).to eq(service.can?(:admin))
    end
  end

  describe '#is_owner?' do
    it 'delega para can?(:owner)' do
      service = described_class.new(library, owner)
      expect(service.is_owner?).to eq(service.can?(:owner))
    end
  end

  describe '#can_share?' do
    it 'delega para can?(:share)' do
      service = described_class.new(library, editor)
      expect(service.can_share?).to eq(service.can?(:share))
    end
  end

  describe '#role' do
    it 'retorna :owner para proprietário' do
      service = described_class.new(library, owner)
      expect(service.role).to eq(:owner)
    end

    it 'retorna :admin para administrador' do
      service = described_class.new(library, admin)
      expect(service.role).to eq(:admin)
    end

    it 'retorna :editor para editor' do
      service = described_class.new(library, editor)
      expect(service.role).to eq(:editor)
    end

    it 'retorna :read_only para usuário somente leitura' do
      service = described_class.new(library, read_only_user)
      expect(service.role).to eq(:read_only)
    end

    it 'retorna nil para não-membro' do
      service = described_class.new(library, non_member)
      expect(service.role).to be_nil
    end

    it 'retorna nil quando library é nil' do
      service = described_class.new(nil, owner)
      expect(service.role).to be_nil
    end

    it 'retorna nil quando user é nil' do
      service = described_class.new(library, nil)
      expect(service.role).to be_nil
    end
  end

  describe '.can?' do
    it 'cria instância e verifica permissão' do
      expect(described_class.can?(library, owner, :read)).to be true
      expect(described_class.can?(library, non_member, :read)).to be false
    end
  end

  describe '.authorize!' do
    context 'quando usuário tem permissão' do
      it 'não levanta erro' do
        expect {
          described_class.authorize!(library, owner, :read)
        }.not_to raise_error
      end
    end

    context 'quando usuário não tem permissão' do
      it 'levanta PermissionError para :read' do
        expect {
          described_class.authorize!(library, non_member, :read)
        }.to raise_error(PermissionService::PermissionError, /visualizar/)
      end

      it 'levanta PermissionError para :edit' do
        expect {
          described_class.authorize!(library, read_only_user, :edit)
        }.to raise_error(PermissionService::PermissionError, /editar/)
      end

      it 'levanta PermissionError para :admin' do
        expect {
          described_class.authorize!(library, editor, :admin)
        }.to raise_error(PermissionService::PermissionError, /administrar/)
      end

      it 'levanta PermissionError para :owner' do
        expect {
          described_class.authorize!(library, admin, :owner)
        }.to raise_error(PermissionService::PermissionError, /gerenciar proprietários/)
      end

      it 'levanta PermissionError para :share' do
        expect {
          described_class.authorize!(library, read_only_user, :share)
        }.to raise_error(PermissionService::PermissionError, /compartilhar/)
      end
    end
  end
end

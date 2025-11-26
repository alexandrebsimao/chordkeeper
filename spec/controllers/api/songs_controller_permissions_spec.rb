require 'rails_helper'

RSpec.describe Api::SongsController, type: :controller do
  let(:owner) { create(:user) }
  let(:admin) { create(:user) }
  let(:editor) { create(:user) }
  let(:read_only_user) { create(:user) }
  
  let(:library) { create(:library, owner: owner) }
  let(:song) { create(:song, library: library) }
  
  before do
    create(:library_user, user: owner, library: library, role: 'owner', is_current_scope: true)
    create(:library_user, user: admin, library: library, role: 'admin', is_current_scope: true)
    create(:library_user, user: editor, library: library, role: 'editor', is_current_scope: true)
    create(:library_user, user: read_only_user, library: library, role: 'read_only', is_current_scope: true)
  end

  describe 'GET #index' do
    context 'owner' do
      before { sign_in owner }
      
      it 'permite acesso' do
        get :index
        expect(response).to have_http_status(:ok)
      end
    end

    context 'admin' do
      before { sign_in admin }
      
      it 'permite acesso' do
        get :index
        expect(response).to have_http_status(:ok)
      end
    end

    context 'editor' do
      before { sign_in editor }
      
      it 'permite acesso' do
        get :index
        expect(response).to have_http_status(:ok)
      end
    end

    context 'read_only' do
      before { sign_in read_only_user }
      
      it 'permite acesso' do
        get :index
        expect(response).to have_http_status(:ok)
      end
    end
  end

  describe 'GET #show' do
    context 'read_only' do
      before { sign_in read_only_user }
      
      it 'permite visualizar' do
        get :show, params: { id: song.id }
        expect(response).to have_http_status(:ok)
      end
    end
  end

  describe 'POST #create' do
    let(:song_params) { { song: { title: 'Nova Música', content: 'Conteúdo', library_id: library.id } } }

    context 'owner' do
      before { sign_in owner }
      
      it 'permite criar' do
        expect {
          post :create, params: song_params
        }.to change(Song, :count).by(1)
        expect(response).to have_http_status(:created)
      end
    end

    context 'admin' do
      before { sign_in admin }
      
      it 'permite criar' do
        expect {
          post :create, params: song_params
        }.to change(Song, :count).by(1)
        expect(response).to have_http_status(:created)
      end
    end

    context 'editor' do
      before { sign_in editor }
      
      it 'permite criar' do
        expect {
          post :create, params: song_params
        }.to change(Song, :count).by(1)
        expect(response).to have_http_status(:created)
      end
    end

    context 'read_only' do
      before { sign_in read_only_user }
      
      it 'nega criação' do
        expect {
          post :create, params: song_params
        }.not_to change(Song, :count)
        expect(response).to have_http_status(:forbidden)
        expect(JSON.parse(response.body)['error']).to include('editar')
      end
    end
  end

  describe 'PATCH #update' do
    let(:update_params) { { id: song.id, song: { title: 'Título Atualizado' } } }

    context 'owner' do
      before { sign_in owner }
      
      it 'permite atualizar' do
        patch :update, params: update_params
        expect(response).to have_http_status(:ok)
        expect(song.reload.title).to eq('Título Atualizado')
      end
    end

    context 'admin' do
      before { sign_in admin }
      
      it 'permite atualizar' do
        patch :update, params: update_params
        expect(response).to have_http_status(:ok)
      end
    end

    context 'editor' do
      before { sign_in editor }
      
      it 'permite atualizar' do
        patch :update, params: update_params
        expect(response).to have_http_status(:ok)
      end
    end

    context 'read_only' do
      before { sign_in read_only_user }
      
      it 'nega atualização' do
        patch :update, params: update_params
        expect(response).to have_http_status(:forbidden)
        expect(JSON.parse(response.body)['error']).to include('editar')
      end
    end
  end

  describe 'DELETE #destroy' do
    context 'owner' do
      before { sign_in owner }
      
      it 'permite deletar' do
        delete :destroy, params: { id: song.id }
        expect(response).to have_http_status(:ok)
      end
    end

    context 'admin' do
      before { sign_in admin }
      
      it 'permite deletar' do
        delete :destroy, params: { id: song.id }
        expect(response).to have_http_status(:ok)
      end
    end

    context 'editor' do
      before { sign_in editor }
      
      it 'permite deletar' do
        delete :destroy, params: { id: song.id }
        expect(response).to have_http_status(:ok)
      end
    end

    context 'read_only' do
      before { sign_in read_only_user }
      
      it 'nega deleção' do
        delete :destroy, params: { id: song.id }
        expect(response).to have_http_status(:forbidden)
        expect(JSON.parse(response.body)['error']).to include('editar')
      end
    end
  end

  describe 'POST #transpose' do
    let(:transpose_params) { { id: song.id, transpose_key: 'D' } }

    context 'editor' do
      before { sign_in editor }
      
      it 'permite transpor' do
        post :transpose, params: transpose_params
        expect(response).to have_http_status(:ok)
      end
    end

    context 'read_only' do
      before { sign_in read_only_user }
      
      it 'permite transpor (não modifica original)' do
        post :transpose, params: transpose_params
        expect(response).to have_http_status(:ok)
      end
    end
  end
end

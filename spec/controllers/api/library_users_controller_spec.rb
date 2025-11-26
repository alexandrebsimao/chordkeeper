require 'rails_helper'

RSpec.describe Api::LibraryUsersController, type: :controller do
  let(:owner) { create(:user) }
  let(:admin_user) { create(:user) }
  let(:editor_user) { create(:user) }
  let(:read_only_user) { create(:user) }
  let(:other_user) { create(:user) }
  let(:library) { create(:library, owner: owner) }

  before do
    # Setup library users with different roles
    create(:library_user, library: library, user: admin_user, role: 'admin')
    create(:library_user, library: library, user: editor_user, role: 'editor')
    create(:library_user, library: library, user: read_only_user, role: 'read_only')
  end

  describe 'GET #index' do
    context 'when user is owner' do
      before { sign_in owner }

      it 'returns list of library users' do
        get :index, params: { library_id: library.id }
        expect(response).to have_http_status(:success)
      end
    end

    context 'when user is admin' do
      before { sign_in admin_user }

      it 'returns list of library users' do
        get :index, params: { library_id: library.id }
        expect(response).to have_http_status(:success)
      end
    end

    context 'when user is editor' do
      before { sign_in editor_user }

      it 'returns list of library users' do
        get :index, params: { library_id: library.id }
        expect(response).to have_http_status(:success)
      end
    end
  end

  describe 'POST #create' do
    let(:new_user) { create(:user) }
    let(:valid_params) do
      {
        library_id: library.id,
        library_user: {
          email: new_user.email,
          permission: 'editor'
        }
      }
    end

    context 'when user is owner' do
      before { sign_in owner }

      it 'creates a new library user' do
        expect {
          post :create, params: valid_params
        }.to change(LibraryUser, :count).by(1)
        expect(response).to have_http_status(:created)
      end
    end

    context 'when user is admin' do
      before { sign_in admin_user }

      it 'creates a new library user' do
        expect {
          post :create, params: valid_params
        }.to change(LibraryUser, :count).by(1)
        expect(response).to have_http_status(:created)
      end
    end

    context 'when user is editor' do
      before { sign_in editor_user }

      it 'denies access' do
        expect {
          post :create, params: valid_params
        }.not_to change(LibraryUser, :count)
        expect(response).to have_http_status(:forbidden)
        expect(JSON.parse(response.body)['error']).to eq('Apenas administradores podem gerenciar usuários')
      end
    end

    context 'when user is read_only' do
      before { sign_in read_only_user }

      it 'denies access' do
        expect {
          post :create, params: valid_params
        }.not_to change(LibraryUser, :count)
        expect(response).to have_http_status(:forbidden)
        expect(JSON.parse(response.body)['error']).to eq('Apenas administradores podem gerenciar usuários')
      end
    end
  end

  describe 'PATCH #update' do
    let(:library_user_to_update) { create(:library_user, library: library, user: other_user, role: 'read_only') }
    let(:update_params) do
      {
        library_id: library.id,
        id: library_user_to_update.id,
        library_user: {
          permission: 'editor'
        }
      }
    end

    context 'when user is owner' do
      before { sign_in owner }

      it 'updates the library user role' do
        patch :update, params: update_params
        expect(response).to have_http_status(:success)
        expect(library_user_to_update.reload.role).to eq('editor')
      end
    end

    context 'when user is admin' do
      before { sign_in admin_user }

      it 'updates the library user role' do
        patch :update, params: update_params
        expect(response).to have_http_status(:success)
        expect(library_user_to_update.reload.role).to eq('editor')
      end
    end

    context 'when user is editor' do
      before { sign_in editor_user }

      it 'denies access' do
        patch :update, params: update_params
        expect(response).to have_http_status(:forbidden)
        expect(JSON.parse(response.body)['error']).to eq('Apenas administradores podem gerenciar usuários')
        expect(library_user_to_update.reload.role).to eq('read_only')
      end
    end

    context 'when user is read_only' do
      before { sign_in read_only_user }

      it 'denies access' do
        patch :update, params: update_params
        expect(response).to have_http_status(:forbidden)
        expect(JSON.parse(response.body)['error']).to eq('Apenas administradores podem gerenciar usuários')
        expect(library_user_to_update.reload.role).to eq('read_only')
      end
    end
  end

  describe 'DELETE #destroy' do
    let(:library_user_to_delete) { create(:library_user, library: library, user: other_user, role: 'editor') }
    let(:delete_params) do
      {
        library_id: library.id,
        id: library_user_to_delete.id
      }
    end

    context 'when user is owner' do
      before { sign_in owner }

      it 'deletes the library user' do
        library_user_to_delete # create the record
        expect {
          delete :destroy, params: delete_params
        }.to change(LibraryUser, :count).by(-1)
        expect(response).to have_http_status(:no_content)
      end
    end

    context 'when user is admin' do
      before { sign_in admin_user }

      it 'deletes the library user' do
        library_user_to_delete # create the record
        expect {
          delete :destroy, params: delete_params
        }.to change(LibraryUser, :count).by(-1)
        expect(response).to have_http_status(:no_content)
      end
    end

    context 'when user is editor' do
      before { sign_in editor_user }

      it 'denies access' do
        library_user_to_delete # create the record
        expect {
          delete :destroy, params: delete_params
        }.not_to change(LibraryUser, :count)
        expect(response).to have_http_status(:forbidden)
        expect(JSON.parse(response.body)['error']).to eq('Apenas administradores podem gerenciar usuários')
      end
    end

    context 'when user is read_only' do
      before { sign_in read_only_user }

      it 'denies access' do
        library_user_to_delete # create the record
        expect {
          delete :destroy, params: delete_params
        }.not_to change(LibraryUser, :count)
        expect(response).to have_http_status(:forbidden)
        expect(JSON.parse(response.body)['error']).to eq('Apenas administradores podem gerenciar usuários')
      end
    end
  end
end

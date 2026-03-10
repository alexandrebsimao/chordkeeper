class UserMailer < ApplicationMailer
  default from: 'Contato <contato@innapses.com>' # this domain must be verified with Resend
  def welcome_email
    @user = params[:user]
    @url = 'http://example.com/login'
    mail(to: ["alexandreabs92@gmail.com"], subject: 'hello world')
  end
end
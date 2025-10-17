FROM ruby:3.4.1
RUN apt-get update -qq && apt-get install -y nodejs yarn postgresql-client build-essential apt-utils libpq-dev
RUN mkdir /myapp
WORKDIR /myapp
RUN gem install bundler
RUN gem install rails
COPY Gemfile* ./
RUN bundle install

ADD . /myapp

EXPOSE 3000

CMD /bin/bash
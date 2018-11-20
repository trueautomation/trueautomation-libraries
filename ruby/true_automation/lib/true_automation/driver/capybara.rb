require_relative '../client'

module TrueAutomation
  class RecordNotFound < StandardError; end

  module Driver
    class Capybara < Capybara::Selenium::Driver
      def initialize(app, **options)
        @port = options.delete(:port) || 9515
        @driver = options.delete(:driver)
        @driver_version = options.delete(:driver_version)

        super(app, options)

        @ta_client = TrueAutomation::Client.new
        @remote = ''

        options ||= {}
        ta_url = options[:ta_url] || "http://localhost:#{@port}/"

        capabilities = options[:desired_capabilities]
        capabilities ||= {}

        if options and options[:browser] == :remote
          raise 'Remote driver URL is not specified' unless options[:url]
          capabilities[:taRemoteUrl] = options[:url]
          @remote = ' --remote'
        else
          capabilities[:browser] = options[:browser] || :chrome
        end

        @options.merge!(browser: :remote,
                        url: ta_url,
                        desired_capabilities: capabilities)
      end

      def browser
        unless @browser
          @ta_client.start(port: @port, remote: @remote, driver: @driver, driver_version: @driver_version)

          @ta_client.wait_until_start

          at_exit do
            @ta_client.stop
          end

          super
        end
        @browser
      end
    end
  end
end

require_relative '../client'

module TrueAutomation
  module Driver
    class Capybara < Capybara::Selenium::Driver
      def initialize(app, **options)
        @port = options.delete(:port) || 9515

        super(app, options)

        @ta_client = TrueAutomation::Client.new

        ta_url = options.try(:[], :ta_url) || "http://localhost:#{@port}/"

        capabilities = options.nil? ? nil : options[:desired_capabilities]
        capabilities ||= {}
        
        if options.present? and options[:browser] == :remote
          raise 'Remote driver URL is not specified' unless options[:url]
          capabilities[:taRemoteUrl] = options[:url]
        else
          capabilities[:browser] = :chrome
        end

        @options.merge!(browser: :remote,
                        url: ta_url,
                        desired_capabilities: capabilities)
      end

      def browser
        unless @browser
          @ta_client.start(port: @port)

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
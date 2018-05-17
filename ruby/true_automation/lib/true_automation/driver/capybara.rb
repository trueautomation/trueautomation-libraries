require_relative '../client'

module TrueAutomation
  module Driver
    class Capybara < Capybara::Selenium::Driver
      def initialize(app, **options)
        @port = options.delete(:port) || 9515

        super(app, options)

        @ta_client = TrueAutomation::Client.new

        capabilities = options.nil? ? nil : options[:desired_capabilities]
        capabilities ||= {}
        capabilities[:browser] = :chrome

        @options.merge!(browser: :remote,
                        url: "http://localhost:#{@port}/",
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
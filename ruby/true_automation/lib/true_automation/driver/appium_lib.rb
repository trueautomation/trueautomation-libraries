require_relative '../client'

module TrueAutomation
  module Driver
    class AppiumLib < Appium::Core::Driver
      def initialize(opts = {})
        @ta_client = TrueAutomation::Client.new
        @remote = ''
        super
      end

      def start_driver(server_url: nil,
                       http_client_ops: { http_client: nil, open_timeout: 999_999, read_timeout: 999_999 })
        @ta_client.start(port: @port,
                         remote: @remote,
                         ta_debug: @ta_debug,
                         driver: 'appium')

        @ta_client.wait_until_start

        at_exit do
          @ta_client.stop
        end
        super
      end
    end
  end
end

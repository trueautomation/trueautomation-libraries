require_relative '../client'

module TrueAutomation
  module Driver
    class AppiumLib < Appium::Core::Driver
      def initialize(**opts)
        @ta_client = TrueAutomation::Client.new
        @remote = ''
        super(**opts)
      end

      def start_driver(**opts)
        @ta_client.start(port: @port,
                         remote: @remote,
                         ta_debug: @ta_debug,
                         driver: 'appium')

        @ta_client.wait_until_start

        at_exit do
          @ta_client.stop
        end
        super(**opts)
      end
    end
  end
end

require_relative '../client'

module TrueAutomation
  module Driver
    class AppiumLib < Appium::Core::Driver
      def initialize(opts = {})
        @delegate_target = self # for testing purpose
        @automation_name = nil # initialise before 'set_automation_name'

        opts = Appium.symbolize_keys opts
        validate_keys(opts)

        @custom_url = opts.delete :url
        @caps = get_caps(opts)

        set_appium_lib_specific_values(get_appium_lib_opts(opts))
        set_app_path
        set_appium_device
        set_automation_name

        extend_for(device: @device, automation_name: @automation_name)

        @ta_client = TrueAutomation::Client.new
        @remote = ''

        self # rubocop:disable Lint/Void
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

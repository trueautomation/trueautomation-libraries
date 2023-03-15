require_relative '../client'

module TrueAutomation
  module Driver
    class Appium < Appium::Core::Driver
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

        self # rubocop:disable Lint/Void
      end

      def start_driver(server_url: nil,
                       http_client_ops: { http_client: nil, open_timeout: 999_999, read_timeout: 999_999 })
        @custom_url ||= server_url || "http://127.0.0.1:#{@port}/wd/hub"

        @http_client = get_http_client http_client: http_client_ops.delete(:http_client),
                                       open_timeout: http_client_ops.delete(:open_timeout),
                                       read_timeout: http_client_ops.delete(:read_timeout)

        if @enable_idempotency_header
          if @http_client.instance_variable_defined? :@additional_headers
            @http_client.additional_headers[Appium::Core::Base::Http::RequestHeaders::KEYS[:idempotency]] = SecureRandom.uuid
          else
            ::Appium::Logger.warn 'No additional_headers attribute in this http client instance'
          end
        end

        begin
          # included https://github.com/SeleniumHQ/selenium/blob/43f8b3f66e7e01124eff6a5805269ee441f65707/rb/lib/selenium/webdriver/remote/driver.rb#L29
          @driver = ::Appium::Core::Base::Driver.new(http_client: @http_client,
                                                     desired_capabilities: @caps,
                                                     url: @custom_url,
                                                     listener: @listener)

          if @direct_connect
            d_c = DirectConnections.new(@driver.capabilities)
            @driver.update_sending_request_to(protocol: d_c.protocol, host: d_c.host, port: d_c.port, path: d_c.path)
          end

          # export session
          write_session_id(@driver.session_id, @export_session_path) if @export_session
        rescue Errno::ECONNREFUSED
          raise "ERROR: Unable to connect to Appium. Is the server running on #{@custom_url}?"
        end

        if @http_client.instance_variable_defined? :@additional_headers
          # We only need the key for a new session request. Should remove it for other following commands.
          @http_client.additional_headers.delete Appium::Core::Base::Http::RequestHeaders::KEYS[:idempotency]
        end

        # If "automationName" is set only server side, this method set "automationName" attribute into @automation_name.
        # Since @automation_name is set only client side before start_driver is called.
        set_automation_name_if_nil

        set_implicit_wait_by_default(@default_wait)

        @driver
      end
    end
  end
end

require_relative '../client'
module Capybara
  module Queries
    class SelectorQuery
      alias_method :original_description, :description
      def description(only_applied = false)
        desc = original_description
        matched_result = desc.match(/.*__taonly__(.+)__taonly__.*/)
        if selector = matched_result && matched_result[1]
          desc = "Element was not found on the page. Element '#{selector}' with such locator is not on this page and could not be detected by TrueAutomation."
        end
        matched_result_ta = desc.match(/visible\s(.+)\s\"(.*)__ta__(.+)__ta__.*/)
        if matched_result_ta && matched_result_ta[3]
          desc = "Unable to locate element { using: '#{matched_result_ta[1]}', selector: '#{matched_result_ta[2]}' }"
        end
        desc
      end
    end
  end
end

module Capybara
  module Node
    module Finders
      private
      alias_method :original_synced_resolve, :synced_resolve
      def synced_resolve(query)
        begin
          original_synced_resolve(query)
        rescue Capybara::ElementNotFound => ex
          raise Capybara::ElementNotFound, query.applied_description if query.locator.match(/.*__ta(only)*__(.+)__ta(only)*__.*/)
          raise Capybara::ElementNotFound, ex
        end
      end
    end
  end
end

module Capybara
  module Node
    class Element < Base
      def innerHTML=(value)
        synchronize { base.innerHTML=(value) }
      end
    end
  end
end

class Capybara::Selenium::Node < Capybara::Driver::Node
  def innerHTML=(value)
    driver.evaluate_script SET_INNER_HTML_SCRIPT, self, value
  end

private

  SET_INNER_HTML_SCRIPT = <<~'JS'
    (function(el, val, xml){
      el.innerHTML = val;
      return;
    })(arguments[0], arguments[1], document)
  JS
end

module TrueAutomation
  class RecordNotFound < StandardError; end

  module Driver
    class Capybara < Capybara::Selenium::Driver
      def initialize(app, **options)
        options = fetch_options(options)
        @port = options.delete(:port) || find_available_port('localhost')
        @driver = options.delete(:driver)
        @driver_version = options.delete(:driver_version)

        if options && options[:ta_debug]
          @ta_debug = ' --ta-debug'
          options.delete(:ta_debug)
        end

        if options[:ta_service]
          @ta_service = options.delete(:ta_service)
        end

        super(app, options)

        @ta_client = TrueAutomation::Client.new
        @remote = ''

        options ||= {}
        ta_url = options[:ta_url] || "http://localhost:#{@port}/"

        capabilities = options[:desired_capabilities] || {}

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
          @ta_client.start(port: @port,
                           remote: @remote,
                           ta_debug: @ta_debug,
                           driver: @driver,
                           ta_service_path: @ta_service&.executable_path,
                           driver_version: @driver_version)

          @ta_client.wait_until_start

          at_exit do
            @ta_client.stop
          end
          super
        end
        @browser
      end

      def quit
        super
        @ta_client.stop
      end

      def specialize_driver(*args)
        if ::Capybara::Selenium::Driver.respond_to?(:register_specialization)
          browser_type = browser.browser
          # Original method uses self.class, and all classes use Capybara::Selenium::Driver.
          # Thereby no specializations in the list for TA driver class and error occured.
          ::Capybara::Selenium::Driver.specializations.select { |k, _v| k === browser_type }.each_value do |specialization| # rubocop:disable Style/CaseEquality
            extend specialization
          end
        else
          super
        end
      end

      private
      def fetch_options(options)
        if options.key?(:options)
          browser = options[:options].class.name.split('::')[2]
          desCaps = Selenium::WebDriver::Remote::Capabilities.send(browser.downcase)
          opts = options[:options].as_json
          desCaps[opts.keys.first] = opts[opts.keys.first]
          options[:desired_capabilities] = desCaps
          options.delete(:options)
        end
        options
      end

      def find_available_port(host)
        server = TCPServer.new(host, rand(9515..65515))
        server.addr[1]
      ensure
        server&.close
      end
    end
  end
end

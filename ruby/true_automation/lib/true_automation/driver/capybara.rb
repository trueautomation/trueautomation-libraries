require_relative '../client'
module Capybara
  module Queries
    class SelectorQuery
      alias_method :original_description, :description
      def description(only_applied = false)
        desc = original_description
        matched_result = desc.match(/.*__taonly__(.+)__taonly__.*/)
        if selector = matched_result && matched_result[1]
          desc = "TrueAutomation element #{selector} on the page"
        end
        matched_result_ta = desc.match(/.*(__ta__.+__ta__).*/)
        if selector = matched_result_ta && matched_result_ta[1]
          desc = desc.gsub(selector, '')
        end
        desc
      end
    end
  end
end

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
                           driver: @driver,
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
    end
  end
end

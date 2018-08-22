require_relative '../client'

module TrueAutomation
  class RecordNotFound < StandardError; end

  module Driver
    class Capybara < Capybara::Selenium::Driver
      def initialize(app, **options)
        @port = options.delete(:port) || 9515

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
          @remote = '--remote'
        else
          capabilities[:browser] = options[:browser] || :chrome
        end

        @options.merge!(browser: :remote,
                        url: ta_url,
                        desired_capabilities: capabilities)
      end

      def browser
        unless @browser
          @ta_client.start(port: @port, remote: @remote)

          @ta_client.wait_until_start

          at_exit do
            @ta_client.stop
          end

          super
        end
        @browser
      end

      def find_css(selector)
        res = super
        if (!res || res.empty?)
          check_selector(selector)
        end
        res
      end

      def find_xpath(selector)
        res = super
        if (!res || res.empty?)
          check_selector(selector)
        end
        res
      end

      private

      def check_selector(selector)
        if ta_selector_match = selector.match(/__taonly__(.+)__taonly__/)
          error_text = "Element '#{ta_selector_match[1]}' was not found in database. " +
                       'Please provide a selector to find and initialize element.'
          raise TrueAutomation::RecordNotFound.new(error_text)
        end
      end
    end
  end
end

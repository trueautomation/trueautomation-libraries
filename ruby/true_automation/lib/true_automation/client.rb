require 'open3'
require 'json'
require 'mkmf'
require 'net/http'

module TrueAutomation
  class Client
    @pid = nil

    def start(options)

      @port = options[:port] || 9515
      @executable = ENV['TRUEAUTOMATION_EXEC'] || 'trueautomation'

      if find_executable(@executable).nil?
        raise "`#{@executable}` not found. Can not find TrueAutomation.IO client"
      end

      trueautomation_version = `#{@executable} --version`
      puts "TrueAutomation.IO client #{trueautomation_version.strip}"

      Dir.mkdir('log') unless File.exist?('log')
      logfile = "log/trueautomation-#{Time.now.strftime('%Y%m%dT%H%M%S')}.log"

      @pid = spawn("#{@executable} --log-file #{logfile} --port #{@port}")
      puts "Started TrueAutomation.IO client with pid #{@pid} listening to port #{@port}"

      @pid
    end

    def stop
      if @pid
        puts "Stopping TrueAutomation.IO Client with pid #{@pid}"
        uri = URI("http://localhost:#{@port}/shutdown")
        Net::HTTP.get(uri)

        @pid = nil
      end
    end

    def wait_until_start
      counter = 0
      loop do
        break if check_connection or counter >= 10
        counter += 1
        sleep 2
      end
    end

    private

    def check_connection
      Socket.tcp('localhost', @port, connect_timeout: 2) { true } rescue false
    end
  end
end

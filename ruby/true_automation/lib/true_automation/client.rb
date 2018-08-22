require 'open3'
require 'json'
require 'mkmf'
require 'net/http'
require 'find'

module TrueAutomation
  class Client
    @pid = nil

    def start(options)

      @port = options[:port] || 9515
      remote = options[:remote]
      current_driver = driver(options[:driver], options[:driver_version])
      driver_path = " --driver #{current_driver}" if current_driver

      @executable = ENV['TRUEAUTOMATION_EXEC'] || 'trueautomation'

      if find_executable(@executable).nil?
        raise "`#{@executable}` not found. Can not find TrueAutomation.IO client"
      end

      trueautomation_version = `#{@executable} --version`
      puts "TrueAutomation.IO client #{trueautomation_version.strip}"

      Dir.mkdir('log') unless File.exist?('log')
      logfile = "log/trueautomation-#{Time.now.strftime('%Y%m%dT%H%M%S')}.log"

      @pid = spawn("#{@executable} --log-file #{logfile} --port #{@port}#{driver_path}#{remote}")
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

    def driver(name, version)
      return unless name || version
      raise 'Options :driver and :dirver_version should present together' unless name && version

      drivers = Find.find(File.join(Dir.home, '.trueautomation', name)).select {|f| f =~ /#{name}.+_#{version}/}

      raise "Ambiguous driver version #{version} for #{name}. Please check the driver version." if drivers.length > 1
      raise "Driver #{name} with version #{version} not found. Please run command to download this driver version `trueautomation driver download #{name} #{version}`" if drivers.empty?

      drivers.first
    end
  end
end

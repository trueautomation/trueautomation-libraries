
lib = File.expand_path('../lib', __FILE__)
$LOAD_PATH.unshift(lib) unless $LOAD_PATH.include?(lib)
require 'true_automation/version'

Gem::Specification.new do |spec|
  spec.name          = 'true_automation'
  spec.version       = TrueAutomation::VERSION
  spec.authors       = ['TrueAutomation.IO']
  spec.email         = ['info@trueautomation.io']

  spec.summary       = 'TrueAutomation.IO '

  spec.description   = <<-DESCRIPTION
  true_automation gem enables awesome TrueAutomation.IO features for Capybara and Watir projects.
  DESCRIPTION

  spec.homepage      = 'http://trueautomation.io'
  spec.license       = 'MIT'

  spec.files         = `git ls-files -z`.split("\x0").reject do |f|
    f.match(%r{^(test|spec|features)/})
  end
  spec.bindir        = 'exe'
  spec.executables   = spec.files.grep(%r{^exe/}) { |f| File.basename(f) }
  spec.require_paths = ['lib']

  spec.add_development_dependency 'bundler', '~> 2.4'
  spec.add_development_dependency 'minitest', '~> 5.0'
  spec.add_development_dependency 'rake', '~> 10.0'
  spec.add_development_dependency 'rspec', '~> 3.4'
  spec.add_development_dependency 'appium_lib', '~> 11.2'
  spec.add_development_dependency 'appium_lib_core', '~> 4.2'
end

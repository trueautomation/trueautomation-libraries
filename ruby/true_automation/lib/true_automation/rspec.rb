require 'rspec/core'
require 'true_automation/dsl'

RSpec.configure do |config|
  config.include TrueAutomation::DSL, type: :feature
end
